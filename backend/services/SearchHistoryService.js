const SearchHistory = require('../models/SearchHistory');

class SearchHistoryService {
  /**
   * Save a search to history
   */
  async saveSearch(searchData) {
    try {
      const {
        query,
        category = 'Unknown',
        sources = [],
        aggregatedResult,
        searchMetadata = {},
        queryType = 'quick'
      } = searchData;

      // Check if MongoDB is connected
      if (!require('mongoose').connection.readyState) {
        console.log(`📝 Search would be saved to history (MongoDB not connected): ${query}`);
        return null;
      }

      const searchHistory = new SearchHistory({
        query,
        category,
        sources,
        aggregatedResult,
        searchMetadata: {
          ...searchMetadata,
          queryType,
          timestamp: new Date()
        }
      });

      await searchHistory.save();
      console.log(`✅ Search saved to history: ${query}`);
      return searchHistory;
    } catch (error) {
      console.error('❌ Failed to save search to history:', error);
      // Don't throw error, just log it
      console.log(`📝 Search would be saved to history (error): ${searchData.query}`);
      return null;
    }
  }

  /**
   * Find similar searches for AI learning
   */
  async findSimilarSearches(query, limit = 5) {
    try {
      // Check if MongoDB is connected
      if (!require('mongoose').connection.readyState) {
        console.log(`🔍 Similar searches not available (MongoDB not connected): ${query}`);
        return [];
      }

      const similarSearches = await SearchHistory.findSimilarSearches(query, limit);
      console.log(`🔍 Found ${similarSearches.length} similar searches for: ${query}`);
      return similarSearches;
    } catch (error) {
      console.error('❌ Failed to find similar searches:', error);
      return [];
    }
  }

  /**
   * Get search statistics for analytics
   */
  async getSearchStats() {
    try {
      const stats = await SearchHistory.getSearchStats();
      return stats[0] || {
        totalSearches: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        mostSearchedItems: []
      };
    } catch (error) {
      console.error('❌ Failed to get search stats:', error);
      return {
        totalSearches: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        mostSearchedItems: []
      };
    }
  }

  /**
   * Get recent searches for reference
   */
  async getRecentSearches(limit = 20) {
    try {
      const recentSearches = await SearchHistory.find()
        .sort({ 'searchMetadata.timestamp': -1 })
        .limit(limit)
        .select('query aggregatedResult searchMetadata.timestamp sources');
      
      return recentSearches;
    } catch (error) {
      console.error('❌ Failed to get recent searches:', error);
      return [];
    }
  }

  /**
   * Get most searched items for AI learning
   */
  async getMostSearchedItems(limit = 10) {
    try {
      const mostSearched = await SearchHistory.aggregate([
        {
          $group: {
            _id: '$query',
            count: { $sum: 1 },
            averageConfidence: { $avg: '$aggregatedResult.confidence' },
            averageMarketValue: { $avg: '$aggregatedResult.marketValue' },
            lastSearched: { $max: '$searchMetadata.timestamp' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return mostSearched;
    } catch (error) {
      console.error('❌ Failed to get most searched items:', error);
      return [];
    }
  }

  /**
   * Update search with user feedback for AI learning
   */
  async updateSearchFeedback(searchId, feedback, notes = '') {
    try {
      const search = await SearchHistory.findById(searchId);
      if (!search) {
        throw new Error('Search not found');
      }

      await search.updateFeedback(feedback, notes);
      console.log(`✅ Search feedback updated: ${search.query}`);
      return search;
    } catch (error) {
      console.error('❌ Failed to update search feedback:', error);
      throw error;
    }
  }

  /**
   * Get search performance analytics
   */
  async getPerformanceAnalytics() {
    try {
      const analytics = await SearchHistory.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$searchMetadata.timestamp' }
            },
            searches: { $sum: 1 },
            averageConfidence: { $avg: '$aggregatedResult.confidence' },
            averageProcessingTime: { $avg: '$searchMetadata.processingTime' },
            successfulSources: {
              $sum: {
                $size: {
                  $filter: {
                    input: '$sources',
                    cond: { $eq: ['$$this.success', true] }
                  }
                }
              }
            }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]);

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get performance analytics:', error);
      return [];
    }
  }

  /**
   * Clean up old search history (keep last 30 days)
   */
  async cleanupOldSearches(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await SearchHistory.deleteMany({
        'searchMetadata.timestamp': { $lt: cutoffDate }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old searches`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old searches:', error);
      throw error;
    }
  }
}

module.exports = new SearchHistoryService();
