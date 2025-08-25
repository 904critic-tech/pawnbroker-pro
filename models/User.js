const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 12,
    validate: {
      validator: function(password) {
        // Password must contain at least:
        // - 12 characters minimum
        // - 1 uppercase letter
        // - 1 lowercase letter
        // - 1 number
        // - 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
        return passwordRegex.test(password);
      },
      message: 'Password must be at least 12 characters long and contain uppercase, lowercase, number, and special character'
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    set: function(value) {
      // Encrypt phone number before storing
      if (value) {
        return this.encryptField(value);
      }
      return value;
    },
    get: function(value) {
      // Decrypt phone number when retrieving
      if (value) {
        return this.decryptField(value);
      }
      return value;
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    pawnPercentage: {
      type: Number,
      default: 30,
      min: 10,
      max: 50
    },
    maxSearchResults: {
      type: Number,
      default: 20,
      min: 5,
      max: 100
    },
    enableNotifications: {
      type: Boolean,
      default: true
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  passwordHistory: [{
    password: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: Date
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ businessName: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check if this password was used recently (last 5 passwords)
    const newPassword = this.password;
    const recentPasswords = this.passwordHistory.slice(-5);
    
    for (const historyItem of recentPasswords) {
      const isMatch = await bcrypt.compare(newPassword, historyItem.password);
      if (isMatch) {
        const error = new Error('Password cannot be the same as your last 5 passwords');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Add current password to history before updating
    if (this.passwordHistory.length >= 10) {
      this.passwordHistory.shift(); // Remove oldest password
    }
    
    this.passwordHistory.push({
      password: this.password,
      changedAt: new Date()
    });
    
    this.password = hashedPassword;
    this.passwordChangedAt = new Date();
    this.failedLoginAttempts = 0; // Reset failed attempts on password change
    this.accountLockedUntil = undefined; // Unlock account on password change
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method with account lockout
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Check if account is locked
  if (this.accountLockedUntil && this.accountLockedUntil > new Date()) {
    const lockoutTime = Math.ceil((this.accountLockedUntil - new Date()) / 1000 / 60);
    throw new Error(`Account is locked. Try again in ${lockoutTime} minutes`);
  }
  
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  if (isMatch) {
    // Reset failed attempts on successful login
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
    this.lastLogin = new Date();
    this.loginCount += 1;
    await this.save();
  } else {
    // Increment failed attempts
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.failedLoginAttempts >= 5) {
      this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    
    await this.save();
  }
  
  return isMatch;
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.accountLockedUntil && this.accountLockedUntil > new Date();
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Encryption methods
userSchema.methods.encryptField = function(value) {
  if (!value) return value;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return value;
  }
};

userSchema.methods.decryptField = function(value) {
  if (!value) return value;
  
  try {
    const parts = value.split(':');
    if (parts.length !== 2) return value;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return value;
  }
};

// Data masking methods
userSchema.methods.maskEmail = function() {
  if (!this.email) return '';
  const [local, domain] = this.email.split('@');
  const maskedLocal = local.length > 2 ? 
    local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1) :
    local;
  return `${maskedLocal}@${domain}`;
};

userSchema.methods.maskPhone = function() {
  if (!this.phone) return '';
  const cleaned = this.phone.replace(/\D/g, '');
  if (cleaned.length < 4) return this.phone;
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
};

userSchema.methods.maskName = function() {
  if (!this.firstName || !this.lastName) return '';
  return `${this.firstName.charAt(0)}. ${this.lastName.charAt(0)}.`;
};

// Remove password from JSON output and apply data masking for privacy
userSchema.methods.toJSON = function(options = {}) {
  const user = this.toObject();
  delete user.password;
  
  // Apply data masking based on privacy level
  if (options.privacyLevel === 'high') {
    user.email = this.maskEmail();
    user.phone = this.maskPhone();
    user.firstName = this.maskName();
    user.lastName = '';
    user.businessName = user.businessName ? '***' : '';
  } else if (options.privacyLevel === 'medium') {
    user.phone = this.maskPhone();
  }
  
  return user;
};

// Data retention and cleanup methods
userSchema.methods.markForDeletion = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

userSchema.methods.anonymizeData = function() {
  this.firstName = 'Anonymous';
  this.lastName = 'User';
  this.email = `anonymous_${this._id}@deleted.com`;
  this.phone = '';
  this.businessName = '';
  this.isActive = false;
  this.anonymizedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
