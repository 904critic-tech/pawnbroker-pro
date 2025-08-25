import { supabase, supabaseAdmin, generateReferralCode } from '../lib/supabase.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { username, email, password, referralCode } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Username, email, and password are required'
        });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},username.eq.${username}`)
        .single();

      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
          message: 'A user with this email or username already exists'
        });
      }

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return res.status(400).json({
          error: 'Registration failed',
          message: authError.message
        });
      }

      // Create user profile in database
      const userReferralCode = generateReferralCode();
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          username,
          email,
          referral_code: userReferralCode,
          is_artist: false
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return res.status(500).json({
          error: 'Profile creation failed',
          message: 'Failed to create user profile'
        });
      }

      // Handle referral if provided
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .single();

        if (referrer) {
          await supabaseAdmin
            .from('referrals')
            .insert({
              referrer_id: referrer.id,
              referee_id: authUser.user.id
            });
        }
      }

      // Get session for token
      const { data: session, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        return res.status(500).json({
          error: 'Session creation failed',
          message: 'Failed to create user session'
        });
      }

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: authUser.user.id,
          username: userProfile.username,
          email: userProfile.email,
          referralCode: userProfile.referral_code,
          isArtist: userProfile.is_artist,
          createdAt: userProfile.created_at
        },
        token: session.session.access_token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
