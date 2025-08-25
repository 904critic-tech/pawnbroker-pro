// Vercel serverless function to handle alpha access requests
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { name, email, platform, username, audience, useCase } = req.body;
        
        // Validate required fields
        if (!name || !email || !platform || !username || !useCase) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const platformDisplay = platform === 'twitch' ? `Twitch: ${username}` : `TikTok Live: ${username}`;
        
        // Email content
        const emailSubject = `ALPHA REQUEST: ${name} - ${platformDisplay}`;
        const emailBody = `
New Alpha Access Request:

Name: ${name}
Email: ${email}
Platform: ${platform === 'twitch' ? 'Twitch' : 'TikTok Live'}
Username: ${username}
Audience Size: ${audience || 'Not specified'}

Use Case:
${useCase}

---
Request submitted from: https://streamautoclipper.shop/alpha-access.html
Time: ${new Date().toISOString()}
IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}
User Agent: ${req.headers['user-agent']}
        `.trim();
        
        // Send email using Nodemailer or webhook
        try {
            // Option 1: Simple webhook for immediate testing
            const webhookUrl = process.env.ALPHA_REQUEST_WEBHOOK_URL || 'https://webhook.site/your-unique-url';
            
            if (webhookUrl.includes('webhook.site') || webhookUrl.includes('requestcatcher')) {
                // Send to webhook for testing
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'alpha_request',
                        subject: emailSubject,
                        body: emailBody,
                        data: {
                            name,
                            email,
                            platform: platformDisplay,
                            audience,
                            useCase,
                            timestamp: new Date().toISOString(),
                            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                            userAgent: req.headers['user-agent']
                        }
                    })
                });
            }
            
            // Option 2: Direct email using environment variables
            if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
                const nodemailer = require('nodemailer');
                
                const transporter = nodemailer.createTransporter({
                    host: process.env.SMTP_HOST,
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
                
                await transporter.sendMail({
                    from: `"Alpha Requests" <${process.env.SMTP_USER}>`,
                    to: 'streamautoclipper@gmail.com',
                    subject: emailSubject,
                    text: emailBody,
                    html: `<pre style="font-family: monospace; white-space: pre-wrap;">${emailBody.replace(/\n/g, '<br>')}</pre>`
                });
            }
            
            // Always log for monitoring
            console.log('Alpha Request Received:', {
                name,
                email,
                platform: platformDisplay,
                audience,
                useCase: useCase.substring(0, 100) + '...',
                timestamp: new Date().toISOString()
            });
            
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue execution - we'll still return success to user
        }
        
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Alpha access request submitted successfully!',
            data: {
                name,
                email,
                platform: platformDisplay,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Alpha request error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process alpha request'
        });
    }
}
