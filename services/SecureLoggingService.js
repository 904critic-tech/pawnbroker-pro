const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecureLoggingService {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logDir = process.env.LOG_DIR || './logs';
    this.encryptionKey = process.env.LOG_ENCRYPTION_KEY || 'your-log-encryption-key';
    this.sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'phone', 'ssn', 'credit_card', 'bank_account', 'api_key',
      'private_key', 'session_id', 'refresh_token'
    ];
    
    this.initializeLogDirectory();
  }

  async initializeLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  // Mask sensitive data in objects
  maskSensitiveData(obj, depth = 0) {
    if (depth > 10) return '[MAX_DEPTH_REACHED]'; // Prevent infinite recursion
    
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskSensitiveData(item, depth + 1));
    }

    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveFields.some(field => 
        lowerKey.includes(field) || field.includes(lowerKey)
      );

      if (isSensitive) {
        if (typeof value === 'string' && value.length > 0) {
          masked[key] = this.maskValue(value);
        } else if (typeof value === 'object') {
          masked[key] = '[SENSITIVE_DATA]';
        } else {
          masked[key] = '[MASKED]';
        }
      } else if (typeof value === 'object') {
        masked[key] = this.maskSensitiveData(value, depth + 1);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  // Mask individual sensitive values
  maskValue(value) {
    if (typeof value !== 'string' || value.length === 0) {
      return '[MASKED]';
    }

    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }

    // Keep first and last character, mask the rest
    return value.charAt(0) + '*'.repeat(value.length - 2) + value.charAt(value.length - 1);
  }

  // Encrypt log content
  encryptLogContent(content) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(JSON.stringify(content), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Log encryption failed:', error);
      return content;
    }
  }

  // Create log entry
  createLogEntry(level, message, data = {}, options = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data: this.maskSensitiveData(data),
      ...options
    };

    // Add request context if available
    if (options.requestId) {
      logEntry.requestId = options.requestId;
    }
    if (options.userId) {
      logEntry.userId = options.userId;
    }
    if (options.ip) {
      logEntry.ip = options.ip;
    }

    return logEntry;
  }

  // Write log to file
  async writeLog(level, message, data = {}, options = {}) {
    const logEntry = this.createLogEntry(level, message, data, options);
    
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `${date}-${level}.log`);
      
      let logContent = JSON.stringify(logEntry) + '\n';
      
      // Encrypt sensitive logs
      if (level === 'error' || level === 'security' || options.encrypt) {
        logContent = this.encryptLogContent(logEntry) + '\n';
      }
      
      await fs.appendFile(logFile, logContent);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  // Log levels
  async info(message, data = {}, options = {}) {
    if (this.shouldLog('info')) {
      await this.writeLog('info', message, data, options);
    }
  }

  async warn(message, data = {}, options = {}) {
    if (this.shouldLog('warn')) {
      await this.writeLog('warn', message, data, options);
    }
  }

  async error(message, data = {}, options = {}) {
    if (this.shouldLog('error')) {
      await this.writeLog('error', message, data, { ...options, encrypt: true });
    }
  }

  async security(message, data = {}, options = {}) {
    if (this.shouldLog('security')) {
      await this.writeLog('security', message, data, { ...options, encrypt: true });
    }
  }

  async debug(message, data = {}, options = {}) {
    if (this.shouldLog('debug')) {
      await this.writeLog('debug', message, data, options);
    }
  }

  // Check if should log based on level
  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      security: 0 // Always log security events
    };

    const currentLevel = levels[this.logLevel] || 2;
    const messageLevel = levels[level] || 2;

    return messageLevel <= currentLevel;
  }

  // Log authentication events
  async logAuthEvent(event, userId, details = {}, options = {}) {
    const authData = {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    };

    await this.security(`Authentication event: ${event}`, authData, {
      ...options,
      encrypt: true
    });
  }

  // Log API requests
  async logApiRequest(method, endpoint, userId, ip, details = {}) {
    const requestData = {
      method,
      endpoint,
      userId,
      ip,
      timestamp: new Date().toISOString(),
      ...details
    };

    await this.info(`API Request: ${method} ${endpoint}`, requestData, {
      requestId: details.requestId
    });
  }

  // Log data access events
  async logDataAccess(operation, resource, userId, details = {}) {
    const accessData = {
      operation,
      resource,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    };

    await this.security(`Data access: ${operation} on ${resource}`, accessData, {
      encrypt: true
    });
  }

  // Log error with context
  async logError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    };

    await this.error(`Application error: ${error.message}`, errorData, {
      encrypt: true
    });
  }

  // Clean up old logs
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  // Get log statistics
  async getLogStats() {
    try {
      const files = await fs.readdir(this.logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        byLevel: {}
      };

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const fileStats = await fs.stat(filePath);
        stats.totalSize += fileStats.size;

        const level = file.split('-')[1]?.split('.')[0] || 'unknown';
        stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return null;
    }
  }
}

// Export singleton instance
const secureLoggingService = new SecureLoggingService();
module.exports = secureLoggingService;
