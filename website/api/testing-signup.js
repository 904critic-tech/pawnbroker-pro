export default async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            const { email } = req.body;

            // Validate required fields
            if (!email) {
                return res.status(400).json({ 
                    error: 'Email is required' 
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    error: 'Invalid email format' 
                });
            }

            const signupData = {
                email: email.trim().toLowerCase(),
                timestamp: new Date().toISOString(),
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
            };

            // Log the signup (this will appear in Vercel logs)
            console.log('=== NEW TESTING SIGNUP ===');
            console.log(`Email: ${signupData.email}`);
            console.log(`Timestamp: ${signupData.timestamp}`);
            console.log(`IP: ${signupData.ip}`);
            console.log('==========================');

            // Send email notification using Resend
            try {
                console.log('Attempting to send email notification...');
                const { Resend } = require('resend');
                const resend = new Resend('re_Mr1XkTMb_JGN3n4aJtXJ8NUf3oiAJF1Ho');
                
                console.log('Resend client created, sending email...');
                
                const { data, error } = await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: ['904critic@gmail.com'],
                    subject: 'New Testing Signup - Guided Light App',
                    text: `New signup: ${signupData.email} at ${signupData.timestamp}`,
                });

                if (error) {
                    console.error('Resend error details:', JSON.stringify(error, null, 2));
                } else {
                    console.log('Email sent successfully with ID:', data?.id);
                }
            } catch (emailError) {
                console.error('Email service error:', emailError);
                console.error('Error stack:', emailError.stack);
                // Continue without email - the signup is still logged
            }

            // Return success
            res.status(200).json({ 
                success: true, 
                message: 'Successfully signed up for testing!',
                signupId: signupData.timestamp
            });

        } catch (error) {
            console.error('Error processing signup:', error);
            res.status(500).json({ 
                error: 'Internal server error' 
            });
        }
    } else {
        res.status(405).json({ 
            error: 'Method not allowed' 
        });
    }
};
