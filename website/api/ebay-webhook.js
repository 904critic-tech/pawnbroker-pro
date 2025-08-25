// File: /api/ebay-webhook.js
// eBay webhook for streamautoclipper.shop

// eBay webhook verification token
const VERIFICATION_TOKEN = 'pawnbroker-pro-ebay-webhook-2025';

// Import crypto for SHA256 hashing
import { createHash } from 'crypto';

export default function handler(req, res) {
  // Enable CORS for eBay
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Handle eBay marketplace account deletion challenge
    const challengeCode = req.query['challenge_code'];
    const endpoint = `https://${req.headers.host}${req.url.split('?')[0]}`;

    console.log('🔔 eBay marketplace account deletion challenge received');
    console.log('Challenge Code:', challengeCode);
    console.log('Endpoint:', endpoint);

    if (challengeCode) {
      try {
        // Create SHA256 hash: challengeCode + verificationToken + endpoint
        const hash = createHash('sha256');
        hash.update(challengeCode);
        hash.update(VERIFICATION_TOKEN);
        hash.update(endpoint);
        const responseHash = hash.digest('hex');

        console.log('✅ Challenge response hash generated:', responseHash);

        // Return JSON response with challengeResponse field
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          challengeResponse: responseHash
        });
      } catch (error) {
        console.error('❌ Error generating challenge response:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      console.log('❌ No challenge code provided');
      res.status(400).json({ error: 'Missing challenge_code parameter' });
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
            console.log('Username:', notification.notification?.data?.username);
            console.log('User ID:', notification.notification?.data?.userId);
            console.log('EIAS Token:', notification.notification?.data?.eiasToken);
            
            // Handle account deletion - you can add your logic here
            // For example, send an email, update database, etc.
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
