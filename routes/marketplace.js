const express = require('express');
const router = express.Router();
const marketDataAggregator = require('../services/MarketDataAggregator');
const searchHistoryService = require('../services/SearchHistoryService');

// Rate limiting for marketplace data requests
const rateLimit = require('express-rate-limit');

const marketplaceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many marketplace requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get comprehensive market data from all sources
router.get('/comprehensive/:query', marketplaceLimiter, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    console.log(`Getting comprehensive market data for: ${query}`);
    
    const comprehensiveData = await marketDataAggregator.getComprehensiveMarketData(query);
    
    res.json({
      success: true,
      data: comprehensiveData
    });
    
  } catch (error) {
    console.error('Comprehensive market data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comprehensive market data',
      error: error.message
    });
  }
});

// Get quick market estimate (eBay only)
router.get('/quick/:query', marketplaceLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    console.log(`Getting quick market estimate for: ${query}`);
    
    const quickEstimate = await marketDataAggregator.getQuickMarketEstimate(query);
    
    // Save search to history for AI learning
    try {
      await searchHistoryService.saveSearch({
        query,
        category: 'Unknown',
        sources: [{
          name: 'ebay',
          success: true,
          dataPoints: quickEstimate.dataPoints || 0,
          averagePrice: quickEstimate.marketValue,
          priceRange: {
            min: quickEstimate.priceRange?.min || 0,
            max: quickEstimate.priceRange?.max || 0,
            avg: quickEstimate.marketValue
          },
          responseTime: Date.now() - startTime
        }],
        aggregatedResult: {
          marketValue: quickEstimate.marketValue,
          pawnValue: quickEstimate.pawnValue,
          confidence: quickEstimate.confidence,
          totalDataPoints: quickEstimate.dataPoints || 0,
          sourcesUsed: 1
        },
        searchMetadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          processingTime: Date.now() - startTime,
          queryType: 'quick'
        }
      });
    } catch (historyError) {
      console.log('⚠️  Failed to save search history:', historyError.message);
      // Don't fail the request if history saving fails
    }
    
    res.json({
      success: true,
      data: quickEstimate
    });
    
  } catch (error) {
    console.error('Quick market estimate error:', error);
    
    // Save failed search to history for AI learning
    try {
      await searchHistoryService.saveSearch({
        query: req.params.query,
        category: 'Unknown',
        sources: [{
          name: 'ebay',
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        }],
        aggregatedResult: {
          marketValue: 0,
          pawnValue: 0,
          confidence: 0,
          totalDataPoints: 0,
          sourcesUsed: 0
        },
        searchMetadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          processingTime: Date.now() - startTime,
          queryType: 'quick'
        }
      });
    } catch (historyError) {
      console.log('⚠️  Failed to save failed search history:', historyError.message);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get quick market estimate',
      error: error.message
    });
  }
});

// Get market data breakdown by source
router.get('/breakdown/:query', marketplaceLimiter, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    console.log(`Getting market data breakdown for: ${query}`);
    
    const comprehensiveData = await marketDataAggregator.getComprehensiveMarketData(query);
    
    // Extract breakdown by source
    const breakdown = {
      query,
      primarySource: comprehensiveData.aggregatedData.primaryMarketData,
      possibleMarketRates: comprehensiveData.aggregatedData.possibleMarketRates,
      priceHistory: comprehensiveData.aggregatedData.priceHistory,
      summary: comprehensiveData.aggregatedData.summary,
      sourceStatus: Object.entries(comprehensiveData.sources).map(([source, data]) => ({
        source,
        status: data.status,
        type: data.type || null,
        error: data.error || null
      })),
      lastUpdated: comprehensiveData.lastUpdated
    };
    
    res.json({
      success: true,
      data: breakdown
    });
    
  } catch (error) {
    console.error('Market data breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get market data breakdown',
      error: error.message
    });
  }
});

// Health check for marketplace aggregator
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Marketplace data aggregator service is running',
    availableSources: ['ebay', 'facebook', 'craigslist', 'offerup', 'mercari', 'camelcamelcamel'],
    primarySource: 'eBay (sold listings)',
    timestamp: new Date().toISOString()
  });
});

// Get search history analytics (for AI learning)
router.get('/analytics', async (req, res) => {
  try {
    const stats = await searchHistoryService.getSearchStats();
    const mostSearched = await searchHistoryService.getMostSearchedItems(10);
    const recentSearches = await searchHistoryService.getRecentSearches(20);
    
    res.json({
      success: true,
      data: {
        stats,
        mostSearched,
        recentSearches
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

// Get similar searches for AI learning
router.get('/similar/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const similarSearches = await searchHistoryService.findSimilarSearches(query, 5);
    
    res.json({
      success: true,
      data: similarSearches
    });
  } catch (error) {
    console.error('Similar searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar searches',
      error: error.message
    });
  }
});

// eBay Visual Learning endpoint
router.get('/ebay-visual-learning/:query', async (req, res) => {
  try {
    const { query } = req.params;
    console.log(`🔍 eBay Visual Learning request for: ${query}`);
    
    const ebayService = require('../services/eBayAPIService');
    const visualData = await ebayService.getItemsWithImagesForAILearning(query, 15);
    
    res.json(visualData);
  } catch (error) {
    console.error('eBay Visual Learning error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      aiLearningData: null
    });
  }
});

// PriceCharting Visual Learning endpoint
router.get('/pricecharting-visual-learning/:query', async (req, res) => {
  try {
    const { query } = req.params;
    console.log(`🔍 PriceCharting Visual Learning request for: ${query}`);
    
    const priceChartingService = require('../services/PriceChartingService');
    const visualData = await priceChartingService.getVisualAILearningData(query);
    
    res.json(visualData);
  } catch (error) {
    console.error('PriceCharting Visual Learning error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      visualLearningData: null
    });
  }
});

module.exports = router;
