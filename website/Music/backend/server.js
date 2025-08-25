const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - more conservative setup
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (for serving uploaded music files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint (before routes)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        message: 'Backend server is running!'
    });
});

// Routes - load with error handling
try {
    app.use('/api/auth', require('./routes/auth'));
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.error('❌ Error loading auth routes:', error.message);
}

try {
    app.use('/api/users', require('./routes/users'));
    console.log('✅ Users routes loaded');
} catch (error) {
    console.error('❌ Error loading users routes:', error.message);
}

try {
    app.use('/api/tracks', require('./routes/tracks'));
    console.log('✅ Tracks routes loaded');
} catch (error) {
    console.error('❌ Error loading tracks routes:', error.message);
}

try {
    app.use('/api/artists', require('./routes/artists'));
    console.log('✅ Artists routes loaded');
} catch (error) {
    console.error('❌ Error loading artists routes:', error.message);
}

try {
    app.use('/api/uploads', require('./routes/uploads'));
    console.log('✅ Uploads routes loaded');
} catch (error) {
    console.error('❌ Error loading uploads routes:', error.message);
}

try {
    app.use('/api/wallet', require('./routes/wallet'));
    console.log('✅ Wallet routes loaded');
} catch (error) {
    console.error('❌ Error loading wallet routes:', error.message);
}

try {
    app.use('/api/referrals', require('./routes/referrals'));
    console.log('✅ Referrals routes loaded');
} catch (error) {
    console.error('❌ Error loading referrals routes:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
