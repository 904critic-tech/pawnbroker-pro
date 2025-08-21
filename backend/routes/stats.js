const express = require('express');
const router = express.Router();
const UserStatsService = require('../services/UserStatsService');
const SearchHistoryService = require('../services/SearchHistoryService');

// Rate limiting for stats requests
const rateLimit = require('express-rate-limit');

const statsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many stats requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get comprehensive user statistics
router.get('/user/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;

    // If no userId provided, use the requesting user's ID
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting user stats for: ${targetUserId || 'all users'}`);
    
    const stats = await UserStatsService.getUserStats(targetUserId);
    
    res.json({
      success: true,
      data: stats,
      userId: targetUserId
    });
    
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message
    });
  }
});

// Get overview statistics
router.get('/overview/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting overview stats for: ${targetUserId || 'all users'}`);
    
    const overview = await UserStatsService.getOverviewStats(targetUserId);
    
    res.json({
      success: true,
      data: overview,
      userId: targetUserId
    });
    
  } catch (error) {
    console.error('Overview stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get overview statistics',
      error: error.message
    });
  }
});

// Get search analytics
router.get('/analytics/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting search analytics for: ${targetUserId || 'all users'}`);
    
    const analytics = await UserStatsService.getSearchAnalytics(targetUserId);
    
    res.json({
      success: true,
      data: analytics,
      userId: targetUserId
    });
    
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search analytics',
      error: error.message
    });
  }
});

// Get performance metrics
router.get('/performance/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting performance metrics for: ${targetUserId || 'all users'}`);
    
    const metrics = await UserStatsService.getPerformanceMetrics(targetUserId);
    
    res.json({
      success: true,
      data: metrics,
      userId: targetUserId
    });
    
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error.message
    });
  }
});

// Get popular items
router.get('/popular/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    const requestingUserId = req.user?.uid || null;
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting popular items for: ${targetUserId || 'all users'}`);
    
    const popularItems = await UserStatsService.getPopularItems(targetUserId, parseInt(limit));
    
    res.json({
      success: true,
      data: popularItems,
      userId: targetUserId,
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Popular items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular items',
      error: error.message
    });
  }
});

// Get category breakdown
router.get('/categories/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting category breakdown for: ${targetUserId || 'all users'}`);
    
    const categories = await UserStatsService.getCategoryBreakdown(targetUserId);
    
    res.json({
      success: true,
      data: categories,
      userId: targetUserId
    });
    
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category breakdown',
      error: error.message
    });
  }
});

// Get source reliability
router.get('/sources/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting source reliability for: ${targetUserId || 'all users'}`);
    
    const sources = await UserStatsService.getSourceReliability(targetUserId);
    
    res.json({
      success: true,
      data: sources,
      userId: targetUserId
    });
    
  } catch (error) {
    console.error('Source reliability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get source reliability',
      error: error.message
    });
  }
});

// Get trends
router.get('/trends/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting trends for: ${targetUserId || 'all users'}`);
    
    const trends = await UserStatsService.getTrends(targetUserId);
    
    res.json({
      success: true,
      data: trends,
      userId: targetUserId
    });
    
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trends',
      error: error.message
    });
  }
});

// Export user data (GDPR compliance)
router.get('/export/:userId', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;

    // Only allow users to export their own data or admin access
    if (userId !== requestingUserId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to export this user\'s data'
      });
    }

    console.log(`📊 Exporting user data for: ${userId}`);
    
    const exportData = await UserStatsService.exportUserData(userId);
    
    res.json({
      success: true,
      data: exportData,
      userId: userId
    });
    
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data',
      error: error.message
    });
  }
});

// Delete user data (GDPR compliance)
router.delete('/delete/:userId', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.uid || null;

    // Only allow users to delete their own data or admin access
    if (userId !== requestingUserId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this user\'s data'
      });
    }

    console.log(`🗑️ Deleting user data for: ${userId}`);
    
    const deletedCount = await UserStatsService.deleteUserData(userId);
    
    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} records`,
      deletedCount: deletedCount,
      userId: userId
    });
    
  } catch (error) {
    console.error('Data deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user data',
      error: error.message
    });
  }
});

// Get search history
router.get('/history/:userId?', statsLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    const requestingUserId = req.user?.uid || null;
    const targetUserId = userId || requestingUserId;

    console.log(`📊 Getting search history for: ${targetUserId || 'all users'}`);
    
    const history = await SearchHistoryService.getRecentSearches(parseInt(limit));
    
    res.json({
      success: true,
      data: history,
      userId: targetUserId,
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search history',
      error: error.message
    });
  }
});

// Health check for stats service
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      services: {
        userStats: 'available',
        searchHistory: 'available',
        mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: health
    });
    
  } catch (error) {
    console.error('Stats health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Stats service health check failed',
      error: error.message
    });
  }
});

module.exports = router;
