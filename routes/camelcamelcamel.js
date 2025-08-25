const express = require('express');
const router = express.Router();
const camelCamelCamelScraper = require('../services/CamelCamelCamelScraper');

// Rate limiting for CamelCamelCamel scraping
const rateLimit = require('express-rate-limit');

const camelLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many CamelCamelCamel requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search products on CamelCamelCamel
router.get('/search/:query', camelLimiter, async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    console.log(`Searching CamelCamelCamel for: ${query}`);
    
    const results = await camelCamelCamelScraper.searchProducts(query, limit);
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('CamelCamelCamel search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search CamelCamelCamel',
      error: error.message
    });
  }
});

// Get price history for a product
router.get('/price-history/:query', camelLimiter, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product query is required'
      });
    }

    console.log(`Getting CamelCamelCamel price history for: ${query}`);
    
    const priceData = await camelCamelCamelScraper.getProductPriceData(query);
    
    res.json({
      success: true,
      data: priceData
    });
    
  } catch (error) {
    console.error('CamelCamelCamel price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price history',
      error: error.message
    });
  }
});

// Get comprehensive price analysis
router.get('/analyze/:query', camelLimiter, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product query is required'
      });
    }

    console.log(`Analyzing CamelCamelCamel data for: ${query}`);
    
    const priceData = await camelCamelCamelScraper.getProductPriceData(query);
    
    // Calculate additional insights
    const analysis = {
      product: priceData.product,
      currentPrice: priceData.priceHistory.currentPrice,
      priceStats: priceData.priceHistory.priceStats,
      priceHistory: priceData.priceHistory.priceHistory,
      insights: {
        priceTrend: this.calculatePriceTrend(priceData.priceHistory.priceHistory),
        bestTimeToBuy: this.calculateBestTimeToBuy(priceData.priceHistory.priceHistory),
        priceVolatility: this.calculatePriceVolatility(priceData.priceHistory.priceHistory),
        averagePrice: this.calculateAveragePrice(priceData.priceHistory.priceHistory)
      },
      source: 'camelcamelcamel',
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('CamelCamelCamel analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze price data',
      error: error.message
    });
  }
});

// Helper methods for price analysis
function calculatePriceTrend(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) return 'stable';
  
  const recent = priceHistory.slice(-5);
  const older = priceHistory.slice(-10, -5);
  
  const recentAvg = recent.reduce((sum, item) => sum + item.price, 0) / recent.length;
  const olderAvg = older.reduce((sum, item) => sum + item.price, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}

function calculateBestTimeToBuy(priceHistory) {
  if (!priceHistory || priceHistory.length === 0) return 'insufficient data';
  
  const prices = priceHistory.map(item => item.price);
  const minPrice = Math.min(...prices);
  const currentPrice = prices[prices.length - 1];
  
  if (currentPrice <= minPrice * 1.05) return 'good time to buy';
  if (currentPrice >= minPrice * 1.2) return 'wait for price drop';
  return 'moderate price';
}

function calculatePriceVolatility(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) return 'low';
  
  const prices = priceHistory.map(item => item.price);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / avgPrice) * 100;
  
  if (coefficientOfVariation > 15) return 'high';
  if (coefficientOfVariation > 8) return 'medium';
  return 'low';
}

function calculateAveragePrice(priceHistory) {
  if (!priceHistory || priceHistory.length === 0) return 0;
  
  const prices = priceHistory.map(item => item.price);
  return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
}

// Health check for CamelCamelCamel scraper
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CamelCamelCamel scraper service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
