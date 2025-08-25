const express = require('express');
const router = express.Router();
const PriceHistoryService = require('../services/PriceHistoryService');
const inputValidation = require('../middleware/inputValidation');
const cacheService = require('../services/CacheService');

// Rate limiting for price history requests
const rateLimit = require('express-rate-limit');
const priceHistoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many price history requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(priceHistoryLimiter);

/**
 * GET /api/price-history/health
 * Health check for price history service
 */
router.get('/health', async (req, res) => {
  try {
    const health = await PriceHistoryService.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Price history service health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/price-history/sources
 * Get available price history sources
 */
router.get('/sources', (req, res) => {
  const sources = [
    {
      name: 'eBay',
      description: 'Historical sold item prices from eBay',
      reliability: 'high',
      dataPoints: 'recent sales'
    },
    {
      name: 'Marketplace',
      description: 'Aggregated market data from multiple sources',
      reliability: 'medium',
      dataPoints: 'current market estimates'
    },
    {
      name: 'Amazon',
      description: 'Current Amazon product prices',
      reliability: 'medium',
      dataPoints: 'current retail prices'
    },
    {
      name: 'Estimated',
      description: 'Generated price history based on market trends',
      reliability: 'low',
      dataPoints: 'trend-based estimates'
    }
  ];

  res.json({
    success: true,
    data: sources
  });
});

/**
 * GET /api/price-history/trend/:productId
 * Get price trend analysis for a product
 */
router.get('/trend/:productId', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check cache first
    const cacheKey = `price-trend:${productId}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached price trend for: ${productId}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get price history first
    const priceHistory = await PriceHistoryService.getPriceHistory(productId);

    if (priceHistory.success && priceHistory.data.priceHistory) {
      const trend = PriceHistoryService.getPriceTrend(priceHistory.data.priceHistory);
      
      const trendData = {
        productId,
        trend: trend.trend,
        change: trend.change,
        confidence: trend.confidence,
        currentPrice: priceHistory.data.currentPrice,
        lastUpdated: priceHistory.data.lastUpdated
      };

      // Cache the trend for 15 minutes
      cacheService.set(cacheKey, trendData, 900);

      res.json({
        success: true,
        data: trendData,
        cached: false
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Price trend not available',
        error: priceHistory.error
      });
    }

  } catch (error) {
    console.error('Price trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price trend',
      error: error.message
    });
  }
});

/**
 * GET /api/price-history/:productId
 * Get price history for a specific product
 */
router.get('/:productId', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { productId } = req.params;
    const includeTrend = req.query.trend === 'true';

    // Check cache first
    const cacheKey = `price-history:${productId}:${includeTrend}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached price history for: ${productId}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get price history
    const priceHistory = await PriceHistoryService.getPriceHistory(productId);

    if (priceHistory.success) {
      // Add trend analysis if requested
      if (includeTrend && priceHistory.data.priceHistory) {
        const trend = PriceHistoryService.getPriceTrend(priceHistory.data.priceHistory);
        priceHistory.data.trend = trend;
      }

      // Cache the result for 30 minutes
      cacheService.set(cacheKey, priceHistory.data, 1800);

      res.json({
        success: true,
        data: priceHistory.data,
        cached: false
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Price history not found',
        error: priceHistory.error
      });
    }

  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price history',
      error: error.message
    });
  }
});

module.exports = router;
