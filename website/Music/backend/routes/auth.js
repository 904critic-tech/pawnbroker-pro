const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate referral code
const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, referralCode } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email or username already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate unique referral code
        let userReferralCode = generateReferralCode();
        let referralExists = true;
        while (referralExists) {
            const existingCode = await query(
                'SELECT id FROM users WHERE referral_code = $1',
                [userReferralCode]
            );
            if (existingCode.rows.length === 0) {
                referralExists = false;
            } else {
                userReferralCode = generateReferralCode();
            }
        }

        // Find referrer if referral code provided
        let referrerId = null;
        if (referralCode) {
            const referrer = await query(
                'SELECT id FROM users WHERE referral_code = $1',
                [referralCode]
            );
            if (referrer.rows.length > 0) {
                referrerId = referrer.rows[0].id;
            }
        }

        // Create user
        const result = await query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, referral_code, referred_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, username, email, first_name, last_name, is_artist, is_verified, referral_code, wallet_balance`,
            [username, email, passwordHash, firstName, lastName, userReferralCode, referrerId]
        );

        const user = result.rows[0];

        // Create referral record if referrer exists
        if (referrerId) {
            await query(
                'INSERT INTO referrals (referrer_id, referee_id) VALUES ($1, $2)',
                [referrerId, user.id]
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                isArtist: user.is_artist,
                isVerified: user.is_verified,
                referralCode: user.referral_code,
                walletBalance: user.wallet_balance
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await query(
            `SELECT u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name, 
                    u.is_artist, u.is_verified, u.referral_code, u.wallet_balance,
                    a.artist_name, a.total_earnings, a.total_tips
             FROM users u
             LEFT JOIN artists a ON u.id = a.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                isArtist: user.is_artist,
                isVerified: user.is_verified,
                referralCode: user.referral_code,
                walletBalance: user.wallet_balance,
                artistName: user.artist_name,
                totalEarnings: user.total_earnings,
                totalTips: user.total_tips
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.avatar_url, u.bio,
                    u.is_artist, u.is_verified, u.referral_code, u.wallet_balance, u.created_at,
                    a.artist_name, a.social_links, a.total_earnings, a.total_tips, a.total_streams, a.total_downloads
             FROM users u
             LEFT JOIN artists a ON u.id = a.id
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: user.avatar_url,
                bio: user.bio,
                isArtist: user.is_artist,
                isVerified: user.is_verified,
                referralCode: user.referral_code,
                walletBalance: user.wallet_balance,
                createdAt: user.created_at,
                artistName: user.artist_name,
                socialLinks: user.social_links,
                totalEarnings: user.total_earnings,
                totalTips: user.total_tips,
                totalStreams: user.total_streams,
                totalDownloads: user.total_downloads
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout (client-side token removal, but we can invalidate server-side if needed)
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // In a more advanced implementation, you might want to add the token to a blacklist
        // For now, we'll just return success and let the client remove the token
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Refresh token (optional - for extending session)
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        // Generate new token
        const token = jwt.sign(
            { userId: req.user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Token refreshed successfully',
            token
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
