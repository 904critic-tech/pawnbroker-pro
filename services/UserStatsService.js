const SearchHistory = require('../models/SearchHistory');
const User = require('../models/User');

class UserStatsService {
  /**
   * Get comprehensive user statistics
   */
  async getUserStats(userId = null) {
    try {
      const stats = {
        overview: await this.getOverviewStats(userId),
        searchAnalytics: await this.getSearchAnalytics(userId),
        performanceMetrics: await this.getPerformanceMetrics(userId),
        popularItems: await this.getPopularItems(userId),
        categoryBreakdown: await this.getCategoryBreakdown(userId),
        sourceReliability: await this.getSourceReliability(userId),
        trends: await this.getTrends(userId),
        lastUpdated: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats(userId = null) {
    try {
      const matchStage = userId ? { 'searchMetadata.userId': userId } : {};

      const stats = await SearchHistory.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            totalValue: { $sum: '$aggregatedResult.marketValue' },
            averageConfidence: { $avg: '$aggregatedResult.confidence' },
            averageProcessingTime: { $avg: '$searchMetadata.processingTime' },
            uniqueItems: { $addToSet: '$query' }
          }
        },
        {
          $project: {
            _id: 0,
            totalSearches: 1,
            totalValue: { $round: ['$totalValue', 2] },
            averageConfidence: { $round: ['$averageConfidence', 3] },
            averageProcessingTime: { $round: ['$averageProcessingTime', 2] },
            uniqueItemsCount: { $size: '$uniqueItems' }
          }
        }
      ]);

      return stats[0] || {
        totalSearches: 0,
        totalValue: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        uniqueItemsCount: 0
      };
    } catch (error) {
      console.error('❌ Failed to get overview stats:', error);
      return {
        totalSearches: 0,
        totalValue: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        uniqueItemsCount: 0
      };
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(userId = null) {
    try {
      const matchStage = userId ? { 'searchMetadata.userId': userId } : {};

      const analytics = await SearchHistory.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$searchMetadata.timestamp' }
            },
            searches: { $sum: 1 },
            totalValue: { $sum: '$aggregatedResult.marketValue' },
            averageConfidence: { $avg: '$aggregatedResult.confidence' },
            successfulSearches: {
              $sum: { $cond: [{ $gt: ['$aggregatedResult.confidence', 0.5] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]);

      return analytics.map(day => ({
        date: day._id,
        searches: day.searches,
        totalValue: Math.round(day.totalValue),
        averageConfidence: Math.round(day.averageConfidence * 100) / 100,
        successRate: Math.round((day.successfulSearches / day.searches) * 100)
      }));
    } catch (error) {
      console.error('❌ Failed to get search analytics:', error);
      return [];
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(userId = null) {
    try {
      const matchStage = userId ? { 'searchMetadata.userId': userId } : {};

      const metrics = await SearchHistory.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            avgProcessingTime: { $avg: '$searchMetadata.processingTime' },
            avgConfidence: { $avg: '$aggregatedResult.confidence' },
            avgDataPoints: { $avg: '$aggregatedResult.totalDataPoints' },
            avgSourcesUsed: { $avg: '$aggregatedResult.sourcesUsed' },
            successRate: {
              $avg: { $cond: [{ $gt: ['$aggregatedResult.confidence', 0.5] }, 1, 0] }
            }
          }
        }
      ]);

      const result = metrics[0] || {};
      return {
        averageProcessingTime: Math.round(result.avgProcessingTime || 0),
        averageConfidence: Math.round((result.avgConfidence || 0) * 100) / 100,
        averageDataPoints: Math.round(result.avgDataPoints || 0),
        averageSourcesUsed: Math.round(result.avgSourcesUsed || 0),
        successRate: Math.round((result.successRate || 0) * 100)
      };
    } catch (error) {
      console.error('❌ Failed to get performance metrics:', error);
      return {
        averageProcessingTime: 0,
        averageConfidence: 0,
        averageDataPoints: 0,
        averageSourcesUsed: 0,
        successRate: 0
      };
    }
  }

  /**
   * Get popular items
   */
  async getPopularItems(userId = null, limit = 10) {
    try {
      const matchStage = userId ? { 'searchMetadata.userId': userId } : {};

      const popularItems = await SearchHistory.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$query',
            count: { $sum: 1 },
            averageMarketValue: { $avg: '$aggregatedResult.marketValue' },
            averageConfidence: { $avg: '$aggregatedResult.confidence' },
            lastSearched: { $max: '$searchMetadata.timestamp' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return popularItems.map(item => ({
        query: item._id,
        searchCount: item.count,
        averageMarketValue: Math.round(item.averageMarketValue),
        averageConfidence: Math.round(item.averageConfidence * 100) / 100,
        lastSearched: item.lastSearched
      }));
    } catch (error) {
      console.error('❌ Failed to get popular items:', error);
      return [];
    }
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(userId = null) {
    try {
      const matchStage = userId ? { 'searchMetadata.userId': userId } : {};

      const categories = await SearchHistory.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalValue: { $sum: '$aggregatedResult.marketValue' },
            averageConfidence: { $avg: '$aggregatedResult.confidence' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return categories.map(cat => ({
        category: cat._id,
        searchCount: cat.count,
        totalValue: Math.round(cat.totalValue),
        averageConfidence: Math.round(cat.averageConfidence * 100) / 100
      }));
    } catch (error) {
      console.error('❌ Failed to get category breakdown:', error);
      return [];
    }
  }

  /**
   * Get source reliability metrics
   */
  async getSourceReliability(userId = null) {
    try {
      const matchStage = userId ? { 'searchMetadata.userId': userId } : {};

      const sourceStats = await SearchHistory.aggregate([
        { $match: matchStage },
        { $unwind: '$sources' },
        {
          $group: {
            _id: '$sources.name',
            totalUses: { $sum: 1 },
            successfulUses: { $sum: { $cond: ['$sources.success', 1, 0] } },
            averageDataPoints: { $avg: '$sources.dataPoints' },
            averageResponseTime: { $avg: '$sources.responseTime' }
          }
        },
        {
          $project: {
            source: '$_id',
            totalUses: 1,
            successfulUses: 1,
            successRate: { $multiply: [{ $divide: ['$successfulUses', '$totalUses'] }, 100] },
            averageDataPoints: { $round: ['$averageDataPoints', 0] },
            averageResponseTime: { $round: ['$averageResponseTime', 2] }
          }
        },
        { $sort: { successRate: -1 } }
      ]);

      return sourceStats;
    } catch (error) {
      console.error('❌ Failed to get source reliability:', error);
      return [];
    }
  }

  /**
   * Get trends over time
   */
  async getTrends(userId = null) {
    try {
      const matchStage = userId ? { 'searchMetadata.userId': userId } : {};

      const trends = await SearchHistory.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$searchMetadata.timestamp' }
            },
            searches: { $sum: 1 },
            totalValue: { $sum: '$aggregatedResult.marketValue' },
            averageConfidence: { $avg: '$aggregatedResult.confidence' }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 12 }
      ]);

      return trends.map(trend => ({
        month: trend._id,
        searches: trend.searches,
        totalValue: Math.round(trend.totalValue),
        averageConfidence: Math.round(trend.averageConfidence * 100) / 100
      }));
    } catch (error) {
      console.error('❌ Failed to get trends:', error);
      return [];
    }
  }

  /**
   * Get default stats when database is not available
   */
  getDefaultStats() {
    return {
      overview: {
        totalSearches: 0,
        totalValue: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        uniqueItemsCount: 0
      },
      searchAnalytics: [],
      performanceMetrics: {
        averageProcessingTime: 0,
        averageConfidence: 0,
        averageDataPoints: 0,
        averageSourcesUsed: 0,
        successRate: 0
      },
      popularItems: [],
      categoryBreakdown: [],
      sourceReliability: [],
      trends: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(userId) {
    try {
      const userSearches = await SearchHistory.find({ 'searchMetadata.userId': userId })
        .sort({ 'searchMetadata.timestamp': -1 })
        .lean();

      const userStats = await this.getUserStats(userId);

      return {
        searches: userSearches,
        statistics: userStats,
        exportDate: new Date().toISOString(),
        totalRecords: userSearches.length
      };
    } catch (error) {
      console.error('❌ Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Delete user data for GDPR compliance
   */
  async deleteUserData(userId) {
    try {
      const result = await SearchHistory.deleteMany({ 'searchMetadata.userId': userId });
      console.log(`🗑️ Deleted ${result.deletedCount} search records for user: ${userId}`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Failed to delete user data:', error);
      throw error;
    }
  }
}

module.exports = new UserStatsService();
