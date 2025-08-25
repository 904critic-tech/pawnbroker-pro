const express = require('express');
const router = express.Router();
const ebayScraper = require('../services/eBayScraper');
const inputValidation = require('../middleware/inputValidation');
const cacheService = require('../services/CacheService');

// Rate limiting for eBay scraping
const rateLimit = require('express-rate-limit');

const ebayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many eBay scraping requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search eBay sold items
router.get('/search/:query', ebayLimiter, inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 25;
    
    console.log(`Searching eBay for: ${query}`);
    
    // Check cache first
    const cachedResults = cacheService.getCachedSearchResults(query, limit);
    if (cachedResults) {
      console.log(`📦 Returning cached results for: ${query}`);
      return res.json({
        success: true,
        data: cachedResults,
        cached: true
      });
    }
    
    // Fetch fresh data
    const results = await ebayScraper.searchSoldItems(query, limit);
    
    // Cache the results
    cacheService.cacheSearchResults(query, results, limit);
    
    res.json({
      success: true,
      data: results,
      cached: false
    });
    
  } catch (error) {
    console.error('eBay search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search eBay listings',
      error: error.message
    });
  }
});

// Get pricing estimate
router.get('/estimate/:query', ebayLimiter, inputValidation.validateSearchQuery, async (req, res) => {
  try {
    const { query } = req.params;
    
    console.log(`Getting pricing estimate for: ${query}`);
    
    // Check cache first
    const cachedEstimate = cacheService.getCachedPricingEstimate(query);
    if (cachedEstimate) {
      console.log(`📦 Returning cached estimate for: ${query}`);
      return res.json({
        success: true,
        data: cachedEstimate,
        cached: true
      });
    }
    
    // Fetch fresh data
    const estimate = await ebayScraper.getPricingEstimate(query);
    
    // Cache the estimate
    cacheService.cachePricingEstimate(query, estimate);
    
    res.json({
      success: true,
      data: estimate,
      cached: false
    });
    
  } catch (error) {
    console.error('eBay estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing estimate',
      error: error.message
    });
  }
});

// Health check for eBay scraper
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'eBay scraper service is running',
    timestamp: new Date().toISOString()
  });
});

// Cache statistics endpoint
router.get('/cache/stats', (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
});

// Clear cache endpoint
router.post('/cache/clear', (req, res) => {
  try {
    cacheService.clear();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

module.exports = router;
