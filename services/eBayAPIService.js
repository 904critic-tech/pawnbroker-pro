const axios = require('axios');

class eBayAPIService {
  constructor() {
    this.appId = process.env.EBAY_APP_ID;
    this.baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';
    this.globalId = 'EBAY-US'; // US marketplace
    
    // Rate limiting configuration
    this.rateLimit = {
      maxRequests: 5000, // eBay Finding API limit: 5000 calls per day
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      currentRequests: 0,
      resetTime: Date.now() + (24 * 60 * 60 * 1000)
    };
    
    // Request tracking
    this.requestHistory = [];
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // Minimum 100ms between requests
    
    if (!this.appId) {
      throw new Error('EBAY_APP_ID environment variable is required');
    }
  }

  // Rate limiting method
  async checkRateLimit() {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now > this.rateLimit.resetTime) {
      this.rateLimit.currentRequests = 0;
      this.rateLimit.resetTime = now + this.rateLimit.windowMs;
    }
    
    // Check if we've exceeded the rate limit
    if (this.rateLimit.currentRequests >= this.rateLimit.maxRequests) {
      const timeUntilReset = this.rateLimit.resetTime - now;
      throw new Error(`eBay API rate limit exceeded. Reset in ${Math.ceil(timeUntilReset / 1000 / 60)} minutes`);
    }
    
    // Enforce minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Track API request
  trackRequest() {
    this.rateLimit.currentRequests++;
    this.requestHistory.push({
      timestamp: Date.now(),
      endpoint: 'findCompletedItems'
    });
    
    // Keep only last 1000 requests in history
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000);
    }
  }

  // Get rate limit status
  getRateLimitStatus() {
    const now = Date.now();
    const timeUntilReset = Math.max(0, this.rateLimit.resetTime - now);
    
    return {
      currentRequests: this.rateLimit.currentRequests,
      maxRequests: this.rateLimit.maxRequests,
      remainingRequests: this.rateLimit.maxRequests - this.rateLimit.currentRequests,
      resetTime: new Date(this.rateLimit.resetTime).toISOString(),
      timeUntilReset: Math.ceil(timeUntilReset / 1000 / 60), // minutes
      requestsInLastHour: this.requestHistory.filter(req => 
        now - req.timestamp < 60 * 60 * 1000
      ).length
    };
  }

  async searchSoldItems(query, limit = 10) {
    console.log(`🔍 Searching eBay Finding API for sold items: ${query}`);
    
    try {
      // Check rate limit before making request
      await this.checkRateLimit();
      
      const params = {
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': this.appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': query,
        'itemFilter(0).name': 'Condition',
        'itemFilter(0).value': 'Used',
        'itemFilter(1).name': 'ListingType',
        'itemFilter(1).value': 'AuctionWithBIN,FixedPrice',
        'itemFilter(2).name': 'SoldItemsOnly',
        'itemFilter(2).value': 'true',
        'sortOrder': 'EndTimeSoonest',
        'paginationInput.entriesPerPage': limit,
        'GLOBAL-ID': this.globalId
      };

      const response = await axios.get(this.baseUrl, { params });
      
      // Track successful request
      this.trackRequest();
      
      if (response.data && response.data.findCompletedItemsResponse && 
          response.data.findCompletedItemsResponse[0] && 
          response.data.findCompletedItemsResponse[0].searchResult && 
          response.data.findCompletedItemsResponse[0].searchResult[0] &&
          response.data.findCompletedItemsResponse[0].searchResult[0].item) {
        
        const items = response.data.findCompletedItemsResponse[0].searchResult[0].item;
        const parsedItems = items.map(item => this.parseItem(item));
        
        console.log(`✅ Found ${parsedItems.length} sold items on eBay API for: ${query}`);
        return parsedItems;
      } else {
        console.log(`⚠️  No sold items found on eBay API for: ${query}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ eBay API search failed for: ${query}`, error.message);
      throw new Error(`eBay API search failed: ${error.message}`);
    }
  }

  parseItem(item) {
    const title = item.title && item.title[0] ? item.title[0] : 'Unknown Item';
    const price = item.sellingStatus && item.sellingStatus[0] && 
                  item.sellingStatus[0].currentPrice && 
                  item.sellingStatus[0].currentPrice[0] ? 
                  parseFloat(item.sellingStatus[0].currentPrice[0].__value__) : 0;
    
    const endTime = item.listingInfo && item.listingInfo[0] && 
                    item.listingInfo[0].endTime ? 
                    item.listingInfo[0].endTime[0] : new Date().toISOString();
    
    const condition = item.condition && item.condition[0] && 
                      item.condition[0].conditionDisplayName ? 
                      item.condition[0].conditionDisplayName[0] : 'Used';
    
    const imageUrl = item.galleryURL && item.galleryURL[0] ? item.galleryURL[0] : null;
    const itemUrl = item.viewItemURL && item.viewItemURL[0] ? item.viewItemURL[0] : null;
    
    return {
      id: item.itemId && item.itemId[0] ? item.itemId[0] : `ebay-${Date.now()}`,
      title: title,
      price: price,
      imageUrl: imageUrl,
      url: itemUrl,
      soldDate: endTime,
      condition: condition,
      source: 'ebay-api'
    };
  }

  async getPricingEstimate(query) {
    console.log(`💰 Getting eBay API pricing estimate for: ${query}`);
    
    try {
      const items = await this.searchSoldItems(query, 20);
      
      if (!items || items.length === 0) {
        throw new Error('No sold items found on eBay');
      }

      // Filter out items with valid prices
      const validItems = items.filter(item => item.price > 0);
      
      if (validItems.length === 0) {
        throw new Error('No valid prices found');
      }

      // Calculate pricing statistics
      const prices = validItems.map(item => item.price);
      const avgPrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Calculate confidence based on data points and price consistency
      const priceVariance = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length);
      const confidence = Math.min(0.95, 0.5 + (validItems.length * 0.02) + (1 / (1 + priceVariance / avgPrice)) * 0.3);

      return {
        marketValue: avgPrice,
        pawnValue: Math.round(avgPrice * 0.3), // 30% of market value for pawn
        confidence: confidence,
        dataPoints: validItems.length,
        priceRange: {
          min: minPrice,
          max: maxPrice,
          avg: avgPrice
        },
        source: 'ebay-api',
        note: `eBay API pricing based on ${validItems.length} sold items`,
        recentSales: validItems.slice(0, 5) // Include top 5 recent sales
      };
    } catch (error) {
      console.error('❌ eBay API pricing estimate failed:', error.message);
      throw new Error(`eBay API pricing estimate failed: ${error.message}`);
    }
  }

  /**
   * Get eBay items with images for AI learning and visual recognition
   */
  async getItemsWithImagesForAILearning(query, limit = 15) {
    console.log(`📸 Getting eBay items with images for AI learning: ${query}`);
    
    try {
      const items = await this.searchSoldItems(query, limit);
      
      if (!items || items.length === 0) {
        return {
          success: false,
          message: 'No items found',
          aiLearningData: null
        };
      }

      // Filter items that have images
      const itemsWithImages = items.filter(item => item.imageUrl);
      
      if (itemsWithImages.length === 0) {
        return {
          success: false,
          message: 'No items with images found',
          aiLearningData: null
        };
      }

      const aiLearningData = {
        query,
        timestamp: new Date().toISOString(),
        totalItems: itemsWithImages.length,
        visualTrainingData: [],
        brandPatterns: [],
        modelPatterns: [],
        conditionPatterns: []
      };

      // Process each item for AI learning
      itemsWithImages.forEach(item => {
        // Extract visual training data
        aiLearningData.visualTrainingData.push({
          title: item.title,
          imageUrl: item.imageUrl,
          price: item.price,
          condition: item.condition,
          soldDate: item.soldDate,
          source: 'ebay-api'
        });

        // Extract brand and model patterns from title
        const { brand, model } = this.extractBrandAndModelFromTitle(item.title);
        if (brand) {
          aiLearningData.brandPatterns.push({
            brand,
            title: item.title,
            price: item.price,
            imageUrl: item.imageUrl
          });
        }
        if (model) {
          aiLearningData.modelPatterns.push({
            model,
            brand,
            title: item.title,
            price: item.price,
            imageUrl: item.imageUrl
          });
        }

        // Extract condition patterns
        if (item.condition) {
          aiLearningData.conditionPatterns.push({
            condition: item.condition,
            title: item.title,
            price: item.price,
            imageUrl: item.imageUrl
          });
        }
      });

      return {
        success: true,
        aiLearningData,
        items: itemsWithImages.slice(0, 10) // Return top 10 for reference
      };

    } catch (error) {
      console.error('❌ eBay AI learning data extraction failed:', error.message);
      return {
        success: false,
        message: error.message,
        aiLearningData: null
      };
    }
  }

  /**
   * Extract brand and model from eBay item title for AI learning
   */
  extractBrandAndModelFromTitle(title) {
    const lowerTitle = title.toLowerCase();
    let brand = null;
    let model = null;

    // Common brand patterns
    const brandPatterns = [
      { patterns: ['iphone', 'ipad', 'macbook', 'imac', 'mac', 'apple watch'], brand: 'Apple' },
      { patterns: ['galaxy', 'samsung'], brand: 'Samsung' },
      { patterns: ['pixel', 'google'], brand: 'Google' },
      { patterns: ['oneplus'], brand: 'OnePlus' },
      { patterns: ['mate', 'huawei', 'p series'], brand: 'Huawei' },
      { patterns: ['xiaomi', 'mi'], brand: 'Xiaomi' },
      { patterns: ['dell', 'dell xps', 'dell inspiron'], brand: 'Dell' },
      { patterns: ['hp', 'hp pavilion', 'hp spectre'], brand: 'HP' },
      { patterns: ['lenovo', 'lenovo thinkpad', 'lenovo yoga'], brand: 'Lenovo' },
      { patterns: ['asus', 'asus zenbook', 'asus rog'], brand: 'ASUS' },
      { patterns: ['acer', 'acer aspire', 'acer predator'], brand: 'Acer' },
      { patterns: ['msi', 'msi gaming'], brand: 'MSI' },
      { patterns: ['sony', 'sony vaio'], brand: 'Sony' },
      { patterns: ['lg', 'lg gram'], brand: 'LG' },
      { patterns: ['microsoft', 'microsoft surface'], brand: 'Microsoft' },
      { patterns: ['canon', 'canon eos'], brand: 'Canon' },
      { patterns: ['nikon', 'nikon d'], brand: 'Nikon' },
      { patterns: ['gopro', 'gopro hero'], brand: 'GoPro' },
      { patterns: ['dji', 'dji mavic'], brand: 'DJI' },
      { patterns: ['garmin', 'garmin forerunner'], brand: 'Garmin' },
      { patterns: ['fitbit', 'fitbit versa'], brand: 'Fitbit' },
      { patterns: ['rolex', 'rolex submariner'], brand: 'Rolex' },
      { patterns: ['omega', 'omega seamaster'], brand: 'Omega' }
    ];

    // Find brand
    for (const brandPattern of brandPatterns) {
      for (const pattern of brandPattern.patterns) {
        if (lowerTitle.includes(pattern)) {
          brand = brandPattern.brand;
          break;
        }
      }
      if (brand) break;
    }

    // Extract model (simplified - can be enhanced)
    const words = title.split(' ');
    for (const word of words) {
      if (word.length > 2 && /^[A-Za-z0-9]+$/.test(word)) {
        const commonWords = ['new', 'used', 'refurbished', 'original', 'genuine', 'authentic', 'like', 'condition', 'excellent', 'good', 'fair', 'poor'];
        if (!commonWords.includes(word.toLowerCase())) {
          model = word;
          break;
        }
      }
    }

    return { brand, model };
  }

  /**
   * Download images for AI training dataset
   */
  async downloadImagesForTraining(query, limit = 20) {
    try {
      console.log(`📸 Downloading eBay images for AI training: ${query}`);
      
      const result = await this.getItemsWithImagesForAILearning(query, limit);
      
      if (!result.success) {
        return {
          success: false,
          message: result.message,
          trainingImages: []
        };
      }

      const trainingImages = result.aiLearningData.visualTrainingData.map(item => ({
        title: item.title,
        imageUrl: item.imageUrl,
        price: item.price,
        condition: item.condition,
        metadata: {
          query,
          timestamp: new Date().toISOString(),
          source: 'ebay-api'
        }
      }));

      return {
        success: true,
        trainingImages,
        totalImages: trainingImages.length,
        query
      };

    } catch (error) {
      console.error('Image download error:', error);
      return {
        success: false,
        message: error.message,
        trainingImages: []
      };
    }
  }

  async healthCheck() {
    try {
      // Test with a simple search
      const testResponse = await this.searchSoldItems('test', 1);
      const rateLimitStatus = this.getRateLimitStatus();
      
      return {
        status: 'healthy',
        appId: !!this.appId,
        apiResponse: testResponse.length >= 0,
        rateLimit: rateLimitStatus,
        note: 'eBay Finding API working with official credentials',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const rateLimitStatus = this.getRateLimitStatus();
      
      return {
        status: 'unhealthy',
        error: error.message,
        appId: !!this.appId,
        rateLimit: rateLimitStatus,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new eBayAPIService();
