const express = require('express');
const router = express.Router();
const KeepaAPIService = require('../services/KeepaAPIService');
const inputValidation = require('../middleware/inputValidation');
const cacheService = require('../services/CacheService');

// Rate limiting for Keepa API requests
const rateLimit = require('express-rate-limit');
const keepaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (Keepa has 100/day free)
  message: {
    success: false,
    message: 'Too many Keepa API requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(keepaLimiter);

/**
 * GET /api/keepa/health
 * Health check for Keepa API service
 */
router.get('/health', async (req, res) => {
  try {
    const health = await KeepaAPIService.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Keepa API service health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/keepa/domains
 * Get available Amazon domains
 */
router.get('/domains', (req, res) => {
  const domains = [
    { id: 1, name: 'Amazon.com', country: 'US', currency: 'USD' },
    { id: 2, name: 'Amazon.co.uk', country: 'UK', currency: 'GBP' },
    { id: 3, name: 'Amazon.de', country: 'Germany', currency: 'EUR' },
    { id: 4, name: 'Amazon.fr', country: 'France', currency: 'EUR' },
    { id: 5, name: 'Amazon.co.jp', country: 'Japan', currency: 'JPY' },
    { id: 6, name: 'Amazon.ca', country: 'Canada', currency: 'CAD' },
    { id: 7, name: 'Amazon.cn', country: 'China', currency: 'CNY' },
    { id: 8, name: 'Amazon.it', country: 'Italy', currency: 'EUR' },
    { id: 9, name: 'Amazon.es', country: 'Spain', currency: 'EUR' },
    { id: 10, name: 'Amazon.in', country: 'India', currency: 'INR' },
    { id: 11, name: 'Amazon.com.br', country: 'Brazil', currency: 'BRL' },
    { id: 12, name: 'Amazon.com.mx', country: 'Mexico', currency: 'MXN' },
    { id: 13, name: 'Amazon.com.au', country: 'Australia', currency: 'AUD' }
  ];

  res.json({
    success: true,
    data: domains
  });
});

/**
 * GET /api/keepa/token
 * Get API token status
 */
router.get('/token', async (req, res) => {
  try {
    const tokenResult = await KeepaAPIService.getTokenStatus();

    if (tokenResult.success) {
      res.json({
        success: true,
        data: tokenResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get token status',
        error: tokenResult.error
      });
    }

  } catch (error) {
    console.error('Keepa token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token status',
      error: error.message
    });
  }
});

/**
 * GET /api/keepa/categories
 * Get product categories
 */
router.get('/categories', async (req, res) => {
  try {
    const domain = parseInt(req.query.domain) || 1; // Default to US

    // Check cache first
    const cacheKey = `keepa-categories:${domain}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Keepa categories for domain: ${domain}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get categories
    const categoriesResult = await KeepaAPIService.getCategories(domain);

    if (categoriesResult.success) {
      // Cache the result for 24 hours (categories don't change often)
      cacheService.set(cacheKey, categoriesResult.data, 86400);

      res.json({
        success: true,
        data: categoriesResult.data,
        cached: false
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
        error: categoriesResult.error
      });
    }

  } catch (error) {
    console.error('Keepa categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

/**
 * GET /api/keepa/search/:query
 * Search for products on Amazon
 */
router.get('/search/:query', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { query } = req.params;
    const domain = parseInt(req.query.domain) || 1; // Default to US

    // Check cache first
    const cacheKey = `keepa-search:${query}:${domain}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Keepa search for: ${query}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Search for products
    const searchResult = await KeepaAPIService.searchProducts(query, domain);

    if (searchResult.success) {
      // Cache the result for 1 hour
      cacheService.set(cacheKey, searchResult.data, 3600);

      res.json({
        success: true,
        data: searchResult.data,
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
    console.error('Keepa search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
});

/**
 * GET /api/keepa/product/:asin
 * Get product price history by ASIN
 */
router.get('/product/:asin', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { asin } = req.params;
    const domain = parseInt(req.query.domain) || 1; // Default to US

    // Check cache first
    const cacheKey = `keepa-product:${asin}:${domain}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Keepa product for: ${asin}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get product price history
    const productResult = await KeepaAPIService.getProductPriceHistory(asin, domain);

    if (productResult.success) {
      // Cache the result for 2 hours (price data doesn't change frequently)
      cacheService.set(cacheKey, productResult.data, 7200);

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
    console.error('Keepa product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product data',
      error: error.message
    });
  }
});

/**
 * GET /api/keepa/categories
 * Get product categories
 */
router.get('/categories', async (req, res) => {
  try {
    const domain = parseInt(req.query.domain) || 1; // Default to US

    // Check cache first
    const cacheKey = `keepa-categories:${domain}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Keepa categories for domain: ${domain}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get categories
    const categoriesResult = await KeepaAPIService.getCategories(domain);

    if (categoriesResult.success) {
      // Cache the result for 24 hours (categories don't change often)
      cacheService.set(cacheKey, categoriesResult.data, 86400);

      res.json({
        success: true,
        data: categoriesResult.data,
        cached: false
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
        error: categoriesResult.error
      });
    }

  } catch (error) {
    console.error('Keepa categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

/**
 * GET /api/keepa/token
 * Get API token status
 */
router.get('/token', async (req, res) => {
  try {
    const tokenResult = await KeepaAPIService.getTokenStatus();

    if (tokenResult.success) {
      res.json({
        success: true,
        data: tokenResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get token status',
        error: tokenResult.error
      });
    }

  } catch (error) {
    console.error('Keepa token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token status',
      error: error.message
    });
  }
});

/**
 * GET /api/keepa/domains
 * Get available Amazon domains
 */
router.get('/domains', (req, res) => {
  const domains = [
    { id: 1, name: 'Amazon.com', country: 'US', currency: 'USD' },
    { id: 2, name: 'Amazon.co.uk', country: 'UK', currency: 'GBP' },
    { id: 3, name: 'Amazon.de', country: 'Germany', currency: 'EUR' },
    { id: 4, name: 'Amazon.fr', country: 'France', currency: 'EUR' },
    { id: 5, name: 'Amazon.co.jp', country: 'Japan', currency: 'JPY' },
    { id: 6, name: 'Amazon.ca', country: 'Canada', currency: 'CAD' },
    { id: 7, name: 'Amazon.cn', country: 'China', currency: 'CNY' },
    { id: 8, name: 'Amazon.it', country: 'Italy', currency: 'EUR' },
    { id: 9, name: 'Amazon.es', country: 'Spain', currency: 'EUR' },
    { id: 10, name: 'Amazon.in', country: 'India', currency: 'INR' },
    { id: 11, name: 'Amazon.com.br', country: 'Brazil', currency: 'BRL' },
    { id: 12, name: 'Amazon.com.mx', country: 'Mexico', currency: 'MXN' },
    { id: 13, name: 'Amazon.com.au', country: 'Australia', currency: 'AUD' }
  ];

  res.json({
    success: true,
    data: domains
  });
});

module.exports = router;
