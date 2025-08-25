export default async function handler(req, res) {
  try {
    const method = req.method || 'GET';
    if (method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const user = String((req.query && req.query.user) || '').trim().toLowerCase();
    if (!user) {
      return res.status(400).json({ error: 'Missing user' });
    }

    const toList = (s = '') =>
      String(s)
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

    const online = new Set(toList(process.env.LIVE_USERS_ONLINE));
    const offline = new Set(toList(process.env.LIVE_USERS_OFFLINE));

    if (offline.has(user)) {
      return res.status(200).json({ is_live: false });
    }
    if (online.has(user)) {
      return res.status(200).json({ is_live: true });
    }

    // Unknown: let client treat as "Ready" (neither live nor offline).
    return res.status(200).json({ status: 'unknown' });
  } catch (_e) {
    try { return res.status(200).json({ status: 'unknown' }); } catch {} // safe fallback
  }
}


