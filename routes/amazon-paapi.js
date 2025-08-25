const express = require('express');
const router = express.Router();
const AmazonPAAPIService = require('../services/AmazonPAAPIService');
const inputValidation = require('../middleware/inputValidation');
const cacheService = require('../services/CacheService');

// Rate limiting for Amazon PAAPI requests
const rateLimit = require('express-rate-limit');
const amazonPAAPILimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs (Amazon has strict limits)
  message: {
    success: false,
    message: 'Too many Amazon PAAPI requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(amazonPAAPILimiter);

/**
 * GET /api/amazon-paapi/health
 * Health check for Amazon PAAPI service
 */
router.get('/health', async (req, res) => {
  try {
    const health = await AmazonPAAPIService.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Amazon PAAPI service health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/amazon-paapi/search/:query
 * Search for products on Amazon
 */
router.get('/search/:query', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { query } = req.params;
    const searchIndex = req.query.searchIndex || 'All';
    const itemCount = parseInt(req.query.itemCount) || 10;

    // Check cache first
    const cacheKey = `amazon-paapi-search:${query}:${searchIndex}:${itemCount}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Amazon PAAPI search for: ${query}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Search for products
    const searchResult = await AmazonPAAPIService.searchProducts(query, {
      searchIndex: searchIndex,
      itemCount: itemCount
    });

    if (searchResult.success) {
      // Cache the result for 30 minutes
      cacheService.set(cacheKey, searchResult.data, 1800);

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
    console.error('Amazon PAAPI search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
});

/**
 * GET /api/amazon-paapi/product/:asin
 * Get product details by ASIN
 */
router.get('/product/:asin', inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { asin } = req.params;

    // Check cache first
    const cacheKey = `amazon-paapi-product:${asin}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Amazon PAAPI product for: ${asin}`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get product details
    const productResult = await AmazonPAAPIService.getProductDetails(asin);

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
    console.error('Amazon PAAPI product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product details',
      error: error.message
    });
  }
});

/**
 * GET /api/amazon-paapi/browse-nodes
 * Get browse nodes (categories)
 */
router.get('/browse-nodes', async (req, res) => {
  try {
    const browseNodeIds = req.query.ids ? req.query.ids.split(',') : [];
    
    if (browseNodeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Browse node IDs are required'
      });
    }

    // Check cache first
    const cacheKey = `amazon-paapi-browse-nodes:${browseNodeIds.join(',')}`;
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Returning cached Amazon PAAPI browse nodes`);
      return res.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get browse nodes
    const browseNodesResult = await AmazonPAAPIService.getBrowseNodes(browseNodeIds);

    if (browseNodesResult.success) {
      // Cache the result for 24 hours (categories don't change often)
      cacheService.set(cacheKey, browseNodesResult.data, 86400);

      res.json({
        success: true,
        data: browseNodesResult.data,
        cached: false
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Browse nodes not found',
        error: browseNodesResult.error
      });
    }

  } catch (error) {
    console.error('Amazon PAAPI browse nodes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get browse nodes',
      error: error.message
    });
  }
});

/**
 * GET /api/amazon-paapi/search-indices
 * Get available search indices
 */
router.get('/search-indices', (req, res) => {
  const searchIndices = [
    { id: 'All', name: 'All Departments', description: 'Search across all departments' },
    { id: 'Electronics', name: 'Electronics', description: 'Electronics and computers' },
    { id: 'Books', name: 'Books', description: 'Books and literature' },
    { id: 'HomeGarden', name: 'Home & Garden', description: 'Home improvement and garden' },
    { id: 'Automotive', name: 'Automotive', description: 'Automotive parts and accessories' },
    { id: 'Sports', name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
    { id: 'Tools', name: 'Tools & Home Improvement', description: 'Tools and hardware' },
    { id: 'Health', name: 'Health & Personal Care', description: 'Health and beauty products' },
    { id: 'Toys', name: 'Toys & Games', description: 'Toys and games' },
    { id: 'Clothing', name: 'Clothing, Shoes & Jewelry', description: 'Apparel and accessories' },
    { id: 'Beauty', name: 'Beauty & Personal Care', description: 'Beauty products' },
    { id: 'Office', name: 'Office Products', description: 'Office supplies and equipment' },
    { id: 'PetSupplies', name: 'Pet Supplies', description: 'Pet food and supplies' },
    { id: 'Baby', name: 'Baby', description: 'Baby products and supplies' },
    { id: 'Grocery', name: 'Grocery & Gourmet Food', description: 'Food and beverages' }
  ];

  res.json({
    success: true,
    data: searchIndices
  });
});

/**
 * GET /api/amazon-paapi/associate-info
 * Get associate information
 */
router.get('/associate-info', (req, res) => {
  const associateInfo = {
    associateTag: AmazonPAAPIService.associateTag,
    region: AmazonPAAPIService.region,
    hasCredentials: !!(AmazonPAAPIService.accessKeyId && AmazonPAAPIService.secretAccessKey),
    documentation: 'https://webservices.amazon.com/paapi5/documentation/',
    rateLimits: {
      requestsPerSecond: 1,
      requestsPerDay: 8640
    }
  };

  res.json({
    success: true,
    data: associateInfo
  });
});

module.exports = router;
