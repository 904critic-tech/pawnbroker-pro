const vision = require('@google-cloud/vision');
const path = require('path');

class GoogleCloudVisionService {
  constructor() {
    // Initialize Google Cloud Vision client
    try {
      this.client = new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                     path.join(__dirname, '../config/google-service-account.json')
      });
      console.log('✅ Google Cloud Vision client initialized successfully');
    } catch (error) {
      console.error('❌ Google Cloud Vision client initialization failed:', error);
      this.client = null;
    }
  }

  // Perform comprehensive image analysis
  async analyzeImage(imageBuffer) {
    try {
      if (!this.client) {
        throw new Error('Google Cloud Vision client not initialized');
      }

      console.log('🔍 Google Cloud Vision: Starting comprehensive image analysis');
      
      const image = { content: imageBuffer };
      
      // Perform multiple types of analysis
      const [
        labelResult,
        textResult,
        objectResult,
        webResult,
        safeSearchResult
      ] = await Promise.all([
        this.client.labelDetection(image),
        this.client.textDetection(image),
        this.client.objectLocalization(image),
        this.client.webDetection(image),
        this.client.safeSearchDetection(image)
      ]);

      const analysis = {
        labels: labelResult[0].labelAnnotations || [],
        text: textResult[0].textAnnotations || [],
        objects: objectResult[0].localizedObjectAnnotations || [],
        webEntities: webResult[0].webDetection?.webEntities || [],
        safeSearch: safeSearchResult[0].safeSearchAnnotation || {},
        timestamp: new Date().toISOString()
      };

      console.log('✅ Google Cloud Vision: Analysis completed successfully');
      return analysis;
    } catch (error) {
      console.error('❌ Google Cloud Vision analysis failed:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  // Extract text from image (OCR)
  async extractText(imageBuffer) {
    try {
      if (!this.client) {
        throw new Error('Google Cloud Vision client not initialized');
      }

      console.log('🔍 Google Cloud Vision: Starting text extraction (OCR)');
      
      const [result] = await this.client.textDetection({ content: imageBuffer });
      const detections = result.textAnnotations || [];
      
      if (detections.length === 0) {
        console.log('⚠️ Google Cloud Vision: No text detected in image');
        return { text: '', confidence: 0 };
      }

      // First element contains the entire text
      const fullText = detections[0].description || '';
      const confidence = detections[0].confidence || 0;

      console.log('✅ Google Cloud Vision: Text extraction completed');
      return { text: fullText, confidence };
    } catch (error) {
      console.error('❌ Google Cloud Vision text extraction failed:', error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  // Detect objects in image
  async detectObjects(imageBuffer) {
    try {
      if (!this.client) {
        throw new Error('Google Cloud Vision client not initialized');
      }

      console.log('🔍 Google Cloud Vision: Starting object detection');
      
      const [result] = await this.client.objectLocalization({ content: imageBuffer });
      const objects = result.localizedObjectAnnotations || [];

      const detectedObjects = objects.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        boundingPoly: obj.boundingPoly
      }));

      console.log('✅ Google Cloud Vision: Object detection completed');
      return detectedObjects;
    } catch (error) {
      console.error('❌ Google Cloud Vision object detection failed:', error);
      throw new Error(`Object detection failed: ${error.message}`);
    }
  }

  // Detect labels (general image classification)
  async detectLabels(imageBuffer) {
    try {
      if (!this.client) {
        throw new Error('Google Cloud Vision client not initialized');
      }

      console.log('🔍 Google Cloud Vision: Starting label detection');
      
      const [result] = await this.client.labelDetection({ content: imageBuffer });
      const labels = result.labelAnnotations || [];

      const detectedLabels = labels.map(label => ({
        description: label.description,
        confidence: label.score,
        mid: label.mid
      }));

      console.log('✅ Google Cloud Vision: Label detection completed');
      return detectedLabels;
    } catch (error) {
      console.error('❌ Google Cloud Vision label detection failed:', error);
      throw new Error(`Label detection failed: ${error.message}`);
    }
  }

  // Web detection (find similar images and entities)
  async webDetection(imageBuffer) {
    try {
      if (!this.client) {
        throw new Error('Google Cloud Vision client not initialized');
      }

      console.log('🔍 Google Cloud Vision: Starting web detection');
      
      const [result] = await this.client.webDetection({ content: imageBuffer });
      const webDetection = result.webDetection || {};

      const webResults = {
        webEntities: webDetection.webEntities || [],
        fullMatchingImages: webDetection.fullMatchingImages || [],
        partialMatchingImages: webDetection.partialMatchingImages || [],
        visuallySimilarImages: webDetection.visuallySimilarImages || []
      };

      console.log('✅ Google Cloud Vision: Web detection completed');
      return webResults;
    } catch (error) {
      console.error('❌ Google Cloud Vision web detection failed:', error);
      throw new Error(`Web detection failed: ${error.message}`);
    }
  }

  // Safe search detection
  async safeSearchDetection(imageBuffer) {
    try {
      if (!this.client) {
        throw new Error('Google Cloud Vision client not initialized');
      }

      console.log('🔍 Google Cloud Vision: Starting safe search detection');
      
      const [result] = await this.client.safeSearchDetection({ content: imageBuffer });
      const safeSearch = result.safeSearchAnnotation || {};

      const safetyResults = {
        adult: safeSearch.adult || 'UNKNOWN',
        spoof: safeSearch.spoof || 'UNKNOWN',
        medical: safeSearch.medical || 'UNKNOWN',
        violence: safeSearch.violence || 'UNKNOWN',
        racy: safeSearch.racy || 'UNKNOWN'
      };

      console.log('✅ Google Cloud Vision: Safe search detection completed');
      return safetyResults;
    } catch (error) {
      console.error('❌ Google Cloud Vision safe search detection failed:', error);
      throw new Error(`Safe search detection failed: ${error.message}`);
    }
  }

  // Product search (for finding similar products)
  async productSearch(imageBuffer, productSetId = null) {
    try {
      if (!this.client) {
        throw new Error('Google Cloud Vision client not initialized');
      }

      console.log('🔍 Google Cloud Vision: Starting product search');
      
      const request = {
        image: { content: imageBuffer },
        features: [{ type: 'PRODUCT_SEARCH' }]
      };

      if (productSetId) {
        request.productSearchParams = {
          productSet: productSetId
        };
      }

      const [result] = await this.client.annotateImage(request);
      const productSearchResults = result.productSearchResults || {};

      console.log('✅ Google Cloud Vision: Product search completed');
      return productSearchResults;
    } catch (error) {
      console.error('❌ Google Cloud Vision product search failed:', error);
      throw new Error(`Product search failed: ${error.message}`);
    }
  }

  // Extract product information from image analysis
  extractProductInfo(analysis) {
    try {
      const productInfo = {
        brand: null,
        model: null,
        category: null,
        confidence: 0,
        extractedText: '',
        detectedObjects: [],
        labels: []
      };

      // Extract text for potential brand/model information
      if (analysis.text && analysis.text.length > 0) {
        productInfo.extractedText = analysis.text[0].description || '';
      }

      // Extract objects and labels
      if (analysis.objects) {
        productInfo.detectedObjects = analysis.objects.map(obj => ({
          name: obj.name,
          confidence: obj.score
        }));
      }

      if (analysis.labels) {
        productInfo.labels = analysis.labels.map(label => ({
          description: label.description,
          confidence: label.score
        }));
      }

      // Try to identify brand and model from text and labels
      const brandModelInfo = this.identifyBrandAndModel(
        productInfo.extractedText,
        productInfo.labels
      );

      productInfo.brand = brandModelInfo.brand;
      productInfo.model = brandModelInfo.model;
      productInfo.category = brandModelInfo.category;
      productInfo.confidence = brandModelInfo.confidence;

      return productInfo;
    } catch (error) {
      console.error('❌ Product info extraction failed:', error);
      return {
        brand: null,
        model: null,
        category: null,
        confidence: 0,
        extractedText: '',
        detectedObjects: [],
        labels: []
      };
    }
  }

  // Identify brand and model from text and labels
  identifyBrandAndModel(text, labels) {
    const result = {
      brand: null,
      model: null,
      category: null,
      confidence: 0
    };

    const combinedText = (text + ' ' + labels.map(l => l.description).join(' ')).toLowerCase();

    // Common brand patterns
    const brandPatterns = [
      { pattern: /apple|iphone|ipad|macbook|imac|mac/, brand: 'Apple' },
      { pattern: /samsung|galaxy/, brand: 'Samsung' },
      { pattern: /google|pixel/, brand: 'Google' },
      { pattern: /sony|playstation/, brand: 'Sony' },
      { pattern: /microsoft|xbox/, brand: 'Microsoft' },
      { pattern: /nintendo/, brand: 'Nintendo' },
      { pattern: /rolex/, brand: 'Rolex' },
      { pattern: /omega/, brand: 'Omega' },
      { pattern: /cartier/, brand: 'Cartier' },
      { pattern: /tiffany/, brand: 'Tiffany' }
    ];

    // Find brand
    for (const brandPattern of brandPatterns) {
      if (brandPattern.pattern.test(combinedText)) {
        result.brand = brandPattern.brand;
        result.confidence += 0.3;
        break;
      }
    }

    // Try to extract model information
    const modelPatterns = [
      /iphone\s+(\d+)\s*(pro|max|mini|plus)?/i,
      /ipad\s+(pro|air|mini)?\s*(\d+)?/i,
      /macbook\s+(pro|air)?\s*(\d+)?/i,
      /galaxy\s+s(\d+)/i,
      /pixel\s+(\d+)/i,
      /playstation\s+(\d+)/i,
      /xbox\s+(one|series\s+x|series\s+s)/i
    ];

    for (const modelPattern of modelPatterns) {
      const match = combinedText.match(modelPattern);
      if (match) {
        result.model = match[0];
        result.confidence += 0.4;
        break;
      }
    }

    // Determine category
    const categoryPatterns = [
      { pattern: /phone|smartphone|mobile/, category: 'Smartphone' },
      { pattern: /tablet|ipad/, category: 'Tablet' },
      { pattern: /laptop|computer|macbook/, category: 'Laptop' },
      { pattern: /watch|timepiece/, category: 'Watch' },
      { pattern: /jewelry|ring|necklace/, category: 'Jewelry' },
      { pattern: /game|console/, category: 'Gaming Console' }
    ];

    for (const categoryPattern of categoryPatterns) {
      if (categoryPattern.pattern.test(combinedText)) {
        result.category = categoryPattern.category;
        result.confidence += 0.2;
        break;
      }
    }

    return result;
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.client) {
        return { status: 'error', message: 'Client not initialized' };
      }
      return { status: 'ok', message: 'Google Cloud Vision service is ready' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = new GoogleCloudVisionService();
