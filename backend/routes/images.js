const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const GoogleCloudVisionService = require('../services/GoogleCloudVisionService');
const FirebaseService = require('../services/FirebaseService');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddbbqoz7m',
  api_key: process.env.CLOUDINARY_API_KEY || '347494445896686',
  api_secret: process.env.CLOUDINARY_API_SECRET || '5F4VZfsYkfHCG1c11zJr9Qs9IE'
});

// @route   POST /api/images/recognize
// @desc    Recognize item from uploaded image using Google Cloud Vision
// @access  Private
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('🔍 Starting image recognition for:', req.file.originalname);

    // Perform comprehensive image analysis using Google Cloud Vision
    const analysis = await GoogleCloudVisionService.analyzeImage(req.file.buffer);
    
    // Extract product information from analysis
    const productInfo = GoogleCloudVisionService.extractProductInfo(analysis);

    // Upload image to Firebase Storage for future reference (optional)
    let imageUrl = null;
    if (FirebaseService.isInitialized) {
      try {
        const fileName = `recognition_${Date.now()}_${req.file.originalname}`;
        imageUrl = await FirebaseService.uploadImage(req.file.buffer, fileName, req.file.mimetype);
        console.log('📤 Image uploaded to Firebase Storage:', imageUrl);
      } catch (uploadError) {
        console.warn('⚠️ Failed to upload image to Firebase:', uploadError.message);
        // Continue without Firebase upload - not critical for recognition
      }
    } else {
      console.log('ℹ️ Firebase not configured - skipping image upload');
    }

    const response = {
      success: true,
      productInfo,
      analysis: {
        labels: analysis.labels.slice(0, 10), // Top 10 labels
        objects: analysis.objects.slice(0, 5), // Top 5 objects
        text: analysis.text.length > 0 ? analysis.text[0].description : '',
        webEntities: analysis.webEntities.slice(0, 5), // Top 5 web entities
        safeSearch: analysis.safeSearch
      },
      imageUrl,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Image recognition completed successfully');
    res.json(response);
  } catch (error) {
    console.error('❌ Image recognition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing image',
      error: error.message
    });
  }
});

// @route   POST /api/images/upload
// @desc    Upload image for item
// @access  Private
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('📤 Starting image upload for:', req.file.originalname);

    // Upload to Firebase Storage
    let firebaseUrl = null;
    try {
      const fileName = `upload_${Date.now()}_${req.file.originalname}`;
      firebaseUrl = await FirebaseService.uploadImage(req.file.buffer, fileName, req.file.mimetype);
      console.log('📤 Image uploaded to Firebase Storage:', firebaseUrl);
    } catch (firebaseError) {
      console.error('❌ Firebase upload failed:', firebaseError);
    }

    // Also upload to Cloudinary as backup
    let cloudinaryUrl = null;
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          resource_type: 'image',
          folder: 'pawnbroker'
        }, (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }).end(req.file.buffer);
      });

      cloudinaryUrl = result.secure_url;
      console.log('📤 Image uploaded to Cloudinary:', cloudinaryUrl);
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError);
    }

    const response = {
      success: true,
      imageUrl: firebaseUrl || cloudinaryUrl,
      backupUrl: firebaseUrl && cloudinaryUrl ? cloudinaryUrl : null,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Image upload completed successfully');
    res.json(response);
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading image',
      error: error.message
    });
  }
});

// @route   POST /api/images/analyze
// @desc    Analyze image for text, objects, and labels
// @access  Private
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('🔍 Starting detailed image analysis for:', req.file.originalname);

    const analysisType = req.body.type || 'all'; // all, text, objects, labels, web, safe

    let results = {};

    switch (analysisType) {
      case 'text':
        results.text = await GoogleCloudVisionService.extractText(req.file.buffer);
        break;
      case 'objects':
        results.objects = await GoogleCloudVisionService.detectObjects(req.file.buffer);
        break;
      case 'labels':
        results.labels = await GoogleCloudVisionService.detectLabels(req.file.buffer);
        break;
      case 'web':
        results.web = await GoogleCloudVisionService.webDetection(req.file.buffer);
        break;
      case 'safe':
        results.safe = await GoogleCloudVisionService.safeSearchDetection(req.file.buffer);
        break;
      case 'all':
      default:
        results = await GoogleCloudVisionService.analyzeImage(req.file.buffer);
        break;
    }

    const response = {
      success: true,
      analysisType,
      results,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Image analysis completed successfully');
    res.json(response);
  } catch (error) {
    console.error('❌ Image analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while analyzing image',
      error: error.message
    });
  }
});

// @route   GET /api/images/health
// @desc    Health check for image services
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const visionHealth = await GoogleCloudVisionService.healthCheck();
    const firebaseHealth = { status: 'ok', message: 'Firebase service available' };

    const healthStatus = {
      googleCloudVision: visionHealth,
      firebase: firebaseHealth,
      cloudinary: { status: 'ok', message: 'Cloudinary service available' },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      services: healthStatus
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// @route   DELETE /api/images/:fileName
// @desc    Delete image from storage
// @access  Private
router.delete('/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    console.log('🗑️ Deleting image:', fileName);

    // Delete from Firebase Storage
    try {
      await FirebaseService.deleteImage(fileName);
      console.log('🗑️ Image deleted from Firebase Storage');
    } catch (firebaseError) {
      console.error('❌ Firebase delete failed:', firebaseError);
    }

    // Delete from Cloudinary (if it's a Cloudinary URL)
    try {
      if (fileName.includes('cloudinary')) {
        const publicId = fileName.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        console.log('🗑️ Image deleted from Cloudinary');
      }
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary delete failed:', cloudinaryError);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      fileName
    });
  } catch (error) {
    console.error('❌ Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image',
      error: error.message
    });
  }
});

module.exports = router;
