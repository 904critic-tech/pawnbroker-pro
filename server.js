const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const secureLoggingService = require('./services/SecureLoggingService');
const dataRetentionService = require('./services/DataRetentionService');
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? './config/production.env' : './config/dev.env' });

// Import routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const marketRoutes = require('./routes/market');
const imageRoutes = require('./routes/images');
const userRoutes = require('./routes/users');
const ebayRoutes = require('./routes/ebay');
const camelCamelCamelRoutes = require('./routes/camelcamelcamel');
const marketplaceRoutes = require('./routes/marketplace');
const amazonRoutes = require('./routes/amazon');
const ebayWebhookRoutes = require('./routes/ebay-webhooks');
const globalLearningRoutes = require('./routes/global-learning');
const statsRoutes = require('./routes/stats');
const priceHistoryRoutes = require('./routes/price-history');
const keepaRoutes = require('./routes/keepa');
const amazonPAAPIRoutes = require('./routes/amazon-paapi');
const canopyRoutes = require('./routes/canopy');

// Import database connection
const { connectDB, initSupabase } = require('./config/database');

// Import middleware
const { errorHandler, handleUnhandledErrors } = require('./middleware/errorHandler');
const { auth: authMiddleware, optionalAuth } = require('./middleware/auth');
const inputValidation = require('./middleware/inputValidation');

const app = express();
const PORT = process.env.PORT || 5000;

// Environment validation
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CORS_ORIGIN'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Connect to databases with proper error handling
async function initializeDatabases() {
  try {
    // Initialize MongoDB (legacy)
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Initialize Supabase
    const supabase = initSupabase();
    if (supabase) {
      console.log('✅ Supabase initialized successfully');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Exiting due to database connection failure in production');
      process.exit(1);
    } else {
      console.warn('⚠️  Server will continue without database connection (development mode)');
    }
  }
}

// Initialize databases
initializeDatabases();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Input validation and security middleware
app.use(inputValidation.securityHeaders);
app.use(inputValidation.requestSizeLimit);
app.use(inputValidation.securityRateLimit);
app.use(inputValidation.sanitizeInput);

// CORS configuration with environment-specific origins
const corsOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',') : 
  (process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : [
        'http://localhost:19006', 
        'http://localhost:3000',
        'http://10.0.0.7:19006',
        'http://10.0.0.7:3000',
        'exp://10.0.0.7:19000',
        'exp://localhost:19000'
      ]);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting with environment-specific configuration
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(rateLimitWindowMs / 1000)
    });
  }
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Speed limiting for image processing
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // allow 5 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 100
});
app.use('/api/images/', speedLimiter);

// Body parsing middleware with size limits
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
app.use(express.json({ limit: maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: maxFileSize }));

// Compression middleware
app.use(compression());

// Secure logging middleware
app.use(async (req, res, next) => {
  const startTime = Date.now();
  
  // Log the request
  await secureLoggingService.logApiRequest(
    req.method,
    req.path,
    req.user?.id || 'anonymous',
    req.ip,
    {
      userAgent: req.get('User-Agent'),
      requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  );
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log the response
    secureLoggingService.info(`API Response: ${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length') || 0
    }, {
      requestId: req.headers['x-request-id']
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Standard logging middleware with environment-specific configuration
if (process.env.NODE_ENV !== 'test') {
  const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(logFormat, {
    skip: (req, res) => res.statusCode < 400,
    stream: {
      write: (message) => {
        console.log(message.trim());
      }
    }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'PawnBroker Pro API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      connected: !!global.mongoose?.connection?.readyState
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/users', userRoutes);
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
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle unhandled errors
handleUnhandledErrors();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 PawnBroker Pro API server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Rate limit: ${rateLimitMaxRequests} requests per ${rateLimitWindowMs / 1000 / 60} minutes`);
  console.log(`🔒 CORS origins: ${corsOrigins.join(', ')}`);
  
  // Set up data retention cleanup
  dataRetentionService.setupScheduledCleanup();
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;
