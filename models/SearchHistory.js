const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    default: 'Unknown'
  },
  sources: [{
    name: {
      type: String,
      enum: ['ebay', 'facebook', 'craigslist', 'offerup', 'mercari', 'camelcamelcamel'],
      required: true
    },
    success: {
      type: Boolean,
      required: true
    },
    dataPoints: {
      type: Number,
      default: 0
    },
    averagePrice: {
      type: Number,
      default: 0
    },
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      avg: { type: Number, default: 0 }
    },
    error: String,
    responseTime: Number
  }],
  aggregatedResult: {
    marketValue: Number,
    pawnValue: Number,
    confidence: Number,
    totalDataPoints: Number,
    sourcesUsed: Number
  },
  searchMetadata: {
    userAgent: String,
    ipAddress: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    processingTime: Number,
    queryType: {
      type: String,
      enum: ['quick', 'comprehensive', 'breakdown'],
      default: 'quick'
    }
  },
  aiLearning: {
    confidenceScore: Number,
    accuracyRating: Number,
    userFeedback: {
      type: String,
      enum: ['accurate', 'inaccurate', 'unclear', 'not_provided'],
      default: 'not_provided'
    },
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
searchHistorySchema.index({ query: 'text' });
searchHistorySchema.index({ 'searchMetadata.timestamp': -1 });
searchHistorySchema.index({ 'aggregatedResult.confidence': -1 });
searchHistorySchema.index({ 'aiLearning.userFeedback': 1 });

// Static method to find similar searches
searchHistorySchema.statics.findSimilarSearches = function(query, limit = 5) {
  return this.find({
    $text: { $search: query }
  })
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit)
  .select('query aggregatedResult searchMetadata.timestamp');
};

// Static method to get search statistics
searchHistorySchema.statics.getSearchStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalSearches: { $sum: 1 },
        averageConfidence: { $avg: '$aggregatedResult.confidence' },
        averageProcessingTime: { $avg: '$searchMetadata.processingTime' },
        mostSearchedItems: {
          $push: {
            query: '$query',
            count: 1
          }
        }
      }
    }
  ]);
};

// Instance method to update with user feedback
searchHistorySchema.methods.updateFeedback = function(feedback, notes = '') {
  this.aiLearning.userFeedback = feedback;
  this.aiLearning.notes = notes;
  return this.save();
};

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
