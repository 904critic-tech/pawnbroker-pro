const express = require('express');
const router = express.Router();
const ebayScraper = require('../services/eBayScraper');
const lambdaService = require('../services/LambdaService');

// Simple rate limiting
const rateLimit = require('express-rate-limit');

const ebayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple input validation
const validateSearchQuery = (req, res, next) => {
  const { query } = req.params;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long'
    });
  }
  next();
};

// Search eBay sold items
router.get('/search/:query', ebayLimiter, validateSearchQuery, async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 25;
    
    console.log(`Searching eBay for: ${query}`);
    
    // Fetch fresh data
    const results = await ebayScraper.searchSoldItems(query, limit);
    
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
router.get('/estimate/:query', ebayLimiter, validateSearchQuery, async (req, res) => {
  try {
    const { query } = req.params;
    
    console.log(`Getting pricing estimate for: ${query}`);
    
    // Try Lambda first, fall back to local scraper
    let estimate;
    try {
      console.log(`🚀 Attempting Lambda pricing for: ${query}`);
      estimate = await lambdaService.getPricingEstimate(query);
      console.log(`✅ Lambda pricing successful for: ${query}`);
    } catch (lambdaError) {
      console.log(`⚠️ Lambda failed, falling back to local scraper for: ${query}`);
      console.log(`Lambda error: ${lambdaError.message}`);
      estimate = await ebayScraper.getPricingEstimate(query);
    }
    
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

// Test Lambda connection
router.get('/test-lambda', async (req, res) => {
  try {
    console.log('🧪 Testing Lambda connection...');
    
    // Test if LambdaService can be imported
    console.log('📦 Importing LambdaService...');
    const lambdaService = require('../services/LambdaService');
    console.log('✅ LambdaService imported successfully');
    
    const result = await lambdaService.testConnection();
    console.log('🔍 Lambda test result:', result);
    
    res.json({
      success: true,
      lambdaTest: result,
      message: 'Lambda connection test completed'
    });
    
  } catch (error) {
    console.error('Lambda test error:', error);
    res.status(500).json({
      success: false,
      message: 'Lambda connection test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
