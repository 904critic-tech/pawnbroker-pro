const express = require('express');
const router = express.Router();
const CanopyAPIService = require('../services/CanopyAPIService');
const inputValidation = require('../middleware/inputValidation');
const cacheService = require('../services/CacheService');

// Rate limiting for Canopy API requests
const rateLimit = require('express-rate-limit');
const canopyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many Canopy API requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(canopyLimiter);

/**
 * GET /api/canopy/health
 * Health check for Canopy API service
 */
router.get('/health', async (req, res) => {
  try {
    const health = await CanopyAPIService.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Canopy API service health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/canopy/test
 * Test the Canopy API with a sample ASIN
 */
router.get('/test', async (req, res) => {
  try {
    const testResult = await CanopyAPIService.testAPI();
    
    if (testResult.success) {
      res.json({
        success: true,
        data: testResult.data,
        message: 'Canopy API test successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Canopy API test failed',
        error: testResult.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Canopy API test failed',
      error: error.message
    });
  }
});

/**
 * GET /api/canopy/search/:query
 * Search for products on Amazon via Canopy API
 */
router.get('/search/:query', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Check cache first
    const cacheKey = `canopy-search:${query}:${limit}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Canopy search for: ${query}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Search for products
    const searchResult = await CanopyAPIService.searchProducts(query, {
      limit: limit
    });

    if (searchResult.success) {
      // Cache the result for 30 minutes
      cacheService.set(cacheKey, searchResult.data, 1800);

      res.json({
        success: true,
        data: searchResult.data,
        total: searchResult.total,
        cached: false
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No products found',
        error: searchResult.error
      });
    }

  } catch (error) {
    console.error('Canopy API search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
});

/**
 * GET /api/canopy/product/:asin
 * Get product details by ASIN
 */
router.get('/product/:asin', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { asin } = req.params;

    // Check cache first
    const cacheKey = `canopy-product:${asin}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Canopy product for: ${asin}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get product details
    const productResult = await CanopyAPIService.getProductDetails(asin);

    if (productResult.success) {
      // Cache the result for 1 hour
      cacheService.set(cacheKey, productResult.data, 3600);

      res.json({
        success: true,
        data: productResult.data,
        cached: false
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        error: productResult.error
      });
    }

  } catch (error) {
    console.error('Canopy API product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product details',
      error: error.message
    });
  }
});

/**
 * GET /api/canopy/price-history/:asin
 * Get product price history by ASIN
 */
router.get('/price-history/:asin', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { asin } = req.params;

    // Check cache first
    const cacheKey = `canopy-price-history:${asin}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Canopy price history for: ${asin}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get price history
    const priceHistoryResult = await CanopyAPIService.getPriceHistory(asin);

    if (priceHistoryResult.success) {
      // Cache the result for 2 hours (price history doesn't change as frequently)
      cacheService.set(cacheKey, priceHistoryResult.data, 7200);

      res.json({
        success: true,
        data: priceHistoryResult.data,
        cached: false
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Price history not found',
        error: priceHistoryResult.error
      });
    }

  } catch (error) {
    console.error('Canopy API price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price history',
      error: error.message
    });
  }
});

/**
 * GET /api/canopy/reviews/:asin
 * Get product reviews by ASIN
 */
router.get('/reviews/:asin', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { asin } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const rating = req.query.rating ? parseInt(req.query.rating) : undefined;

    // Check cache first
    const cacheKey = `canopy-reviews:${asin}:${limit}:${rating || 'all'}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Canopy reviews for: ${asin}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get reviews
    const reviewsResult = await CanopyAPIService.getProductReviews(asin, {
      limit: limit,
      rating: rating
    });

    if (reviewsResult.success) {
      // Cache the result for 1 hour
      cacheService.set(cacheKey, reviewsResult.data, 3600);

      res.json({
        success: true,
        data: reviewsResult.data,
        cached: false
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Reviews not found',
        error: reviewsResult.error
      });
    }

  } catch (error) {
    console.error('Canopy API reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message
    });
  }
});

/**
 * GET /api/canopy/info
 * Get Canopy API information
 */
router.get('/info', (req, res) => {
  const apiInfo = {
    name: 'Canopy API',
    description: 'GraphQL API for Amazon product data',
    baseUrl: 'https://graphql.canopyapi.co',
    hasApiKey: !!CanopyAPIService.apiKey,
    features: [
      'Product search',
      'Product details by ASIN',
      'Price history',
      'Product reviews',
      'Real-time data'
    ],
    rateLimits: {
      requestsPerMinute: 50,
      requestsPerHour: 1000
    },
    documentation: 'https://canopyapi.co/docs'
  };

  res.json({
    success: true,
    data: apiInfo
  });
});

module.exports = router;
