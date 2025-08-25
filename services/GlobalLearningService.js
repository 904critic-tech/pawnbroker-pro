const { MongoClient } = require('mongodb');
const axios = require('axios');

class GlobalLearningService {
  constructor() {
    this.db = null;
    this.collections = {};
    this.baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  }

  async initialize() {
    try {
      // Check if MongoDB URI is available
      if (!process.env.MONGODB_URI) {
        console.log('⚠️  MONGODB_URI not found, GlobalLearningService will run in offline mode');
        this.db = null;
        this.collections = {};
        return;
      }

      // Initialize MongoDB connection
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      this.db = client.db('global_learning');
      
      // Initialize collections
      this.collections = {
        brandPatterns: this.db.collection('brand_patterns'),
        modelPatterns: this.db.collection('model_patterns'),
        searchHistory: this.db.collection('search_history'),
        titlePatterns: this.db.collection('title_patterns'),
        userLearning: this.db.collection('user_learning'),
        globalStats: this.db.collection('global_stats'),
        learningQueue: this.db.collection('learning_queue')
      };
      
      // Create indexes for efficient querying
      await this.createIndexes();
      
      console.log('✅ GlobalLearningService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize GlobalLearningService:', error);
      console.log('⚠️  GlobalLearningService will run in offline mode');
      this.db = null;
      this.collections = {};
    }
  }

  async createIndexes() {
    try {
      // Brand patterns indexes
      await this.collections.brandPatterns.createIndex({ brand: 1 }, { unique: true });
      await this.collections.brandPatterns.createIndex({ confidence: -1 });
      await this.collections.brandPatterns.createIndex({ lastUpdated: -1 });

      // Model patterns indexes
      await this.collections.modelPatterns.createIndex({ model: 1 }, { unique: true });
      await this.collections.modelPatterns.createIndex({ brand: 1 });
      await this.collections.modelPatterns.createIndex({ confidence: -1 });
      await this.collections.modelPatterns.createIndex({ lastUpdated: -1 });

      // Search history indexes
      await this.collections.searchHistory.createIndex({ query: 1 });
      await this.collections.searchHistory.createIndex({ timestamp: -1 });
      await this.collections.searchHistory.createIndex({ userId: 1 });

      // Title patterns indexes
      await this.collections.titlePatterns.createIndex({ pattern: 1 }, { unique: true });
      await this.collections.titlePatterns.createIndex({ count: -1 });
      await this.collections.titlePatterns.createIndex({ lastUpdated: -1 });

      // User learning indexes
      await this.collections.userLearning.createIndex({ userId: 1 });
      await this.collections.userLearning.createIndex({ timestamp: -1 });

      // Learning queue indexes
      await this.collections.learningQueue.createIndex({ status: 1 });
      await this.collections.learningQueue.createIndex({ priority: -1 });
      await this.collections.learningQueue.createIndex({ createdAt: 1 });

      console.log('✅ GlobalLearningService indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
      throw error;
    }
  }

  // Sync local learning data to global database
  async syncUserLearning(userId, localLearningData) {
    try {
      console.log(`🔄 Syncing learning data for user ${userId}...`);
      
      const syncResult = {
        brandsSynced: 0,
        modelsSynced: 0,
        searchesSynced: 0,
        patternsSynced: 0,
        globalUpdates: 0
      };

      // Sync brand patterns
      if (localLearningData.brandPatterns) {
        for (const [brand, brandData] of Object.entries(localLearningData.brandPatterns)) {
          await this.updateGlobalBrandPattern(brand, brandData, userId);
          syncResult.brandsSynced++;
        }
      }

      // Sync model patterns
      if (localLearningData.modelPatterns) {
        for (const [model, modelData] of Object.entries(localLearningData.modelPatterns)) {
          await this.updateGlobalModelPattern(model, modelData, userId);
          syncResult.modelsSynced++;
        }
      }

      // Sync search history
      if (localLearningData.searchHistory) {
        for (const search of localLearningData.searchHistory) {
          await this.addGlobalSearchHistory(search, userId);
          syncResult.searchesSynced++;
        }
      }

      // Sync title patterns
      if (localLearningData.titlePatterns) {
        for (const [pattern, patternData] of Object.entries(localLearningData.titlePatterns)) {
          await this.updateGlobalTitlePattern(pattern, patternData, userId);
          syncResult.patternsSynced++;
        }
      }

      // Store user's learning contribution
      await this.collections.userLearning.insertOne({
        userId,
        timestamp: new Date(),
        dataSummary: {
          brandsCount: Object.keys(localLearningData.brandPatterns || {}).length,
          modelsCount: Object.keys(localLearningData.modelPatterns || {}).length,
          searchesCount: localLearningData.searchHistory?.length || 0,
          patternsCount: Object.keys(localLearningData.titlePatterns || {}).length
        }
      });

      // Update global statistics
      await this.updateGlobalStats();

      console.log(`✅ Sync completed for user ${userId}:`, syncResult);
      return syncResult;
    } catch (error) {
      console.error(`❌ Failed to sync learning data for user ${userId}:`, error);
      throw error;
    }
  }

  // Update global brand pattern with user contribution
  async updateGlobalBrandPattern(brand, brandData, userId) {
    try {
      const updateData = {
        $inc: {
          globalCount: brandData.count,
          userContributions: 1
        },
        $push: {
          examples: {
            $each: brandData.examples.slice(-5), // Keep last 5 examples
            $slice: -10 // Keep only last 10 total
          },
          contributingUsers: {
            $each: [userId],
            $slice: -100 // Keep last 100 contributing users
          }
        },
        $set: {
          lastUpdated: new Date(),
          lastContributor: userId
        }
      };

      // Update confidence based on global count
      const result = await this.collections.brandPatterns.findOneAndUpdate(
        { brand },
        updateData,
        { upsert: true, returnDocument: 'after' }
      );

      if (result.value) {
        // Recalculate confidence based on global data
        const newConfidence = Math.min(result.value.globalCount / 10, 1.0);
        await this.collections.brandPatterns.updateOne(
          { brand },
          { $set: { confidence: newConfidence } }
        );
      }

      return result.value;
    } catch (error) {
      console.error(`❌ Failed to update global brand pattern for ${brand}:`, error);
      throw error;
    }
  }

  // Update global model pattern with user contribution
  async updateGlobalModelPattern(model, modelData, userId) {
    try {
      const updateData = {
        $inc: {
          globalCount: modelData.count,
          userContributions: 1
        },
        $push: {
          examples: {
            $each: modelData.examples.slice(-5),
            $slice: -10
          },
          contributingUsers: {
            $each: [userId],
            $slice: -100
          }
        },
        $set: {
          brand: modelData.brand,
          lastUpdated: new Date(),
          lastContributor: userId
        }
      };

      const result = await this.collections.modelPatterns.findOneAndUpdate(
        { model },
        updateData,
        { upsert: true, returnDocument: 'after' }
      );

      if (result.value) {
        // Recalculate confidence based on global data
        const newConfidence = Math.min(result.value.globalCount / 5, 1.0);
        await this.collections.modelPatterns.updateOne(
          { model },
          { $set: { confidence: newConfidence } }
        );
      }

      return result.value;
    } catch (error) {
      console.error(`❌ Failed to update global model pattern for ${model}:`, error);
      throw error;
    }
  }

  // Add search history to global database
  async addGlobalSearchHistory(search, userId) {
    try {
      const searchDoc = {
        ...search,
        userId,
        globalTimestamp: new Date(),
        localTimestamp: new Date(search.timestamp)
      };

      await this.collections.searchHistory.insertOne(searchDoc);
      return searchDoc;
    } catch (error) {
      console.error('❌ Failed to add global search history:', error);
      throw error;
    }
  }

  // Update global title pattern with user contribution
  async updateGlobalTitlePattern(pattern, patternData, userId) {
    try {
      const updateData = {
        $inc: {
          globalCount: patternData.count,
          userContributions: 1
        },
        $set: {
          brand: patternData.brand,
          model: patternData.model,
          lastUpdated: new Date(),
          lastContributor: userId
        }
      };

      await this.collections.titlePatterns.updateOne(
        { pattern },
        updateData,
        { upsert: true }
      );
    } catch (error) {
      console.error(`❌ Failed to update global title pattern for ${pattern}:`, error);
      throw error;
    }
  }

  // Get global learning data for mobile app
  async getGlobalLearningData() {
    try {
      console.log('📥 Fetching global learning data...');
      
      const [brands, models, patterns, stats] = await Promise.all([
        this.collections.brandPatterns.find({ confidence: { $gte: 0.3 } }).sort({ confidence: -1 }).limit(1000).toArray(),
        this.collections.modelPatterns.find({ confidence: { $gte: 0.3 } }).sort({ confidence: -1 }).limit(1000).toArray(),
        this.collections.titlePatterns.find({ globalCount: { $gte: 2 } }).sort({ globalCount: -1 }).limit(500).toArray(),
        this.getGlobalStats()
      ]);

      const globalData = {
        brandPatterns: {},
        modelPatterns: {},
        titlePatterns: {},
        stats: stats,
        lastUpdated: new Date()
      };

      // Convert brands to expected format
      brands.forEach(brand => {
        globalData.brandPatterns[brand.brand] = {
          count: brand.globalCount,
          examples: brand.examples || [],
          confidence: brand.confidence
        };
      });

      // Convert models to expected format
      models.forEach(model => {
        globalData.modelPatterns[model.model] = {
          count: model.globalCount,
          examples: model.examples || [],
          confidence: model.confidence,
          brand: model.brand
        };
      });

      // Convert patterns to expected format
      patterns.forEach(pattern => {
        globalData.titlePatterns[pattern.pattern] = {
          count: pattern.globalCount,
          brand: pattern.brand,
          model: pattern.model
        };
      });

      console.log(`✅ Global learning data fetched: ${brands.length} brands, ${models.length} models, ${patterns.length} patterns`);
      return globalData;
    } catch (error) {
      console.error('❌ Failed to get global learning data:', error);
      throw error;
    }
  }

  // Get global statistics
  async getGlobalStats() {
    try {
      const stats = await this.collections.globalStats.findOne({ _id: 'current' });
      return stats || {
        totalBrands: 0,
        totalModels: 0,
        totalSearches: 0,
        totalPatterns: 0,
        totalUsers: 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to get global stats:', error);
      throw error;
    }
  }

  // Update global statistics
  async updateGlobalStats() {
    try {
      const [brandsCount, modelsCount, searchesCount, patternsCount, usersCount] = await Promise.all([
        this.collections.brandPatterns.countDocuments(),
        this.collections.modelPatterns.countDocuments(),
        this.collections.searchHistory.countDocuments(),
        this.collections.titlePatterns.countDocuments(),
        this.collections.userLearning.distinct('userId').then(users => users.length)
      ]);

      const stats = {
        _id: 'current',
        totalBrands: brandsCount,
        totalModels: modelsCount,
        totalSearches: searchesCount,
        totalPatterns: patternsCount,
        totalUsers: usersCount,
        lastUpdated: new Date()
      };

      await this.collections.globalStats.replaceOne({ _id: 'current' }, stats, { upsert: true });
      return stats;
    } catch (error) {
      console.error('❌ Failed to update global stats:', error);
      throw error;
    }
  }

  // Get search suggestions based on global data
  async getGlobalSearchSuggestions(query, limit = 10) {
    try {
      const suggestions = await this.collections.searchHistory.aggregate([
        {
          $match: {
            query: { $regex: query, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$query',
            count: { $sum: 1 },
            lastUsed: { $max: '$globalTimestamp' }
          }
        },
        {
          $sort: { count: -1, lastUsed: -1 }
        },
        {
          $limit: limit
        }
      ]).toArray();

      return suggestions.map(s => s._id);
    } catch (error) {
      console.error('❌ Failed to get global search suggestions:', error);
      throw error;
    }
  }

  // Get trending brands and models
  async getTrendingItems(limit = 20) {
    try {
      const [trendingBrands, trendingModels] = await Promise.all([
        this.collections.brandPatterns.find()
          .sort({ 'userContributions': -1, 'lastUpdated': -1 })
          .limit(limit)
          .toArray(),
        this.collections.modelPatterns.find()
          .sort({ 'userContributions': -1, 'lastUpdated': -1 })
          .limit(limit)
          .toArray()
      ]);

      return {
        trendingBrands: trendingBrands.map(b => ({
          brand: b.brand,
          count: b.globalCount,
          confidence: b.confidence,
          userContributions: b.userContributions
        })),
        trendingModels: trendingModels.map(m => ({
          model: m.model,
          brand: m.brand,
          count: m.globalCount,
          confidence: m.confidence,
          userContributions: m.userContributions
        }))
      };
    } catch (error) {
      console.error('❌ Failed to get trending items:', error);
      throw error;
    }
  }

  // Clean up old data
  async cleanupOldData(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const results = await Promise.all([
        this.collections.searchHistory.deleteMany({
          globalTimestamp: { $lt: cutoffDate }
        }),
        this.collections.userLearning.deleteMany({
          timestamp: { $lt: cutoffDate }
        })
      ]);

      console.log(`✅ Cleaned up old data: ${results[0].deletedCount} searches, ${results[1].deletedCount} user learning records`);
      return results;
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
      throw error;
    }
  }

  // Export global learning data
  async exportGlobalData() {
    try {
      console.log('📤 Exporting global learning data...');
      
      const [brands, models, patterns, stats] = await Promise.all([
        this.collections.brandPatterns.find({}).toArray(),
        this.collections.modelPatterns.find({}).toArray(),
        this.collections.titlePatterns.find({}).toArray(),
        this.getGlobalStats()
      ]);

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          stats: stats
        },
        brandPatterns: brands,
        modelPatterns: models,
        titlePatterns: patterns
      };

      return exportData;
    } catch (error) {
      console.error('❌ Failed to export global data:', error);
      throw error;
    }
  }

  // API endpoint to sync user learning
  async handleSyncRequest(req, res) {
    try {
      const { userId, learningData } = req.body;
      
      if (!userId || !learningData) {
        return res.status(400).json({
          success: false,
          error: 'Missing userId or learningData'
        });
      }

      const syncResult = await this.syncUserLearning(userId, learningData);
      
      res.json({
        success: true,
        message: 'Learning data synced successfully',
        result: syncResult
      });
    } catch (error) {
      console.error('❌ Sync request failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync learning data'
      });
    }
  }

  // API endpoint to get global learning data
  async handleGetGlobalDataRequest(req, res) {
    try {
      const globalData = await this.getGlobalLearningData();
      
      res.json({
        success: true,
        data: globalData
      });
    } catch (error) {
      console.error('❌ Get global data request failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get global learning data'
      });
    }
  }

  // API endpoint to get search suggestions
  async handleSearchSuggestionsRequest(req, res) {
    try {
      const { query, limit = 10 } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Missing query parameter'
        });
      }

      const suggestions = await this.getGlobalSearchSuggestions(query, parseInt(limit));
      
      res.json({
        success: true,
        suggestions: suggestions
      });
    } catch (error) {
      console.error('❌ Search suggestions request failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get search suggestions'
      });
    }
  }

  // API endpoint to get trending items
  async handleTrendingItemsRequest(req, res) {
    try {
      const { limit = 20 } = req.query;
      const trendingItems = await this.getTrendingItems(parseInt(limit));
      
      res.json({
        success: true,
        data: trendingItems
      });
    } catch (error) {
      console.error('❌ Trending items request failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trending items'
      });
    }
  }
}

module.exports = GlobalLearningService;
