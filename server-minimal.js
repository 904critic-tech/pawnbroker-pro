const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const ebayRoutes = require('./backend/routes/ebay');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/ebay', ebayRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PawnBroker API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PawnBroker Pro API',
    endpoints: {
      health: '/health',
      ebay: {
        search: '/api/ebay/search/:query',
        estimate: '/api/ebay/estimate/:query',
        testLambda: '/api/ebay/test-lambda',
        health: '/api/ebay/health'
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 PawnBroker API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
