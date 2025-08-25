const express = require('express');
const router = express.Router();

// eBay webhook verification token - use environment variable
const VERIFICATION_TOKEN = process.env.WEBHOOK_VERIFICATION_TOKEN || 'dev-webhook-token';

// Validate webhook token is set
if (!process.env.WEBHOOK_VERIFICATION_TOKEN) {
  console.warn('⚠️  WEBHOOK_VERIFICATION_TOKEN not set in environment variables');
}

// Handle webhook verification
router.get('/verify', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔔 eBay webhook verification request received');
  console.log('Mode:', mode);
  console.log('Token:', token);
  console.log('Challenge:', challenge);

  if (mode === 'subscribe' && token === VERIFICATION_TOKEN) {
    console.log('✅ Webhook verification successful');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// Handle webhook notifications
router.post('/notifications', (req, res) => {
  console.log('📨 eBay webhook notification received');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    // Verify webhook signature (if provided by eBay)
    const signature = req.headers['x-ebay-signature'];
    const timestamp = req.headers['x-ebay-timestamp'];
    
    if (signature && process.env.WEBHOOK_VERIFICATION_TOKEN) {
      // Implement HMAC signature verification
      const crypto = require('crypto');
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_VERIFICATION_TOKEN)
        .update(payload)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.log('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      console.log('✅ Webhook signature verified');
    }
    
    // Verify the notification is from eBay
    const notification = req.body;
    
    // Handle different types of notifications
    if (notification.metadata && notification.metadata.topic) {
      const topic = notification.metadata.topic;
      
      switch (topic) {
        case 'MARKETPLACE_ACCOUNT_DELETION':
          console.log('🗑️  Marketplace account deletion notification');
          // Handle account deletion
          break;
        case 'ITEM_SOLD':
          console.log('💰 Item sold notification');
          // Handle item sold
          break;
        case 'ITEM_UPDATED':
          console.log('📝 Item updated notification');
          // Handle item update
          break;
        default:
          console.log(`📋 Unknown notification topic: ${topic}`);
      }
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ 
      status: 'success', 
      message: 'Notification received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error processing webhook notification:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error' 
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'eBay Webhooks',
    tokenConfigured: !!process.env.WEBHOOK_VERIFICATION_TOKEN,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
