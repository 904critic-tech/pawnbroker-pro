const secureLoggingService = require('../services/SecureLoggingService');

// Error codes for different types of errors
const ERROR_CODES = {
  // Authentication errors (1000-1999)
  AUTH_INVALID_TOKEN: 1001,
  AUTH_TOKEN_EXPIRED: 1002,
  AUTH_INSUFFICIENT_PERMISSIONS: 1003,
  AUTH_USER_NOT_FOUND: 1004,
  AUTH_INVALID_CREDENTIALS: 1005,
  
  // Validation errors (2000-2999)
  VALIDATION_INVALID_INPUT: 2001,
  VALIDATION_MISSING_REQUIRED_FIELD: 2002,
  VALIDATION_INVALID_FORMAT: 2003,
  VALIDATION_FILE_TOO_LARGE: 2004,
  VALIDATION_INVALID_FILE_TYPE: 2005,
  
  // Database errors (3000-3999)
  DB_CONNECTION_FAILED: 3001,
  DB_QUERY_FAILED: 3002,
  DB_DUPLICATE_KEY: 3003,
  DB_RECORD_NOT_FOUND: 3004,
  DB_TRANSACTION_FAILED: 3005,
  
  // API errors (4000-4999)
  API_RATE_LIMIT_EXCEEDED: 4001,
  API_SERVICE_UNAVAILABLE: 4002,
  API_INVALID_RESPONSE: 4003,
  API_TIMEOUT: 4004,
  API_QUOTA_EXCEEDED: 4005,
  
  // File handling errors (5000-5999)
  FILE_UPLOAD_FAILED: 5001,
  FILE_PROCESSING_FAILED: 5002,
  FILE_NOT_FOUND: 5003,
  FILE_CORRUPTED: 5004,
  FILE_SIZE_EXCEEDED: 5005,
  
  // Business logic errors (6000-6999)
  BUSINESS_INSUFFICIENT_FUNDS: 6001,
  BUSINESS_ITEM_NOT_AVAILABLE: 6002,
  BUSINESS_INVALID_OPERATION: 6003,
  BUSINESS_LIMIT_EXCEEDED: 6004,
  
  // System errors (9000-9999)
  SYSTEM_INTERNAL_ERROR: 9001,
  SYSTEM_MAINTENANCE: 9002,
  SYSTEM_CONFIGURATION_ERROR: 9003,
  SYSTEM_RESOURCE_UNAVAILABLE: 9004,
};

// Error messages for different environments
const ERROR_MESSAGES = {
  development: {
    [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Invalid authentication token provided',
    [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
    [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions to perform this action',
    [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'User not found in the system',
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
    
    [ERROR_CODES.VALIDATION_INVALID_INPUT]: 'Invalid input provided',
    [ERROR_CODES.VALIDATION_MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Invalid format for the provided data',
    [ERROR_CODES.VALIDATION_FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit',
    [ERROR_CODES.VALIDATION_INVALID_FILE_TYPE]: 'Invalid file type provided',
    
    [ERROR_CODES.DB_CONNECTION_FAILED]: 'Database connection failed',
    [ERROR_CODES.DB_QUERY_FAILED]: 'Database query failed',
    [ERROR_CODES.DB_DUPLICATE_KEY]: 'Duplicate key violation',
    [ERROR_CODES.DB_RECORD_NOT_FOUND]: 'Record not found in database',
    [ERROR_CODES.DB_TRANSACTION_FAILED]: 'Database transaction failed',
    
    [ERROR_CODES.API_RATE_LIMIT_EXCEEDED]: 'API rate limit exceeded',
    [ERROR_CODES.API_SERVICE_UNAVAILABLE]: 'External API service is unavailable',
    [ERROR_CODES.API_INVALID_RESPONSE]: 'Invalid response from external API',
    [ERROR_CODES.API_TIMEOUT]: 'External API request timed out',
    [ERROR_CODES.API_QUOTA_EXCEEDED]: 'API quota exceeded',
    
    [ERROR_CODES.FILE_UPLOAD_FAILED]: 'File upload failed',
    [ERROR_CODES.FILE_PROCESSING_FAILED]: 'File processing failed',
    [ERROR_CODES.FILE_NOT_FOUND]: 'File not found',
    [ERROR_CODES.FILE_CORRUPTED]: 'File appears to be corrupted',
    [ERROR_CODES.FILE_SIZE_EXCEEDED]: 'File size exceeds maximum allowed limit',
    
    [ERROR_CODES.BUSINESS_INSUFFICIENT_FUNDS]: 'Insufficient funds for this operation',
    [ERROR_CODES.BUSINESS_ITEM_NOT_AVAILABLE]: 'Item is not available',
    [ERROR_CODES.BUSINESS_INVALID_OPERATION]: 'Invalid business operation',
    [ERROR_CODES.BUSINESS_LIMIT_EXCEEDED]: 'Business limit exceeded',
    
    [ERROR_CODES.SYSTEM_INTERNAL_ERROR]: 'Internal server error occurred',
    [ERROR_CODES.SYSTEM_MAINTENANCE]: 'System is under maintenance',
    [ERROR_CODES.SYSTEM_CONFIGURATION_ERROR]: 'System configuration error',
    [ERROR_CODES.SYSTEM_RESOURCE_UNAVAILABLE]: 'System resource is unavailable',
  },
  production: {
    [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Authentication failed. Please log in again.',
    [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
    [ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
    [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'User account not found.',
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
    
    [ERROR_CODES.VALIDATION_INVALID_INPUT]: 'Please check your input and try again.',
    [ERROR_CODES.VALIDATION_MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
    [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Please check the format of your input.',
    [ERROR_CODES.VALIDATION_FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file.',
    [ERROR_CODES.VALIDATION_INVALID_FILE_TYPE]: 'File type not supported. Please choose a different file.',
    
    [ERROR_CODES.DB_CONNECTION_FAILED]: 'Service temporarily unavailable. Please try again later.',
    [ERROR_CODES.DB_QUERY_FAILED]: 'Unable to process your request. Please try again.',
    [ERROR_CODES.DB_DUPLICATE_KEY]: 'This record already exists.',
    [ERROR_CODES.DB_RECORD_NOT_FOUND]: 'The requested information was not found.',
    [ERROR_CODES.DB_TRANSACTION_FAILED]: 'Unable to complete the operation. Please try again.',
    
    [ERROR_CODES.API_RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
    [ERROR_CODES.API_SERVICE_UNAVAILABLE]: 'External service is temporarily unavailable.',
    [ERROR_CODES.API_INVALID_RESPONSE]: 'Unable to process external service response.',
    [ERROR_CODES.API_TIMEOUT]: 'Request timed out. Please try again.',
    [ERROR_CODES.API_QUOTA_EXCEEDED]: 'Service quota exceeded. Please try again later.',
    
    [ERROR_CODES.FILE_UPLOAD_FAILED]: 'Unable to upload file. Please try again.',
    [ERROR_CODES.FILE_PROCESSING_FAILED]: 'Unable to process file. Please try a different file.',
    [ERROR_CODES.FILE_NOT_FOUND]: 'File not found.',
    [ERROR_CODES.FILE_CORRUPTED]: 'File appears to be corrupted. Please try a different file.',
    [ERROR_CODES.FILE_SIZE_EXCEEDED]: 'File is too large. Please choose a smaller file.',
    
    [ERROR_CODES.BUSINESS_INSUFFICIENT_FUNDS]: 'Insufficient funds for this operation.',
    [ERROR_CODES.BUSINESS_ITEM_NOT_AVAILABLE]: 'This item is currently unavailable.',
    [ERROR_CODES.BUSINESS_INVALID_OPERATION]: 'This operation is not allowed.',
    [ERROR_CODES.BUSINESS_LIMIT_EXCEEDED]: 'You have reached the limit for this operation.',
    
    [ERROR_CODES.SYSTEM_INTERNAL_ERROR]: 'Something went wrong. Please try again later.',
    [ERROR_CODES.SYSTEM_MAINTENANCE]: 'System is under maintenance. Please try again later.',
    [ERROR_CODES.SYSTEM_CONFIGURATION_ERROR]: 'System configuration error. Please contact support.',
    [ERROR_CODES.SYSTEM_RESOURCE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
  }
};

// Custom error class with structured information
class AppError extends Error {
  constructor(message, statusCode, errorCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Create specific error types
const createAuthError = (errorCode, details = {}) => {
  const statusCode = 401;
  const message = ERROR_MESSAGES[process.env.NODE_ENV || 'development'][errorCode] || 'Authentication error';
  return new AppError(message, statusCode, errorCode, details);
};

const createValidationError = (errorCode, details = {}) => {
  const statusCode = 400;
  const message = ERROR_MESSAGES[process.env.NODE_ENV || 'development'][errorCode] || 'Validation error';
  return new AppError(message, statusCode, errorCode, details);
};

const createDatabaseError = (errorCode, details = {}) => {
  const statusCode = 500;
  const message = ERROR_MESSAGES[process.env.NODE_ENV || 'development'][errorCode] || 'Database error';
  return new AppError(message, statusCode, errorCode, details);
};

const createAPIError = (errorCode, details = {}) => {
  const statusCode = 502;
  const message = ERROR_MESSAGES[process.env.NODE_ENV || 'development'][errorCode] || 'API error';
  return new AppError(message, statusCode, errorCode, details);
};

const createFileError = (errorCode, details = {}) => {
  const statusCode = 400;
  const message = ERROR_MESSAGES[process.env.NODE_ENV || 'development'][errorCode] || 'File error';
  return new AppError(message, statusCode, errorCode, details);
};

const createBusinessError = (errorCode, details = {}) => {
  const statusCode = 400;
  const message = ERROR_MESSAGES[process.env.NODE_ENV || 'development'][errorCode] || 'Business logic error';
  return new AppError(message, statusCode, errorCode, details);
};

const createSystemError = (errorCode, details = {}) => {
  const statusCode = 500;
  const message = ERROR_MESSAGES[process.env.NODE_ENV || 'development'][errorCode] || 'System error';
  return new AppError(message, statusCode, errorCode, details);
};

// Main error handler middleware
const errorHandler = async (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.errorCode = err.errorCode || ERROR_CODES.SYSTEM_INTERNAL_ERROR;

  // Log the error with context
  const errorContext = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
    stack: err.stack,
    details: err.details || {},
  };

  // Log based on error type
  if (err.isOperational) {
    await secureLoggingService.warn(`Operational error: ${err.message}`, errorContext);
  } else {
    await secureLoggingService.error(`System error: ${err.message}`, errorContext);
  }

  // Handle specific error types
  if (err.name === 'CastError') {
    error = createValidationError(ERROR_CODES.VALIDATION_INVALID_FORMAT, {
      field: err.path,
      value: err.value,
    });
  }

  if (err.code === 11000) {
    error = createDatabaseError(ERROR_CODES.DB_DUPLICATE_KEY, {
      field: Object.keys(err.keyValue)[0],
      value: Object.values(err.keyValue)[0],
    });
  }

  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
    }));
    error = createValidationError(ERROR_CODES.VALIDATION_INVALID_INPUT, {
      validationErrors,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    error = createAuthError(ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  if (err.name === 'TokenExpiredError') {
    error = createAuthError(ERROR_CODES.AUTH_TOKEN_EXPIRED);
  }

  // Prepare response based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    error: {
      code: error.errorCode,
      message: error.message,
      statusCode: error.statusCode,
    }
  };

  // Add additional details in development
  if (isDevelopment) {
    response.error.details = error.details;
    response.error.stack = error.stack;
    response.error.timestamp = new Date().toISOString();
    response.error.path = req.originalUrl;
    response.error.method = req.method;
  }

  // Add retry information for certain errors
  if (error.statusCode === 429 || error.statusCode === 503) {
    response.error.retryAfter = Math.ceil((error.retryAfter || 60) / 1000);
  }

  res.status(error.statusCode).json(response);
};

// Async error wrapper for route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error boundary for unhandled errors
const handleUnhandledErrors = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', err);
    secureLoggingService.error('Unhandled Promise Rejection', {
      error: err.message,
      stack: err.stack,
      promise: promise.toString(),
    });
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    secureLoggingService.error('Uncaught Exception', {
      error: err.message,
      stack: err.stack,
    });
    
    // Gracefully shutdown the server
    process.exit(1);
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  handleUnhandledErrors,
  AppError,
  ERROR_CODES,
  createAuthError,
  createValidationError,
  createDatabaseError,
  createAPIError,
  createFileError,
  createBusinessError,
  createSystemError,
};
