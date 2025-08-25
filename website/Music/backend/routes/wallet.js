const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance and transactions
router.get('/balance', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get current balance
        const balanceResult = await query(
            'SELECT wallet_balance FROM users WHERE id = $1',
            [req.user.id]
        );

        if (balanceResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const balance = balanceResult.rows[0].wallet_balance;

        // Get recent transactions
        const transactionsResult = await query(
            `SELECT id, type, amount, balance_after, description, reference_id, created_at
             FROM wallet_transactions
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        const transactions = transactionsResult.rows.map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            balanceAfter: tx.balance_after,
            description: tx.description,
            referenceId: tx.reference_id,
            createdAt: tx.created_at
        }));

        res.json({
            balance: balance,
            transactions: transactions
        });

    } catch (error) {
        console.error('Get wallet balance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send tip to artist
router.post('/tip', authenticateToken, async (req, res) => {
    try {
        const { artistId, trackId, amount, message, isAnonymous } = req.body;

        // Validation
        if (!artistId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Artist ID and valid amount are required' });
        }

        // Check if user has sufficient balance
        const userResult = await query(
            'SELECT wallet_balance FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = userResult.rows[0].wallet_balance;

        if (currentBalance < amount) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        // Verify artist exists
        const artistResult = await query(
            'SELECT id FROM artists WHERE id = $1',
            [artistId]
        );

        if (artistResult.rows.length === 0) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        // Verify track exists if provided
        if (trackId) {
            const trackResult = await query(
                'SELECT id FROM tracks WHERE id = $1 AND artist_id = $2',
                [trackId, artistId]
            );

            if (trackResult.rows.length === 0) {
                return res.status(404).json({ error: 'Track not found' });
            }
        }

        // Start transaction
        const client = await query.pool.connect();

        try {
            await client.query('BEGIN');

            // Create tip record
            const tipResult = await client.query(
                `INSERT INTO tips (from_user_id, to_artist_id, track_id, amount, message, is_anonymous)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [req.user.id, artistId, trackId, amount, message, isAnonymous || false]
            );

            const tipId = tipResult.rows[0].id;

            // Update user wallet balance
            const newBalance = currentBalance - amount;
            await client.query(
                'UPDATE users SET wallet_balance = $1 WHERE id = $2',
                [newBalance, req.user.id]
            );

            // Record wallet transaction
            await client.query(
                `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [req.user.id, 'tip_sent', -amount, newBalance, `Tip to artist`, tipId]
            );

            // Update artist total tips
            await client.query(
                'UPDATE artists SET total_tips = total_tips + $1 WHERE id = $2',
                [amount, artistId]
            );

            // Update track tip count if track provided
            if (trackId) {
                await client.query(
                    'UPDATE tracks SET tip_count = tip_count + 1, total_tips = total_tips + $1 WHERE id = $2',
                    [amount, trackId]
                );
            }

            // Record artist's received tip transaction
            await client.query(
                `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [artistId, 'tip_received', amount, 0, `Tip received`, tipId]
            );

            await client.query('COMMIT');

            res.json({
                message: 'Tip sent successfully',
                tipId: tipId,
                newBalance: newBalance
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Send tip error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add ad revenue to wallet (called by ad system)
router.post('/add-ad-revenue', async (req, res) => {
    try {
        const { userId, amount, pageUrl, adType } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'User ID and valid amount are required' });
        }

        // Get current balance
        const userResult = await query(
            'SELECT wallet_balance FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = userResult.rows[0].wallet_balance;
        const newBalance = currentBalance + amount;

        // Start transaction
        const client = await query.pool.connect();

        try {
            await client.query('BEGIN');

            // Update user wallet balance
            await client.query(
                'UPDATE users SET wallet_balance = $1 WHERE id = $2',
                [newBalance, userId]
            );

            // Record wallet transaction
            await client.query(
                `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, 'ad_revenue', amount, newBalance, `Ad revenue from ${pageUrl}`]
            );

            // Record ad revenue
            await client.query(
                `INSERT INTO ad_revenue (user_id, page_url, ad_type, revenue, ip_address)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, pageUrl, adType, amount, req.ip]
            );

            await client.query('COMMIT');

            res.json({
                message: 'Ad revenue added successfully',
                newBalance: newBalance
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Add ad revenue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get wallet statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // Get total earnings from ad revenue
        const adRevenueResult = await query(
            `SELECT SUM(amount) as total_ad_revenue
             FROM wallet_transactions
             WHERE user_id = $1 AND type = 'ad_revenue'`,
            [req.user.id]
        );

        // Get total tips sent
        const tipsSentResult = await query(
            `SELECT SUM(amount) as total_tips_sent
             FROM wallet_transactions
             WHERE user_id = $1 AND type = 'tip_sent'`,
            [req.user.id]
        );

        // Get total tips received (if user is an artist)
        const tipsReceivedResult = await query(
            `SELECT SUM(amount) as total_tips_received
             FROM wallet_transactions
             WHERE user_id = $1 AND type = 'tip_received'`,
            [req.user.id]
        );

        // Get referral bonuses
        const referralBonusResult = await query(
            `SELECT SUM(amount) as total_referral_bonus
             FROM wallet_transactions
             WHERE user_id = $1 AND type = 'referral_bonus'`,
            [req.user.id]
        );

        res.json({
            totalAdRevenue: parseFloat(adRevenueResult.rows[0].total_ad_revenue || 0),
            totalTipsSent: Math.abs(parseFloat(tipsSentResult.rows[0].total_tips_sent || 0)),
            totalTipsReceived: parseFloat(tipsReceivedResult.rows[0].total_tips_received || 0),
            totalReferralBonus: parseFloat(referralBonusResult.rows[0].total_referral_bonus || 0)
        });

    } catch (error) {
        console.error('Get wallet stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
