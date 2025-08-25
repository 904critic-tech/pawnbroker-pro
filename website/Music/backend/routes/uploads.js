const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { query } = require('../config/database');
const { authenticateToken, requireArtist } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `track-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only MP3, WAV, and FLAC files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

// ACR (Automated Content Recognition) function
const scanForCopyright = async (filePath) => {
    try {
        // This is a placeholder for ACRCloud integration
        // In production, you would integrate with ACRCloud API here
        
        // For now, we'll simulate the ACR process
        const result = {
            checked: true,
            hasCopyright: false,
            confidence: 0.95,
            matches: [],
            timestamp: new Date().toISOString()
        };

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        return result;
    } catch (error) {
        console.error('ACR scan error:', error);
        return {
            checked: false,
            hasCopyright: false,
            confidence: 0,
            matches: [],
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// Upload track
router.post('/track', authenticateToken, requireArtist, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const { title, description, genre, mood, tempo } = req.body;

        // Validation
        if (!title || !genre) {
            return res.status(400).json({ error: 'Title and genre are required' });
        }

        // Get file info
        const fileSize = req.file.size;
        const fileFormat = path.extname(req.file.originalname).toLowerCase().substring(1);
        const fileName = req.file.filename;

        // Get artist info
        const artistResult = await query(
            'SELECT id FROM artists WHERE id = $1',
            [req.user.id]
        );

        if (artistResult.rows.length === 0) {
            return res.status(403).json({ error: 'Artist profile not found' });
        }

        // Scan for copyright using ACR
        const acrResult = await scanForCopyright(req.file.path);

        // If copyright detected, delete file and return error
        if (acrResult.hasCopyright) {
            await fs.unlink(req.file.path);
            return res.status(400).json({
                error: 'Copyright content detected',
                details: acrResult.matches
            });
        }

        // Create track record
        const trackResult = await query(
            `INSERT INTO tracks (
                artist_id, title, description, genre, mood, tempo, 
                file_path, file_size, file_format, acr_checked, acr_result
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, title, created_at`,
            [
                req.user.id, title, description, genre, mood, tempo,
                fileName, fileSize, fileFormat, acrResult.checked, JSON.stringify(acrResult)
            ]
        );

        const track = trackResult.rows[0];

        res.status(201).json({
            message: 'Track uploaded successfully',
            track: {
                id: track.id,
                title: track.title,
                createdAt: track.created_at,
                acrResult: acrResult
            }
        });

    } catch (error) {
        console.error('Upload track error:', error);
        
        // Clean up uploaded file if it exists
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }

        if (error.message.includes('Invalid file type')) {
            return res.status(400).json({ error: error.message });
        }

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 50MB.' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload thumbnail
router.post('/thumbnail', authenticateToken, requireArtist, upload.single('thumbnail'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No thumbnail file provided' });
        }

        const { trackId } = req.body;

        if (!trackId) {
            return res.status(400).json({ error: 'Track ID is required' });
        }

        // Verify track belongs to artist
        const trackResult = await query(
            'SELECT id FROM tracks WHERE id = $1 AND artist_id = $2',
            [trackId, req.user.id]
        );

        if (trackResult.rows.length === 0) {
            return res.status(404).json({ error: 'Track not found' });
        }

        // Update track with thumbnail
        await query(
            'UPDATE tracks SET thumbnail_url = $1 WHERE id = $2',
            [req.file.filename, trackId]
        );

        res.json({
            message: 'Thumbnail uploaded successfully',
            thumbnailUrl: req.file.filename
        });

    } catch (error) {
        console.error('Upload thumbnail error:', error);
        
        // Clean up uploaded file if it exists
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }

        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get upload progress (for large files)
router.get('/progress/:trackId', authenticateToken, requireArtist, async (req, res) => {
    try {
        const { trackId } = req.params;

        // Get track info
        const result = await query(
            'SELECT id, title, acr_checked, is_approved FROM tracks WHERE id = $1 AND artist_id = $2',
            [trackId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Track not found' });
        }

        const track = result.rows[0];

        res.json({
            trackId: track.id,
            title: track.title,
            acrChecked: track.acr_checked,
            isApproved: track.is_approved,
            status: track.is_approved ? 'approved' : track.acr_checked ? 'pending' : 'processing'
        });

    } catch (error) {
        console.error('Get upload progress error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete track (soft delete)
router.delete('/track/:trackId', authenticateToken, requireArtist, async (req, res) => {
    try {
        const { trackId } = req.params;

        // Verify track belongs to artist
        const trackResult = await query(
            'SELECT id, file_path FROM tracks WHERE id = $1 AND artist_id = $2',
            [trackId, req.user.id]
        );

        if (trackResult.rows.length === 0) {
            return res.status(404).json({ error: 'Track not found' });
        }

        const track = trackResult.rows[0];

        // Soft delete by setting is_public to false
        await query(
            'UPDATE tracks SET is_public = false WHERE id = $1',
            [trackId]
        );

        // Optionally delete the file from disk
        try {
            const filePath = path.join(__dirname, '../uploads', track.file_path);
            await fs.unlink(filePath);
        } catch (fileError) {
            console.error('Error deleting file:', fileError);
            // Continue even if file deletion fails
        }

        res.json({ message: 'Track deleted successfully' });

    } catch (error) {
        console.error('Delete track error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get artist's tracks
router.get('/my-tracks', authenticateToken, requireArtist, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) FROM tracks WHERE artist_id = $1',
            [req.user.id]
        );
        const totalTracks = parseInt(countResult.rows[0].count);

        // Get tracks
        const tracksResult = await query(
            `SELECT id, title, description, genre, mood, tempo, duration,
                    file_path, thumbnail_url, is_public, is_approved, acr_checked,
                    stream_count, download_count, tip_count, total_tips,
                    created_at, updated_at
             FROM tracks 
             WHERE artist_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

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
            isPublic: track.is_public,
            isApproved: track.is_approved,
            acrChecked: track.acr_checked,
            streamCount: track.stream_count,
            downloadCount: track.download_count,
            tipCount: track.tip_count,
            totalTips: track.total_tips,
            createdAt: track.created_at,
            updatedAt: track.updated_at
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
        console.error('Get my tracks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
