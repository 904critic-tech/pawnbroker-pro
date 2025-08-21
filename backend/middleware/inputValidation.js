const { body, param, query, validationResult } = require('express-validator');

// Input sanitization and validation middleware
const inputValidation = {
  // Sanitize and validate search queries
  validateSearchQuery: [
    param('query')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Search query must be between 1 and 200 characters')
      .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
      .withMessage('Search query contains invalid characters')
      .customSanitizer(value => {
        // Remove potentially dangerous characters
        return value.replace(/[<>'"&;|`$(){}[\]]/g, '');
      }),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid search query',
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // Validate query parameters
  validateQueryParams: [
    query('query')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Query parameter must be between 1 and 200 characters')
      .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
      .withMessage('Query parameter contains invalid characters')
      .customSanitizer(value => {
        return value ? value.replace(/[<>'"&;|`$(){}[\]]/g, '') : value;
      }),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // Validate authentication tokens
  validateAuthToken: [
    body('token')
      .optional()
      .isJWT()
      .withMessage('Invalid JWT token format'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authentication token',
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // Validate file uploads
  validateFileUpload: [
    body('file')
      .optional()
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('No file uploaded');
        }
        
        // Check file size (10MB limit)
        if (req.file.size > 10 * 1024 * 1024) {
          throw new Error('File size too large (max 10MB)');
        }
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('Invalid file type (only JPEG, PNG, WebP allowed)');
        }
        
        return true;
      }),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file upload',
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // Generic input sanitizer
  sanitizeInput: (req, res, next) => {
    // Sanitize all string inputs
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/[<>'"&;|`$(){}[\]]/g, '') // Remove dangerous characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    // Sanitize request body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeString(req.body[key]);
        }
      });
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key]);
        }
      });
    }

    // Sanitize URL parameters
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizeString(req.params[key]);
        }
      });
    }

    next();
  },

  // Security headers middleware
  securityHeaders: (req, res, next) => {
    // Prevent XSS attacks
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Strict transport security (for HTTPS)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
  },

  // Request size limiter
  requestSizeLimit: (req, res, next) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request too large (max 10MB)'
      });
    }
    
    next();
  },

  // Rate limiting for security tests
  securityRateLimit: (req, res, next) => {
    // Additional rate limiting for potentially malicious requests
    const suspiciousPatterns = [
      /[<>'"&;|`$(){}[\]]/, // Dangerous characters
      /(union|select|insert|update|delete|drop|create|alter)/i, // SQL keywords
      /(script|javascript|vbscript|onload|onerror)/i, // XSS patterns
      /(\.\.\/|\.\.\\)/, // Path traversal
      /(;|\||`|\$\(|\$\{)/, // Command injection
    ];
    
    const url = req.url.toLowerCase();
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(url));
    
    if (hasSuspiciousPattern) {
      // Log suspicious activity
      console.log(`🚨 Suspicious request detected: ${req.method} ${req.url} from ${req.ip}`);
      
      // Return 400 for suspicious requests instead of processing them
      return res.status(400).json({
        success: false,
        message: 'Invalid request detected'
      });
    }
    
    next();
  }
};

module.exports = inputValidation;
