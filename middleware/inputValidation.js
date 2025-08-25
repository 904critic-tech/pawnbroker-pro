const { body, param, query, validationResult } = require('express-validator');

// Input sanitization and validation middleware
const inputValidation = {
  // Enhanced sanitize and validate search queries
  validateSearchQuery: [
    param('query')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Search query must be between 1 and 200 characters')
      .matches(/^[a-zA-Z0-9\s\-_.,!?()@#$%&*+=:;<>[\]{}|\\/]+$/)
      .withMessage('Search query contains invalid characters')
      .customSanitizer(value => {
        // Remove potentially dangerous characters and patterns
        return value
          .replace(/[<>'"&;|`$(){}[\]]/g, '') // Remove dangerous characters
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/data:/gi, '') // Remove data: protocol
          .replace(/vbscript:/gi, '') // Remove vbscript: protocol
          .replace(/on\w+=/gi, '') // Remove event handlers
          .replace(/<script/gi, '') // Remove script tags
          .replace(/<\/script>/gi, '') // Remove closing script tags
          .replace(/<iframe/gi, '') // Remove iframe tags
          .replace(/<\/iframe>/gi, '') // Remove closing iframe tags
          .replace(/<object/gi, '') // Remove object tags
          .replace(/<\/object>/gi, '') // Remove closing object tags
          .replace(/<embed/gi, '') // Remove embed tags
          .replace(/<\/embed>/gi, '') // Remove closing embed tags
          .replace(/union\s+select/gi, '') // Remove SQL injection patterns
          .replace(/drop\s+table/gi, '') // Remove SQL injection patterns
          .replace(/delete\s+from/gi, '') // Remove SQL injection patterns
          .replace(/insert\s+into/gi, '') // Remove SQL injection patterns
          .replace(/update\s+set/gi, '') // Remove SQL injection patterns
          .replace(/exec\s*\(/gi, '') // Remove command execution patterns
          .replace(/eval\s*\(/gi, '') // Remove eval patterns
          .replace(/document\./gi, '') // Remove DOM manipulation patterns
          .replace(/window\./gi, '') // Remove window object patterns
          .replace(/alert\s*\(/gi, '') // Remove alert patterns
          .replace(/confirm\s*\(/gi, '') // Remove confirm patterns
          .replace(/prompt\s*\(/gi, '') // Remove prompt patterns
          .replace(/console\./gi, '') // Remove console patterns
          .replace(/debugger/gi, '') // Remove debugger statements
          .replace(/<!--/g, '') // Remove HTML comments
          .replace(/-->/g, '') // Remove HTML comments
          .replace(/\/\*/g, '') // Remove CSS comments
          .replace(/\*\//g, '') // Remove CSS comments
          .replace(/\/\//g, '') // Remove single line comments
          .replace(/\\/g, '') // Remove backslashes
          .replace(/\0/g, '') // Remove null bytes
          .replace(/\x00/g, '') // Remove null bytes
          .replace(/\u0000/g, '') // Remove null bytes
          .trim();
      })
      .custom((value) => {
        // Additional security checks
        if (value.length > 200) {
          throw new Error('Search query too long');
        }
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /data:text\/html/i,
          /vbscript:/i,
          /on\w+\s*=/i,
          /union\s+select/i,
          /drop\s+table/i,
          /delete\s+from/i,
          /insert\s+into/i,
          /update\s+set/i,
          /exec\s*\(/i,
          /eval\s*\(/i,
          /document\./i,
          /window\./i,
          /alert\s*\(/i,
          /confirm\s*\(/i,
          /prompt\s*\(/i,
          /console\./i,
          /debugger/i
        ];
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            throw new Error('Search query contains suspicious content');
          }
        }
        
        return true;
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

  // Enhanced validate file uploads
  validateFileUpload: [
    body('file')
      .optional()
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('No file uploaded');
        }
        
        // Check file size (configurable limit)
        const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
        if (req.file.size > maxFileSize) {
          throw new Error(`File size too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`);
        }
        
        // Check file type with enhanced validation
        const allowedTypes = process.env.ALLOWED_FILE_TYPES ? 
          process.env.ALLOWED_FILE_TYPES.split(',') : 
          ['image/jpeg', 'image/png', 'image/webp'];
        
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        }
        
        // Check file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExtension)) {
          throw new Error('Invalid file extension');
        }
        
        // Check for double extension attacks
        if (req.file.originalname.includes('..')) {
          throw new Error('Invalid filename');
        }
        
        // Check filename length
        if (req.file.originalname.length > 255) {
          throw new Error('Filename too long');
        }
        
        // Check for suspicious filename patterns
        const suspiciousPatterns = [
          /\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$/i,
          /\.(exe|dll|bat|cmd|com|scr|pif|vbs|js)$/i,
          /\.(htaccess|htpasswd|ini|log|sh|sql|fla|psd|swf)$/i,
          /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,
          /[<>:"/\\|?*]/g
        ];
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(req.file.originalname)) {
            throw new Error('Suspicious filename detected');
          }
        }
        
        // Check file magic bytes (basic content validation)
        const magicBytes = {
          'image/jpeg': [0xFF, 0xD8, 0xFF],
          'image/png': [0x89, 0x50, 0x4E, 0x47],
          'image/webp': [0x52, 0x49, 0x46, 0x46]
        };
        
        const fileBuffer = req.file.buffer;
        const expectedBytes = magicBytes[req.file.mimetype];
        
        if (expectedBytes) {
          const isValid = expectedBytes.every((byte, index) => fileBuffer[index] === byte);
          if (!isValid) {
            throw new Error('File content does not match declared type');
          }
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
