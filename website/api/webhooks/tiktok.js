import crypto from 'crypto';

// In-memory idempotency cache with TTL (per runtime instance)
const IDEMPOTENCY_CACHE = new Map(); // key -> expiryEpochMs
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes
const IDEMPOTENCY_MAX_ENTRIES = 5000;

function pruneIdempotencyCache() {
  if (IDEMPOTENCY_CACHE.size <= IDEMPOTENCY_MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, exp] of IDEMPOTENCY_CACHE) {
    if (exp <= now) {
      IDEMPOTENCY_CACHE.delete(key);
    }
  }
  // If still large, drop oldest entries
  if (IDEMPOTENCY_CACHE.size > IDEMPOTENCY_MAX_ENTRIES) {
    const keys = Array.from(IDEMPOTENCY_CACHE.keys());
    for (let i = 0; i < keys.length && IDEMPOTENCY_CACHE.size > IDEMPOTENCY_MAX_ENTRIES; i++) {
      IDEMPOTENCY_CACHE.delete(keys[i]);
    }
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(200).json({ ok: true });
    }

    const sigHeader = req.headers['tiktok-signature'] || req.headers['tik-tok-signature'] || '';
    const secret = process.env.TIKTOK_CLIENT_SECRET || '';

    const parseSig = (header) => {
      const parts = String(header).split(',').map(s => s.trim());
      let t = null, s = null;
      for (const p of parts) {
        const [k, v] = p.split('=');
        if (k === 't') t = v;
        if (k === 's') s = v;
      }
      return { t, s };
    };

    // Build raw body string (best effort). If platform exposes raw body, prefer it.
    const raw = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body || {});
    const { t, s } = parseSig(sigHeader);

    const verify = () => {
      if (!secret || !t || !s || !raw) return false;
      const signedPayload = `${t}.${raw}`;
      const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
      // constant-time compare
      const a = Buffer.from(expected);
      const b = Buffer.from(s);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    };

    // Timestamp tolerance (5 minutes)
    const fresh = () => {
      const now = Math.floor(Date.now() / 1000);
      const ts = parseInt(t || '0', 10);
      return Number.isFinite(ts) && Math.abs(now - ts) <= 300;
    };

    const isValid = verify();
    const isFresh = fresh();

    // Build idempotency key from stable identifiers when available
    const body = req.body || {};
    const eventName = body?.event || null;
    const userOpenId = body?.user_openid || null;
    const publishId = body?.publish_id || body?.content?.publish_id || null;
    const eventId = body?.event_id || null;
    const idemSource = eventId || publishId || `${eventName || 'event'}:${userOpenId || 'anon'}`;
    const idempotencyKey = crypto.createHash('sha256').update(`${idemSource}|${raw}`).digest('hex');

    // Record validation result in response headers; still ACK 200 per TikTok requirement
    res.setHeader('X-Webhook-Validated', isValid && isFresh ? 'true' : 'false');
    res.status(200).json({ ok: true });

    // After ACK: enforce validation and idempotency
    if (!isValid || !isFresh) {
      console.log('[tiktok_webhook] drop invalid or stale', { isValid, isFresh });
      return;
    }

    // Idempotency check
    const nowMs = Date.now();
    pruneIdempotencyCache();
    if (IDEMPOTENCY_CACHE.has(idempotencyKey)) {
      console.log('[tiktok_webhook] duplicate dropped', { event: eventName, idempotencyKey });
      return;
    }
    IDEMPOTENCY_CACHE.set(idempotencyKey, nowMs + IDEMPOTENCY_TTL_MS);

    // Process events (minimal demo)
    try {
      const content = body?.content ? JSON.parse(body.content) : {};
      switch (eventName) {
        case 'post.publish.inbox_delivered':
        case 'post.publish.complete':
        case 'post.publish.publicly_available':
        case 'post.publish.failed':
        case 'video.upload.failed':
        case 'video.publish.completed':
        case 'authorization.removed':
          console.log('[tiktok_webhook] handle event:', eventName, content);
          break;
        default:
          console.log('[tiktok_webhook] unhandled event:', eventName);
      }
    } catch (e) {
      console.log('[tiktok_webhook] handler error', e?.message);
    }
  } catch (e) {
    try { res.status(200).json({ ok: true }); } catch (_ignored) {}
  }
}

