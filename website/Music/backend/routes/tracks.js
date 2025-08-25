const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all tracks with pagination and filtering
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            genre,
            mood,
            search,
            sort = 'created_at',
            order = 'desc'
        } = req.query;

        const offset = (page - 1) * limit;
        const userId = req.user ? req.user.id : null;

        // Build WHERE clause
        let whereConditions = ['t.is_public = true AND t.is_approved = true'];
        let params = [];
        let paramCount = 0;

        if (genre) {
            paramCount++;
            whereConditions.push(`t.genre ILIKE $${paramCount}`);
            params.push(`%${genre}%`);
        }

        if (mood) {
            paramCount++;
            whereConditions.push(`t.mood ILIKE $${paramCount}`);
            params.push(`%${mood}%`);
        }

        if (search) {
            paramCount++;
            whereConditions.push(`(t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount} OR a.artist_name ILIKE $${paramCount})`);
            params.push(`%${search}%`);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const countQuery = `
            SELECT COUNT(*) 
            FROM tracks t 
            JOIN artists a ON t.artist_id = a.id 
            WHERE ${whereClause}
        `;
        const countResult = await query(countQuery, params);
        const totalTracks = parseInt(countResult.rows[0].count);

        // Get tracks
        paramCount++;
        const tracksQuery = `
            SELECT 
                t.id, t.title, t.description, t.genre, t.mood, t.tempo, t.duration,
                t.file_path, t.thumbnail_url, t.stream_count, t.download_count, t.tip_count, t.total_tips,
                t.created_at, t.updated_at,
                a.id as artist_id, a.artist_name,
                u.username as artist_username, u.avatar_url as artist_avatar
            FROM tracks t 
            JOIN artists a ON t.artist_id = a.id 
            JOIN users u ON a.id = u.id 
            WHERE ${whereClause}
            ORDER BY t.${sort} ${order.toUpperCase()}
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(limit, offset);

        const tracksResult = await query(tracksQuery, params);

        // Add user-specific data if authenticated
        const tracks = tracksResult.rows.map(track => ({
            id: track.id,
            title: track.title,
            description: track.description,
            genre: track.genre,
            mood: track.mood,
            tempo: track.tempo,
            duration: track.duration,
            filePath: track.file_path,
            thumbnailUrl: track.thumbnail_url,
            streamCount: track.stream_count,
            downloadCount: track.download_count,
            tipCount: track.tip_count,
            totalTips: track.total_tips,
            createdAt: track.created_at,
            updatedAt: track.updated_at,
            artist: {
                id: track.artist_id,
                name: track.artist_name,
                username: track.artist_username,
                avatarUrl: track.artist_avatar
            }
        }));

        res.json({
            tracks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalTracks,
                pages: Math.ceil(totalTracks / limit)
            }
        });

    } catch (error) {
        console.error('Get tracks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single track by ID
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;

        const result = await query(
            `SELECT 
                t.id, t.title, t.description, t.genre, t.mood, t.tempo, t.duration,
                t.file_path, t.thumbnail_url, t.stream_count, t.download_count, t.tip_count, t.total_tips,
                t.created_at, t.updated_at,
                a.id as artist_id, a.artist_name, a.social_links,
                u.username as artist_username, u.avatar_url as artist_avatar, u.bio as artist_bio
            FROM tracks t 
            JOIN artists a ON t.artist_id = a.id 
            JOIN users u ON a.id = u.id 
            WHERE t.id = $1 AND t.is_public = true AND t.is_approved = true`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Track not found' });
        }

        const track = result.rows[0];

        res.json({
            track: {
                id: track.id,
                title: track.title,
                description: track.description,
                genre: track.genre,
                mood: track.mood,
                tempo: track.tempo,
                duration: track.duration,
                filePath: track.file_path,
                thumbnailUrl: track.thumbnail_url,
                streamCount: track.stream_count,
                downloadCount: track.download_count,
                tipCount: track.tip_count,
                totalTips: track.total_tips,
                createdAt: track.created_at,
                updatedAt: track.updated_at,
                artist: {
                    id: track.artist_id,
                    name: track.artist_name,
                    username: track.artist_username,
                    avatarUrl: track.artist_avatar,
                    bio: track.artist_bio,
                    socialLinks: track.social_links
                }
            }
        });

    } catch (error) {
        console.error('Get track error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Record stream (when user starts listening)
router.post('/:id/stream', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;
        const { duration } = req.body;

        // Verify track exists and is public
        const trackResult = await query(
            'SELECT id, artist_id FROM tracks WHERE id = $1 AND is_public = true AND is_approved = true',
            [id]
        );

        if (trackResult.rows.length === 0) {
            return res.status(404).json({ error: 'Track not found' });
        }

        const track = trackResult.rows[0];

        // Record stream
        await query(
            `INSERT INTO streams (user_id, track_id, duration_listened, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, id, duration || 0, req.ip, req.get('User-Agent')]
        );

        // Update track stream count
        await query(
            'UPDATE tracks SET stream_count = stream_count + 1 WHERE id = $1',
            [id]
        );

        // Update artist total streams
        await query(
            'UPDATE artists SET total_streams = total_streams + 1 WHERE id = $1',
            [track.artist_id]
        );

        res.json({ message: 'Stream recorded successfully' });

    } catch (error) {
        console.error('Record stream error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download track
router.post('/:id/download', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;

        // Verify track exists and is public
        const trackResult = await query(
            'SELECT id, artist_id, file_path FROM tracks WHERE id = $1 AND is_public = true AND is_approved = true',
            [id]
        );

        if (trackResult.rows.length === 0) {
            return res.status(404).json({ error: 'Track not found' });
        }

        const track = trackResult.rows[0];

        // Record download
        await query(
            `INSERT INTO downloads (user_id, track_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4)`,
            [userId, id, req.ip, req.get('User-Agent')]
        );

        // Update track download count
        await query(
            'UPDATE tracks SET download_count = download_count + 1 WHERE id = $1',
            [id]
        );

        // Update artist total downloads
        await query(
            'UPDATE artists SET total_downloads = total_downloads + 1 WHERE id = $1',
            [track.artist_id]
        );

        res.json({
            message: 'Download recorded successfully',
            downloadUrl: `/uploads/${track.file_path}`
        });

    } catch (error) {
        console.error('Download track error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get track recommendations
router.get('/:id/recommendations', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // Get track info
        const trackResult = await query(
            'SELECT genre, mood, artist_id FROM tracks WHERE id = $1',
            [id]
        );

        if (trackResult.rows.length === 0) {
            return res.status(404).json({ error: 'Track not found' });
        }

        const track = trackResult.rows[0];

        // Get recommendations based on genre, mood, and same artist
        const recommendationsResult = await query(
            `SELECT 
                t.id, t.title, t.genre, t.mood, t.duration, t.thumbnail_url,
                t.stream_count, t.download_count,
                a.artist_name, u.username as artist_username
            FROM tracks t 
            JOIN artists a ON t.artist_id = a.id 
            JOIN users u ON a.id = u.id 
            WHERE t.id != $1 
            AND t.is_public = true 
            AND t.is_approved = true
            AND (
                t.genre = $2 
                OR t.mood = $3 
                OR t.artist_id = $4
            )
            ORDER BY t.stream_count DESC, t.created_at DESC
            LIMIT $5`,
            [id, track.genre, track.mood, track.artist_id, limit]
        );

        const recommendations = recommendationsResult.rows.map(rec => ({
            id: rec.id,
            title: rec.title,
            genre: rec.genre,
            mood: rec.mood,
            duration: rec.duration,
            thumbnailUrl: rec.thumbnail_url,
            streamCount: rec.stream_count,
            downloadCount: rec.download_count,
            artist: {
                name: rec.artist_name,
                username: rec.artist_username
            }
        }));

        res.json({ recommendations });

    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get trending tracks
router.get('/trending', optionalAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const period = req.query.period || 'week'; // week, month, all

        let timeFilter = '';
        if (period === 'week') {
            timeFilter = 'AND t.created_at >= NOW() - INTERVAL \'7 days\'';
        } else if (period === 'month') {
            timeFilter = 'AND t.created_at >= NOW() - INTERVAL \'30 days\'';
        }

        const result = await query(
            `SELECT 
                t.id, t.title, t.genre, t.mood, t.duration, t.thumbnail_url,
                t.stream_count, t.download_count, t.tip_count, t.total_tips,
                t.created_at,
                a.artist_name, u.username as artist_username, u.avatar_url as artist_avatar
            FROM tracks t 
            JOIN artists a ON t.artist_id = a.id 
            JOIN users u ON a.id = u.id 
            WHERE t.is_public = true AND t.is_approved = true ${timeFilter}
            ORDER BY (t.stream_count + t.download_count * 2 + t.tip_count * 5) DESC, t.created_at DESC
            LIMIT $1`,
            [limit]
        );

        const trendingTracks = result.rows.map(track => ({
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
            createdAt: track.created_at,
            artist: {
                name: track.artist_name,
                username: track.artist_username,
                avatarUrl: track.artist_avatar
            }
        }));

        res.json({ trendingTracks });

    } catch (error) {
        console.error('Get trending tracks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
