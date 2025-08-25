const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database to ensure they still exist
        const result = await query(
            'SELECT id, username, email, is_artist, is_verified FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Middleware to check if user is an artist
const requireArtist = (req, res, next) => {
    if (!req.user.is_artist) {
        return res.status(403).json({ error: 'Artist access required' });
    }
    next();
};

// Middleware to check if user is verified
const requireVerified = (req, res, next) => {
    if (!req.user.is_verified) {
        return res.status(403).json({ error: 'Account verification required' });
    }
    next();
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await query(
            'SELECT id, username, email, is_artist, is_verified FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length > 0) {
            req.user = result.rows[0];
        } else {
            req.user = null;
        }
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireArtist,
    requireVerified,
    optionalAuth
};
