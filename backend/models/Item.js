const mongoose = require('mongoose');

const searchResultSchema = new mongoose.Schema({
  id: String,
  title: String,
  price: Number,
  condition: String,
  soldDate: Date,
  source: {
    type: String,
    enum: ['ebay', 'other'],
    default: 'ebay'
  },
  url: String,
  imageUrl: String
});

const itemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Electronics',
      'Jewelry',
      'Luxury Watches',
      'Tools',
      'Musical Instruments',
      'Sports Equipment',
      'Collectibles',
      'Antiques',
      'Books',
      'Other'
    ]
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },
  model: {
    type: String,
    trim: true,
    maxlength: 100
  },
  condition: {
    type: String,
    required: true,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  imageUrl: {
    type: String
  },
  marketValue: {
    type: Number,
    required: true,
    min: 0
  },
  pawnValue: {
    type: Number,
    required: true,
    min: 0
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  searchResults: [searchResultSchema],
  notes: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true
  }],
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: {
    type: Date
  },
  acceptedValue: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
itemSchema.index({ userId: 1, createdAt: -1 });
itemSchema.index({ category: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ expiresAt: 1 });

// Virtual for profit calculation
itemSchema.virtual('potentialProfit').get(function() {
  return this.marketValue - this.pawnValue;
});

// Virtual for days until expiry
itemSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diffTime = this.expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to check if offer is expired
itemSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Method to accept offer
itemSchema.methods.acceptOffer = function() {
  this.isAccepted = true;
  this.acceptedAt = new Date();
  this.acceptedValue = this.pawnValue;
  this.status = 'accepted';
  return this.save();
};

// Method to reject offer
itemSchema.methods.rejectOffer = function() {
  this.status = 'rejected';
  return this.save();
};

// Pre-save middleware to update status based on expiry
itemSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('Item', itemSchema);
