const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's referral information
router.get('/info', authenticateToken, async (req, res) => {
    try {
        // Get user's referral code
        const userResult = await query(
            'SELECT referral_code FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const referralCode = userResult.rows[0].referral_code;

        // Get referral statistics
        const statsResult = await query(
            `SELECT 
                COUNT(*) as total_referrals,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_referrals,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals
             FROM referrals
             WHERE referrer_id = $1`,
            [req.user.id]
        );

        // Get recent referrals
        const referralsResult = await query(
            `SELECT r.id, r.status, r.created_at, r.bonus_paid,
                    u.username as referee_username, u.created_at as referee_joined
             FROM referrals r
             JOIN users u ON r.referee_id = u.id
             WHERE r.referrer_id = $1
             ORDER BY r.created_at DESC
             LIMIT 10`,
            [req.user.id]
        );

        const referrals = referralsResult.rows.map(ref => ({
            id: ref.id,
            status: ref.status,
            createdAt: ref.created_at,
            bonusPaid: ref.bonus_paid,
            referee: {
                username: ref.referee_username,
                joinedAt: ref.referee_joined
            }
        }));

        res.json({
            referralCode: referralCode,
            referralUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?ref=${referralCode}`,
            stats: {
                totalReferrals: parseInt(statsResult.rows[0].total_referrals),
                completedReferrals: parseInt(statsResult.rows[0].completed_referrals),
                pendingReferrals: parseInt(statsResult.rows[0].pending_referrals)
            },
            recentReferrals: referrals
        });

    } catch (error) {
        console.error('Get referral info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get referral earnings
router.get('/earnings', authenticateToken, async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        let timeFilter = '';
        if (period === 'week') {
            timeFilter = 'AND r.created_at >= NOW() - INTERVAL \'7 days\'';
        } else if (period === 'month') {
            timeFilter = 'AND r.created_at >= NOW() - INTERVAL \'30 days\'';
        } else if (period === 'year') {
            timeFilter = 'AND r.created_at >= NOW() - INTERVAL \'1 year\'';
        }

        // Get referral earnings from ad revenue
        const earningsResult = await query(
            `SELECT 
                DATE(r.created_at) as date,
                COUNT(DISTINCT r.referee_id) as new_referrals,
                SUM(ar.revenue) as total_earnings
             FROM referrals r
             LEFT JOIN ad_revenue ar ON r.referee_id = ar.user_id
             WHERE r.referrer_id = $1 ${timeFilter}
             GROUP BY DATE(r.created_at)
             ORDER BY date DESC`,
            [req.user.id]
        );

        // Get total earnings
        const totalResult = await query(
            `SELECT SUM(ar.revenue) as total_earnings
             FROM referrals r
             JOIN ad_revenue ar ON r.referee_id = ar.user_id
             WHERE r.referrer_id = $1 ${timeFilter}`,
            [req.user.id]
        );

        res.json({
            earnings: earningsResult.rows,
            totalEarnings: parseFloat(totalResult.rows[0].total_earnings || 0)
        });

    } catch (error) {
        console.error('Get referral earnings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Process referral bonus (called when referee completes requirements)
router.post('/process-bonus', async (req, res) => {
    try {
        const { referralId } = req.body;

        if (!referralId) {
            return res.status(400).json({ error: 'Referral ID is required' });
        }

        // Get referral info
        const referralResult = await query(
            `SELECT r.id, r.referrer_id, r.referee_id, r.status, r.bonus_paid
             FROM referrals r
             WHERE r.id = $1`,
            [referralId]
        );

        if (referralResult.rows.length === 0) {
            return res.status(404).json({ error: 'Referral not found' });
        }

        const referral = referralResult.rows[0];

        if (referral.bonus_paid) {
            return res.status(400).json({ error: 'Bonus already paid' });
        }

        // Calculate bonus based on referee's ad revenue
        const adRevenueResult = await query(
            `SELECT SUM(revenue) as total_revenue
             FROM ad_revenue
             WHERE user_id = $1`,
            [referral.referee_id]
        );

        const totalRevenue = parseFloat(adRevenueResult.rows[0].total_revenue || 0);
        const bonusAmount = totalRevenue * 0.05; // 5% of referee's ad revenue

        if (bonusAmount <= 0) {
            return res.status(400).json({ error: 'No bonus to process' });
        }

        // Start transaction
        const client = await query.pool.connect();

        try {
            await client.query('BEGIN');

            // Update referral status
            await client.query(
                'UPDATE referrals SET status = $1, bonus_paid = $2 WHERE id = $3',
                ['completed', true, referralId]
            );

            // Add bonus to referrer's wallet
            const referrerResult = await client.query(
                'SELECT wallet_balance FROM users WHERE id = $1',
                [referral.referrer_id]
            );

            const currentBalance = referrerResult.rows[0].wallet_balance;
            const newBalance = currentBalance + bonusAmount;

            await client.query(
                'UPDATE users SET wallet_balance = $1 WHERE id = $2',
                [newBalance, referral.referrer_id]
            );

            // Record wallet transaction
            await client.query(
                `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [referral.referrer_id, 'referral_bonus', bonusAmount, newBalance, 'Referral bonus', referralId]
            );

            await client.query('COMMIT');

            res.json({
                message: 'Referral bonus processed successfully',
                bonusAmount: bonusAmount,
                newBalance: newBalance
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Process referral bonus error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get referral leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const result = await query(
            `SELECT 
                u.username,
                COUNT(r.id) as total_referrals,
                COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
                SUM(ar.revenue) * 0.05 as total_earnings
             FROM users u
             LEFT JOIN referrals r ON u.id = r.referrer_id
             LEFT JOIN ad_revenue ar ON r.referee_id = ar.user_id
             WHERE u.referral_code IS NOT NULL
             GROUP BY u.id, u.username
             HAVING COUNT(r.id) > 0
             ORDER BY total_earnings DESC, total_referrals DESC
             LIMIT $1`,
            [limit]
        );

        const leaderboard = result.rows.map((row, index) => ({
            rank: index + 1,
            username: row.username,
            totalReferrals: parseInt(row.total_referrals),
            completedReferrals: parseInt(row.completed_referrals),
            totalEarnings: parseFloat(row.total_earnings || 0)
        }));

        res.json({ leaderboard });

    } catch (error) {
        console.error('Get referral leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
