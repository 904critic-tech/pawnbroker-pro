const express = require('express');
const router = express.Router();
const GlobalLearningService = require('../services/GlobalLearningService');

// Initialize the global learning service
const globalLearningService = new GlobalLearningService();

// Initialize the service when the module loads
(async () => {
  try {
    await globalLearningService.initialize();
  } catch (error) {
    console.error('❌ Failed to initialize GlobalLearningService in routes:', error);
  }
})();

// Middleware to ensure service is initialized
const ensureInitialized = (req, res, next) => {
  if (!globalLearningService.db) {
    return res.status(503).json({
      success: false,
      error: 'Global learning service is not available (offline mode)',
      message: 'The global learning system is currently offline. Local learning will continue to work.'
    });
  }
  next();
};

// POST /api/global-learning/sync
// Sync user's local learning data to global database
router.post('/sync', ensureInitialized, async (req, res) => {
  try {
    const { userId, learningData } = req.body;
    
    if (!userId || !learningData) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId or learningData'
      });
    }

    const syncResult = await globalLearningService.syncUserLearning(userId, learningData);
    
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
});

// GET /api/global-learning/data
// Get global learning data for mobile app
router.get('/data', ensureInitialized, async (req, res) => {
  try {
    const globalData = await globalLearningService.getGlobalLearningData();
    
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
});

// GET /api/global-learning/suggestions
// Get search suggestions based on global data
router.get('/suggestions', ensureInitialized, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing query parameter'
      });
    }

    const suggestions = await globalLearningService.getGlobalSearchSuggestions(query, parseInt(limit));
    
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
});

// GET /api/global-learning/trending
// Get trending brands and models
router.get('/trending', ensureInitialized, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const trendingItems = await globalLearningService.getTrendingItems(parseInt(limit));
    
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
});

// GET /api/global-learning/stats
// Get global learning statistics
router.get('/stats', ensureInitialized, async (req, res) => {
  try {
    const stats = await globalLearningService.getGlobalStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get stats request failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get global statistics'
    });
  }
});

// POST /api/global-learning/cleanup
// Clean up old data (admin endpoint)
router.post('/cleanup', ensureInitialized, async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    const cleanupResult = await globalLearningService.cleanupOldData(daysToKeep);
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      result: cleanupResult
    });
  } catch (error) {
    console.error('❌ Cleanup request failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old data'
    });
  }
});

// GET /api/global-learning/export
// Export global learning data (admin endpoint)
router.get('/export', ensureInitialized, async (req, res) => {
  try {
    const exportData = await globalLearningService.exportGlobalData();
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('❌ Export request failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export global data'
    });
  }
});

// GET /api/global-learning/health
// Health check endpoint
router.get('/health', ensureInitialized, async (req, res) => {
  try {
    const stats = await globalLearningService.getGlobalStats();
    
    res.json({
      success: true,
      status: 'healthy',
      data: {
        service: 'GlobalLearningService',
        status: 'initialized',
        stats: stats
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Service health check failed'
    });
  }
});

module.exports = router;
