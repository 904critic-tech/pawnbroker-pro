const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT u.id, u.username, u.first_name, u.last_name, u.avatar_url, u.bio,
                    u.is_artist, u.is_verified, u.created_at,
                    a.artist_name, a.social_links, a.total_earnings, a.total_tips,
                    a.total_streams, a.total_downloads
             FROM users u
             LEFT JOIN artists a ON u.id = a.id
             WHERE u.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: user.avatar_url,
                bio: user.bio,
                isArtist: user.is_artist,
                isVerified: user.is_verified,
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
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, bio, avatarUrl } = req.body;

        const result = await query(
            `UPDATE users 
             SET first_name = COALESCE($1, first_name),
                 last_name = COALESCE($2, last_name),
                 bio = COALESCE($3, bio),
                 avatar_url = COALESCE($4, avatar_url),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING id, username, first_name, last_name, avatar_url, bio, is_artist, is_verified`,
            [firstName, lastName, bio, avatarUrl, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: user.avatar_url,
                bio: user.bio,
                isArtist: user.is_artist,
                isVerified: user.is_verified
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Become an artist
router.post('/become-artist', authenticateToken, async (req, res) => {
    try {
        const { artistName, socialLinks } = req.body;

        if (!artistName) {
            return res.status(400).json({ error: 'Artist name is required' });
        }

        // Check if user is already an artist
        const existingArtist = await query(
            'SELECT id FROM artists WHERE id = $1',
            [req.user.id]
        );

        if (existingArtist.rows.length > 0) {
            return res.status(400).json({ error: 'User is already an artist' });
        }

        // Check if artist name is already taken
        const nameTaken = await query(
            'SELECT id FROM artists WHERE artist_name = $1',
            [artistName]
        );

        if (nameTaken.rows.length > 0) {
            return res.status(400).json({ error: 'Artist name is already taken' });
        }

        // Update user to be an artist
        await query(
            'UPDATE users SET is_artist = true WHERE id = $1',
            [req.user.id]
        );

        // Create artist profile
        await query(
            `INSERT INTO artists (id, artist_name, social_links)
             VALUES ($1, $2, $3)`,
            [req.user.id, artistName, JSON.stringify(socialLinks || {})]
        );

        res.json({
            message: 'Successfully became an artist',
            artistName: artistName
        });

    } catch (error) {
        console.error('Become artist error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's listening history
router.get('/history/listening', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT s.id, s.duration_listened, s.created_at,
                    t.id as track_id, t.title, t.genre, t.duration, t.thumbnail_url,
                    a.artist_name, u.username as artist_username
             FROM streams s
             JOIN tracks t ON s.track_id = t.id
             JOIN artists a ON t.artist_id = a.id
             JOIN users u ON a.id = u.id
             WHERE s.user_id = $1
             ORDER BY s.created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        const history = result.rows.map(item => ({
            id: item.id,
            durationListened: item.duration_listened,
            createdAt: item.created_at,
            track: {
                id: item.track_id,
                title: item.title,
                genre: item.genre,
                duration: item.duration,
                thumbnailUrl: item.thumbnail_url,
                artist: {
                    name: item.artist_name,
                    username: item.artist_username
                }
            }
        }));

        res.json({ history });

    } catch (error) {
        console.error('Get listening history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's download history
router.get('/history/downloads', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT d.id, d.created_at,
                    t.id as track_id, t.title, t.genre, t.duration, t.thumbnail_url,
                    a.artist_name, u.username as artist_username
             FROM downloads d
             JOIN tracks t ON d.track_id = t.id
             JOIN artists a ON t.artist_id = a.id
             JOIN users u ON a.id = u.id
             WHERE d.user_id = $1
             ORDER BY d.created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        const downloads = result.rows.map(item => ({
            id: item.id,
            createdAt: item.created_at,
            track: {
                id: item.track_id,
                title: item.title,
                genre: item.genre,
                duration: item.duration,
                thumbnailUrl: item.thumbnail_url,
                artist: {
                    name: item.artist_name,
                    username: item.artist_username
                }
            }
        }));

        res.json({ downloads });

    } catch (error) {
        console.error('Get download history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
