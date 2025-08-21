// Vercel serverless function for eBay webhooks
// This should be placed in: /api/ebay-webhook/verify.js and /api/ebay-webhook/notifications.js

// eBay webhook verification token
const VERIFICATION_TOKEN = 'pawnbroker-pro-ebay-webhook-2025';

// Webhook verification endpoint
export default function handler(req, res) {
  if (req.method === 'GET') {
    // Handle webhook verification
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
  } else if (req.method === 'POST') {
    // Handle webhook notifications
    console.log('📨 eBay webhook notification received');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    try {
      const notification = req.body;
      
      // Handle different types of notifications
      if (notification.metadata && notification.metadata.topic) {
        const topic = notification.metadata.topic;
        
        switch (topic) {
          case 'MARKETPLACE_ACCOUNT_DELETION':
            console.log('🗑️  Marketplace account deletion notification');
            // Handle account deletion - you can add your logic here
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
