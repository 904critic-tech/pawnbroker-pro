const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('dotenv').config({ path: './config/dev.env' });

// Import routes
const authRoutes = require('../routes/auth');
const itemRoutes = require('../routes/items');
const marketRoutes = require('../routes/market');
const imageRoutes = require('../routes/images');
const userRoutes = require('../routes/users');
const ebayRoutes = require('../routes/ebay');
const camelCamelCamelRoutes = require('../routes/camelcamelcamel');
const marketplaceRoutes = require('../routes/marketplace');
const amazonRoutes = require('../routes/amazon');
const ebayWebhookRoutes = require('../routes/ebay-webhooks');
const globalLearningRoutes = require('../routes/global-learning');
const statsRoutes = require('../routes/stats');
const priceHistoryRoutes = require('../routes/price-history');
const keepaRoutes = require('../routes/keepa');
const amazonPAAPIRoutes = require('../routes/amazon-paapi');
const canopyRoutes = require('../routes/canopy');

// Import database connection
const connectDB = require('../config/database');

// Import middleware
const errorHandler = require('../middleware/errorHandler');
const { auth: authMiddleware, optionalAuth } = require('../middleware/auth');
const inputValidation = require('../middleware/inputValidation');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking)
connectDB().catch(err => {
  console.log('⚠️  MongoDB connection failed, but server will continue running');
});

// Security middleware
app.use(helmet());

// Input validation and security middleware
app.use(inputValidation.securityHeaders);
app.use(inputValidation.requestSizeLimit);
app.use(inputValidation.securityRateLimit);
app.use(inputValidation.sanitizeInput);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : [
        'http://localhost:19006', 
        'http://localhost:3000',
        'http://10.0.0.7:19006',
        'http://10.0.0.7:3000',
        'exp://10.0.0.7:19000',
        'exp://localhost:19000'
      ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Speed limiting for image processing
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // allow 5 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 100
});
app.use('/api/images/', speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'PawnBroker Pro API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', authMiddleware, itemRoutes);
app.use('/api/market', authMiddleware, marketRoutes);
app.use('/api/images', optionalAuth, imageRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/ebay', ebayRoutes);
app.use('/api/camelcamelcamel', camelCamelCamelRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/amazon', amazonRoutes);
app.use('/api/ebay-webhooks', ebayWebhookRoutes);
app.use('/api/global-learning', globalLearningRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/price-history', priceHistoryRoutes);
app.use('/api/keepa', keepaRoutes);
app.use('/api/amazon-paapi', amazonPAAPIRoutes);
app.use('/api/canopy', canopyRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PawnBroker Pro API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
