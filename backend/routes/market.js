const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   POST /api/market/search
// @desc    Search for market data on eBay
// @access  Private
router.post('/search', [
  body('query')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query is required and must be less than 200 characters'),
  body('category')
    .optional()
    .isIn(['Electronics', 'Jewelry', 'Luxury Watches', 'Tools', 'Musical Instruments', 'Sports Equipment', 'Collectibles', 'Antiques', 'Books', 'Other'])
    .withMessage('Invalid category')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { query, category } = req.body;

    // Use real eBay scraper for market data
    const ebayScraper = require('../services/eBayScraper');
    
    try {
      const searchResults = await ebayScraper.searchSoldItems(query, 25);
      
      res.json({
        success: true,
        message: 'Market search completed',
        data: {
          query,
          category,
          results: searchResults.items || [],
          totalResults: searchResults.totalFound || 0,
          averagePrice: searchResults.averagePrice || 0
        }
      });
    } catch (error) {
      console.error('Market search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get market data',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Market search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching market data'
    });
  }
});

// @route   POST /api/market/estimate
// @desc    Estimate market value based on item details
// @access  Private
router.post('/estimate', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item name is required'),
  body('category')
    .isIn(['Electronics', 'Jewelry', 'Luxury Watches', 'Tools', 'Musical Instruments', 'Sports Equipment', 'Collectibles', 'Antiques', 'Books', 'Other'])
    .withMessage('Invalid category'),
  body('condition')
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Brand must be less than 100 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, category, condition, brand } = req.body;

    // Use real eBay scraper for market value estimation
    const ebayScraper = require('../services/eBayScraper');
    
    try {
      const estimate = await ebayScraper.getPricingEstimate(name);
      
      // Apply condition multiplier to the real market value
      const conditionMultiplier = {
        excellent: 1.2,
        good: 1.0,
        fair: 0.8,
        poor: 0.5
      };
      
      const adjustedMarketValue = Math.round(estimate.marketValue * conditionMultiplier[condition]);
      const adjustedPawnValue = Math.round(adjustedMarketValue * 0.3);

      res.json({
        success: true,
        message: 'Market value estimated successfully',
        data: {
          item: { name, category, condition, brand },
          marketValue: adjustedMarketValue,
          pawnValue: adjustedPawnValue,
          confidence: estimate.confidence,
          dataPoints: estimate.dataPoints,
          priceRange: estimate.priceRange,
          recentSales: estimate.recentSales,
          factors: [
            'Real eBay sales data',
            'Item condition assessment',
            'Market demand analysis',
            'Recent transaction history'
          ]
        }
      });
    } catch (error) {
      console.error('Market estimation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to estimate market value',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Market estimation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while estimating market value'
    });
  }
});

// @route   GET /api/market/trends
// @desc    Get market trends for categories
// @access  Private
router.get('/trends', async (req, res) => {
  try {
    const { category } = req.query;

    // Market trends analysis based on real eBay data
    const ebayScraper = require('../services/eBayScraper');
    
    try {
      // Get recent data for popular items in each category to analyze trends
      const categories = category ? [category] : ['Electronics', 'Jewelry', 'Tools', 'Sports Equipment'];
      const trends = {};
      
      for (const cat of categories) {
        try {
          // Sample popular items in each category
          const sampleItems = {
            'Electronics': ['iPhone', 'MacBook', 'PlayStation'],
            'Jewelry': ['Gold Ring', 'Diamond Ring', 'Silver Necklace'],
            'Tools': ['Drill', 'Saw', 'Wrench'],
            'Sports Equipment': ['Bicycle', 'Treadmill', 'Dumbbells']
          };
          
          const items = sampleItems[cat] || ['item'];
          let totalValue = 0;
          let totalConfidence = 0;
          let itemCount = 0;
          
          for (const item of items) {
            try {
              const estimate = await ebayScraper.getPricingEstimate(item);
              totalValue += estimate.marketValue;
              totalConfidence += estimate.confidence;
              itemCount++;
            } catch (error) {
              console.log(`Failed to get data for ${item} in ${cat}`);
            }
          }
          
          if (itemCount > 0) {
            trends[cat] = {
              trend: 'stable', // Would need historical data for real trends
              averagePrice: Math.round(totalValue / itemCount),
              confidence: Math.round((totalConfidence / itemCount) * 100) / 100,
              dataPoints: itemCount,
              lastUpdated: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log(`Failed to analyze trends for ${cat}`);
        }
      }

      res.json({
        success: true,
        message: 'Market trends retrieved successfully',
        data: {
          trends,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Market trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get market trends',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching market trends'
    });
  }
});

module.exports = router;
