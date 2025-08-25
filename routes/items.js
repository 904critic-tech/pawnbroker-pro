const express = require('express');
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');

const router = express.Router();

// @route   POST /api/items
// @desc    Create a new item valuation
// @access  Private
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item name is required and must be less than 200 characters'),
  body('category')
    .isIn(['Electronics', 'Jewelry', 'Luxury Watches', 'Tools', 'Musical Instruments', 'Sports Equipment', 'Collectibles', 'Antiques', 'Books', 'Other'])
    .withMessage('Invalid category'),
  body('condition')
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('marketValue')
    .isFloat({ min: 0 })
    .withMessage('Market value must be a positive number'),
  body('pawnValue')
    .isFloat({ min: 0 })
    .withMessage('Pawn value must be a positive number'),
  body('confidence')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence must be between 0 and 1'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Brand must be less than 100 characters'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model must be less than 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
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

    const {
      name,
      category,
      brand,
      model,
      condition,
      imageUrl,
      marketValue,
      pawnValue,
      confidence,
      searchResults,
      notes,
      tags
    } = req.body;

    // Create new item
    const item = new Item({
      userId: req.user._id,
      name,
      category,
      brand,
      model,
      condition,
      imageUrl,
      marketValue,
      pawnValue,
      confidence,
      searchResults: searchResults || [],
      notes,
      tags: tags || []
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'Item valuation created successfully',
      data: { item }
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating item valuation'
    });
  }
});

// @route   GET /api/items
// @desc    Get user's item history
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const items = await Item.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'firstName lastName businessName');

    // Get total count
    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items'
    });
  }
});

// @route   GET /api/items/:id
// @desc    Get specific item by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('userId', 'firstName lastName businessName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: { item }
    });

  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching item'
    });
  }
});

// @route   PUT /api/items/:id
// @desc    Update item valuation
// @access  Private
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item name must be less than 200 characters'),
  body('category')
    .optional()
    .isIn(['Electronics', 'Jewelry', 'Luxury Watches', 'Tools', 'Musical Instruments', 'Sports Equipment', 'Collectibles', 'Antiques', 'Books', 'Other'])
    .withMessage('Invalid category'),
  body('condition')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  body('marketValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Market value must be a positive number'),
  body('pawnValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Pawn value must be a positive number'),
  body('confidence')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence must be between 0 and 1')
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

    const item = await Item.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        item[key] = req.body[key];
      }
    });

    await item.save();

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: { item }
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating item'
    });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete item valuation
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting item'
    });
  }
});

// @route   POST /api/items/:id/accept
// @desc    Accept item offer
// @access  Private
router.post('/:id/accept', async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Item is not in pending status'
      });
    }

    await item.acceptOffer();

    res.json({
      success: true,
      message: 'Offer accepted successfully',
      data: { item }
    });

  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting offer'
    });
  }
});

// @route   POST /api/items/:id/reject
// @desc    Reject item offer
// @access  Private
router.post('/:id/reject', async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Item is not in pending status'
      });
    }

    await item.rejectOffer();

    res.json({
      success: true,
      message: 'Offer rejected successfully',
      data: { item }
    });

  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting offer'
    });
  }
});

// @route   GET /api/items/stats/summary
// @desc    Get user's item statistics
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Item.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalMarketValue: { $sum: '$marketValue' },
          totalPawnValue: { $sum: '$pawnValue' },
          averageConfidence: { $avg: '$confidence' },
          acceptedItems: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
          },
          pendingItems: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Item.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: '$marketValue' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalItems: 0,
          totalMarketValue: 0,
          totalPawnValue: 0,
          averageConfidence: 0,
          acceptedItems: 0,
          pendingItems: 0
        },
        categories: categoryStats
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;
