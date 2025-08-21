const express = require('express');
const router = express.Router();
const amazonService = require('../services/AmazonAPIService');
const rateLimit = require('express-rate-limit');

// Rate limiting for Amazon API calls
const amazonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests to Amazon API, please try again later.'
  }
});

// Search Amazon products
router.get('/search/:query', amazonLimiter, async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log(`🔍 Amazon search request: ${query} (limit: ${limit})`);
    
    const products = await amazonService.searchProducts(query, limit);
    
    if (!products) {
      return res.status(404).json({
        success: false,
        message: 'No products found on Amazon'
      });
    }
    
    res.json({
      success: true,
      data: {
        query,
        products,
        totalFound: products.length,
        source: 'amazon'
      }
    });
  } catch (error) {
    console.error('❌ Amazon search error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get product details by ASIN
router.get('/product/:asin', amazonLimiter, async (req, res) => {
  try {
    const { asin } = req.params;
    
    console.log(`📦 Amazon product details request: ${asin}`);
    
    const product = await amazonService.getProductDetails(asin);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found on Amazon'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('❌ Amazon product details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get pricing estimate from Amazon
router.get('/pricing/:query', amazonLimiter, async (req, res) => {
  try {
    const { query } = req.params;
    
    console.log(`💰 Amazon pricing request: ${query}`);
    
    const pricing = await amazonService.getPricingEstimate(query);
    
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('❌ Amazon pricing error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get price history for a product
router.get('/price-history/:asin', amazonLimiter, async (req, res) => {
  try {
    const { asin } = req.params;
    
    console.log(`📈 Amazon price history request: ${asin}`);
    
    const priceHistory = await amazonService.getPriceHistory(asin);
    
    if (!priceHistory) {
      return res.status(404).json({
        success: false,
        message: 'Price history not available'
      });
    }
    
    res.json({
      success: true,
      data: priceHistory
    });
  } catch (error) {
    console.error('❌ Amazon price history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Health check for Amazon API
router.get('/health', async (req, res) => {
  try {
    const health = await amazonService.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('❌ Amazon health check error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
