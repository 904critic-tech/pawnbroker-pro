const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get artist profile by ID
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT a.id, a.artist_name, a.social_links, a.total_earnings, a.total_tips,
                    a.total_streams, a.total_downloads, a.created_at,
                    u.username, u.avatar_url, u.bio
             FROM artists a
             JOIN users u ON a.id = u.id
             WHERE a.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        const artist = result.rows[0];

        // Get artist's tracks
        const tracksResult = await query(
            `SELECT id, title, genre, mood, duration, thumbnail_url,
                    stream_count, download_count, tip_count, total_tips, created_at
             FROM tracks
             WHERE artist_id = $1 AND is_public = true AND is_approved = true
             ORDER BY created_at DESC
             LIMIT 10`,
            [id]
        );

        const tracks = tracksResult.rows.map(track => ({
            id: track.id,
            title: track.title,
            genre: track.genre,
            mood: track.mood,
            duration: track.duration,
            thumbnailUrl: track.thumbnail_url,
            streamCount: track.stream_count,
            downloadCount: track.download_count,
            tipCount: track.tip_count,
            totalTips: track.total_tips,
            createdAt: track.created_at
        }));

        res.json({
            artist: {
                id: artist.id,
                name: artist.artist_name,
                username: artist.username,
                avatarUrl: artist.avatar_url,
                bio: artist.bio,
                socialLinks: artist.social_links,
                totalEarnings: artist.total_earnings,
                totalTips: artist.total_tips,
                totalStreams: artist.total_streams,
                totalDownloads: artist.total_downloads,
                createdAt: artist.created_at,
                tracks: tracks
            }
        });

    } catch (error) {
        console.error('Get artist error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get artist analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify user is the artist
        if (req.user.id !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get recent earnings
        const earningsResult = await query(
            `SELECT DATE(created_at) as date, SUM(amount) as daily_earnings
             FROM tips
             WHERE to_artist_id = $1
             AND created_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`,
            [id]
        );

        // Get track performance
        const tracksResult = await query(
            `SELECT title, stream_count, download_count, tip_count, total_tips
             FROM tracks
             WHERE artist_id = $1 AND is_public = true
             ORDER BY stream_count DESC
             LIMIT 10`,
            [id]
        );

        // Get monthly stats
        const monthlyStats = await query(
            `SELECT 
                COUNT(DISTINCT t.id) as total_tracks,
                SUM(t.stream_count) as total_streams,
                SUM(t.download_count) as total_downloads,
                SUM(t.tip_count) as total_tips,
                SUM(t.total_tips) as total_tip_amount
             FROM tracks t
             WHERE t.artist_id = $1 AND t.is_public = true`,
            [id]
        );

        res.json({
            earnings: earningsResult.rows,
            topTracks: tracksResult.rows,
            monthlyStats: monthlyStats.rows[0]
        });

    } catch (error) {
        console.error('Get artist analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update artist profile
router.put('/:id/profile', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { artistName, socialLinks, bio } = req.body;

        // Verify user is the artist
        if (req.user.id !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if artist name is already taken by another artist
        if (artistName) {
            const nameTaken = await query(
                'SELECT id FROM artists WHERE artist_name = $1 AND id != $2',
                [artistName, id]
            );

            if (nameTaken.rows.length > 0) {
                return res.status(400).json({ error: 'Artist name is already taken' });
            }
        }

        // Update artist profile
        const artistResult = await query(
            `UPDATE artists 
             SET artist_name = COALESCE($1, artist_name),
                 social_links = COALESCE($2, social_links),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING artist_name, social_links`,
            [artistName, JSON.stringify(socialLinks), id]
        );

        // Update user bio
        if (bio !== undefined) {
            await query(
                'UPDATE users SET bio = $1 WHERE id = $2',
                [bio, id]
            );
        }

        res.json({
            message: 'Artist profile updated successfully',
            artist: artistResult.rows[0]
        });

    } catch (error) {
        console.error('Update artist profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get artist's tips
router.get('/:id/tips', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Verify user is the artist
        if (req.user.id !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await query(
            `SELECT t.id, t.amount, t.message, t.is_anonymous, t.created_at,
                    u.username as from_username, u.avatar_url as from_avatar,
                    tr.title as track_title
             FROM tips t
             LEFT JOIN users u ON t.from_user_id = u.id
             LEFT JOIN tracks tr ON t.track_id = tr.id
             WHERE t.to_artist_id = $1
             ORDER BY t.created_at DESC
             LIMIT $2 OFFSET $3`,
            [id, limit, offset]
        );

        const tips = result.rows.map(tip => ({
            id: tip.id,
            amount: tip.amount,
            message: tip.message,
            isAnonymous: tip.is_anonymous,
            createdAt: tip.created_at,
            fromUser: tip.is_anonymous ? null : {
                username: tip.from_username,
                avatarUrl: tip.from_avatar
            },
            trackTitle: tip.track_title
        }));

        res.json({ tips });

    } catch (error) {
        console.error('Get artist tips error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
