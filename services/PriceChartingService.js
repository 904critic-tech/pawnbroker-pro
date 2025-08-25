const axios = require('axios');
const cheerio = require('cheerio');

class PriceChartingService {
  constructor() {
    this.baseUrl = 'https://www.pricecharting.com';
    this.searchUrl = 'https://www.pricecharting.com/search';
  }

  /**
   * Search PriceCharting and extract AI learning data
   * This helps our AI learn exact series names and search optimization
   */
  async searchForAILearning(query) {
    try {
      console.log(`🔍 PriceCharting AI Learning Search: ${query}`);
      
      const searchResults = await this.searchPriceCharting(query);
      
      if (!searchResults || searchResults.length === 0) {
        return {
          success: false,
          message: 'No results found',
          aiLearningData: null
        };
      }

      // Extract AI learning insights
      const aiLearningData = this.extractAILearningInsights(searchResults, query);
      
      return {
        success: true,
        aiLearningData,
        searchResults: searchResults.slice(0, 5) // Return top 5 for reference
      };

    } catch (error) {
      console.error('PriceCharting AI Learning Error:', error);
      return {
        success: false,
        message: error.message,
        aiLearningData: null
      };
    }
  }

  /**
   * Search PriceCharting website
   */
  async searchPriceCharting(query) {
    try {
      const response = await axios.get(this.searchUrl, {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      // Extract search results
      $('.search-result').each((index, element) => {
        const title = $(element).find('.title a').text().trim();
        const url = $(element).find('.title a').attr('href');
        const category = $(element).find('.category').text().trim();
        const price = $(element).find('.price').text().trim();
        const imageUrl = $(element).find('img').attr('src');
        
        if (title && url) {
          results.push({
            title,
            url: this.baseUrl + url,
            category,
            price: this.parsePrice(price),
            imageUrl: imageUrl ? this.baseUrl + imageUrl : null
          });
        }
      });

      return results;

    } catch (error) {
      console.error('PriceCharting search error:', error);
      throw new Error('Failed to search PriceCharting');
    }
  }

  /**
   * Get detailed product page data including images and set information
   */
  async getProductDetails(productUrl) {
    try {
      const response = await axios.get(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const details = {
        title: $('.product-title').text().trim(),
        set: $('.set-name').text().trim(),
        cardNumber: $('.card-number').text().trim(),
        rarity: $('.rarity').text().trim(),
        condition: $('.condition').text().trim(),
        images: [],
        priceData: {},
        setInfo: {}
      };

      // Extract all product images
      $('.product-images img').each((index, element) => {
        const imgSrc = $(element).attr('src');
        if (imgSrc) {
          details.images.push(this.baseUrl + imgSrc);
        }
      });

      // Extract price data for different conditions
      $('.price-table tr').each((index, element) => {
        const condition = $(element).find('.condition').text().trim();
        const price = $(element).find('.price').text().trim();
        if (condition && price) {
          details.priceData[condition] = this.parsePrice(price);
        }
      });

      // Extract set information
      details.setInfo = {
        name: $('.set-info .name').text().trim(),
        year: $('.set-info .year').text().trim(),
        totalCards: $('.set-info .total-cards').text().trim(),
        setSymbol: $('.set-symbol img').attr('src')
      };

      return details;

    } catch (error) {
      console.error('PriceCharting product details error:', error);
      throw new Error('Failed to get product details');
    }
  }

  /**
   * Extract AI learning insights from search results
   */
  extractAILearningInsights(searchResults, originalQuery) {
    const insights = {
      originalQuery,
      detectedCategory: null,
      seriesNames: [],
      conditionTerms: [],
      searchOptimizations: [],
      commonPatterns: [],
      timestamp: new Date().toISOString()
    };

    // Analyze each result for patterns
    searchResults.forEach(result => {
      const title = result.title.toLowerCase();
      
      // Detect category
      if (!insights.detectedCategory) {
        if (title.includes('pokemon') || title.includes('card')) {
          insights.detectedCategory = 'pokemon_cards';
        } else if (title.includes('baseball') || title.includes('basketball') || title.includes('football')) {
          insights.detectedCategory = 'sports_cards';
        } else if (title.includes('game') || title.includes('nintendo') || title.includes('playstation')) {
          insights.detectedCategory = 'video_games';
        } else if (title.includes('comic') || title.includes('marvel') || title.includes('dc')) {
          insights.detectedCategory = 'comics';
        }
      }

      // Extract series names
      this.extractSeriesNames(title, insights);
      
      // Extract condition terms
      this.extractConditionTerms(title, insights);
      
      // Identify search optimization patterns
      this.identifySearchPatterns(title, originalQuery, insights);
    });

    // Generate search optimizations
    insights.searchOptimizations = this.generateSearchOptimizations(insights, originalQuery);

    return insights;
  }

  /**
   * Extract series names from titles
   */
  extractSeriesNames(title, insights) {
    // Pokemon series
    const pokemonSeries = [
      'base set', 'jungle', 'fossil', 'team rocket', 'gym heroes', 'gym challenge',
      'neo genesis', 'neo discovery', 'neo revelation', 'neo destiny',
      'legendary collection', 'expedition', 'aquapolis', 'skyridge',
      'ex ruby & sapphire', 'ex sandstorm', 'ex dragon', 'ex team magma vs team aqua',
      'ex hidden legends', 'ex firered & leafgreen', 'ex team rocket returns',
      'ex deoxys', 'ex emerald', 'ex unseen forces', 'ex delta species',
      'ex legend maker', 'ex holon phantoms', 'ex crystal guardians',
      'diamond & pearl', 'mysterious treasures', 'secret wonders',
      'great encounters', 'majestic dawn', 'legends awakened',
      'stormfront', 'platinum', 'rising rivals', 'supreme victors',
      'arceus', 'heartgold soulsilver', 'unleashed', 'undaunted',
      'triumphant', 'call of legends', 'black & white', 'emerging powers',
      'noble victories', 'next destinies', 'dark explorers', 'dragons exalted',
      'boundaries crossed', 'plasma storm', 'plasma freeze', 'plasma blast',
      'legendary treasures', 'xy', 'flashfire', 'furious fists',
      'phantom forces', 'primal clash', 'roaring skies', 'ancient origins',
      'breakthrough', 'breakpoint', 'fates collide', 'steam siege',
      'evolutions', 'sun & moon', 'guardians rising', 'burning shadows',
      'crimson invasion', 'ultra prism', 'forbidden light', 'celestial storm',
      'dragon majesty', 'lost thunder', 'team up', 'detective pikachu',
      'unbroken bonds', 'unified minds', 'hidden fates', 'cosmic eclipse',
      'sword & shield', 'rebel clash', 'darkness ablaze', 'champions path',
      'vivid voltage', 'shining fates', 'battle styles', 'chilling reign',
      'evolving skies', 'celebrations', 'fusion strike', 'brilliant stars',
      'astral radiance', 'go', 'lost origin', 'silver tempest',
      'scarlet & violet', 'paldea evolved', 'obsidian flames', '151'
    ];

    // Sports card series
    const sportsSeries = [
      'topps', 'topps chrome', 'topps finest', 'topps heritage',
      'panini', 'panini prizm', 'panini select', 'panini optic',
      'upper deck', 'fleer', 'donruss', 'score',
      'bowman', 'bowman chrome', 'bowman draft', 'bowman sterling',
      'leaf', 'skybox', 'stadium club', 'sp authentic',
      'spx', 'sp game used', 'exquisite', 'national treasures',
      'flawless', 'immaculate', 'limited', 'prestige',
      'absolute', 'gridiron gear', 'threads', 'certified',
      'elite', 'contenders', 'pinnacle', 'score',
      'playoff', 'contenders', 'sp authentic', 'exquisite'
    ];

    // Video game series
    const gameSeries = [
      'nintendo entertainment system', 'nes', 'super nintendo', 'snes',
      'nintendo 64', 'n64', 'gamecube', 'wii', 'wii u', 'nintendo switch',
      'playstation', 'ps1', 'ps2', 'ps3', 'ps4', 'ps5',
      'xbox', 'xbox 360', 'xbox one', 'xbox series x',
      'sega genesis', 'sega cd', 'sega 32x', 'sega saturn', 'sega dreamcast',
      'game boy', 'game boy color', 'game boy advance', 'nintendo ds', '3ds'
    ];

    // Check for series matches
    const allSeries = [...pokemonSeries, ...sportsSeries, ...gameSeries];
    
    allSeries.forEach(series => {
      if (title.includes(series) && !insights.seriesNames.includes(series)) {
        insights.seriesNames.push(series);
      }
    });
  }

  /**
   * Extract condition terms from titles
   */
  extractConditionTerms(title, insights) {
    const conditionTerms = [
      'psa 10', 'psa 9', 'psa 8', 'psa 7', 'psa 6', 'psa 5', 'psa 4', 'psa 3', 'psa 2', 'psa 1',
      'bgs 10', 'bgs 9.5', 'bgs 9', 'bgs 8.5', 'bgs 8', 'bgs 7.5', 'bgs 7', 'bgs 6.5', 'bgs 6',
      'cga 10', 'cga 9', 'cga 8', 'cga 7', 'cga 6', 'cga 5', 'cga 4', 'cga 3', 'cga 2', 'cga 1',
      'near mint', 'nm', 'mint', 'excellent', 'ex', 'very good', 'vg', 'good', 'fair', 'poor',
      'complete in box', 'cib', 'loose', 'sealed', 'new', 'used', 'like new',
      'first edition', '1st edition', 'unlimited', 'shadowless', 'holo', 'reverse holo',
      'refractor', 'parallel', 'insert', 'rookie', 'autograph', 'patch', 'numbered'
    ];

    conditionTerms.forEach(term => {
      if (title.includes(term) && !insights.conditionTerms.includes(term)) {
        insights.conditionTerms.push(term);
      }
    });
  }

  /**
   * Identify search optimization patterns
   */
  identifySearchPatterns(title, originalQuery, insights) {
    const originalWords = originalQuery.toLowerCase().split(' ');
    const titleWords = title.split(' ');
    
    // Find important words in title that weren't in original query
    const importantWords = titleWords.filter(word => 
      word.length > 2 && 
      !originalWords.includes(word) &&
      !['the', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'of', 'a', 'an'].includes(word)
    );

    if (importantWords.length > 0) {
      insights.commonPatterns.push({
        originalQuery,
        suggestedTerms: importantWords.slice(0, 5),
        fullTitle: title
      });
    }
  }

  /**
   * Generate search optimization suggestions
   */
  generateSearchOptimizations(insights, originalQuery) {
    const optimizations = [];

    // Add series-specific optimizations
    if (insights.seriesNames.length > 0) {
      optimizations.push({
        type: 'series_inclusion',
        suggestion: `Include series name: "${insights.seriesNames[0]}"`,
        example: `${originalQuery} ${insights.seriesNames[0]}`
      });
    }

    // Add condition-specific optimizations
    if (insights.conditionTerms.length > 0) {
      optimizations.push({
        type: 'condition_specific',
        suggestion: `Specify condition: "${insights.conditionTerms[0]}"`,
        example: `${originalQuery} ${insights.conditionTerms[0]}`
      });
    }

    // Add category-specific optimizations
    if (insights.detectedCategory) {
      const categorySuggestions = {
        pokemon_cards: 'Include card name and series (e.g., "Charizard Base Set")',
        sports_cards: 'Include player name and year (e.g., "Mike Trout 2023")',
        video_games: 'Include console and condition (e.g., "Super Mario Bros NES CIB")',
        comics: 'Include issue number and publisher (e.g., "Amazing Spider-Man #1 Marvel")'
      };
      
      optimizations.push({
        type: 'category_specific',
        suggestion: categorySuggestions[insights.detectedCategory],
        category: insights.detectedCategory
      });
    }

    return optimizations;
  }

  /**
   * Parse price from string
   */
  parsePrice(priceString) {
    if (!priceString) return null;
    
    const match = priceString.match(/\$?([\d,]+\.?\d*)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null;
  }

  /**
   * Get AI learning data for a specific query
   * This is the main method to be called by the AI learning system
   */
  async getAILearningData(query) {
    const result = await this.searchForAILearning(query);
    
    if (result.success) {
      return {
        query,
        category: result.aiLearningData.detectedCategory,
        seriesNames: result.aiLearningData.seriesNames,
        conditionTerms: result.aiLearningData.conditionTerms,
        searchOptimizations: result.aiLearningData.searchOptimizations,
        commonPatterns: result.aiLearningData.commonPatterns,
        timestamp: result.aiLearningData.timestamp
      };
    }
    
    return null;
  }

  /**
   * Get comprehensive AI learning data including images for visual recognition
   */
  async getVisualAILearningData(query) {
    try {
      console.log(`🔍 PriceCharting Visual AI Learning: ${query}`);
      
      const searchResults = await this.searchPriceCharting(query);
      
      if (!searchResults || searchResults.length === 0) {
        return {
          success: false,
          message: 'No results found',
          visualLearningData: null
        };
      }

      const visualLearningData = {
        query,
        timestamp: new Date().toISOString(),
        cardImages: [],
        setSymbols: [],
        visualPatterns: [],
        conditionExamples: [],
        rarityExamples: []
      };

      // Process each search result for visual learning
      for (const result of searchResults.slice(0, 10)) { // Limit to top 10 for performance
        try {
          const productDetails = await this.getProductDetails(result.url);
          
          // Add card images for visual recognition training
          if (productDetails.images && productDetails.images.length > 0) {
            visualLearningData.cardImages.push({
              title: productDetails.title,
              set: productDetails.set,
              cardNumber: productDetails.cardNumber,
              rarity: productDetails.rarity,
              imageUrls: productDetails.images,
              priceData: productDetails.priceData
            });
          }

          // Add set symbol for set recognition
          if (productDetails.setInfo.setSymbol) {
            visualLearningData.setSymbols.push({
              set: productDetails.setInfo.name,
              symbolUrl: productDetails.setInfo.setSymbol,
              year: productDetails.setInfo.year
            });
          }

          // Extract visual patterns for AI learning
          const visualPattern = this.extractVisualPattern(productDetails);
          if (visualPattern) {
            visualLearningData.visualPatterns.push(visualPattern);
          }

          // Add condition examples
          if (productDetails.condition) {
            visualLearningData.conditionExamples.push({
              condition: productDetails.condition,
              title: productDetails.title,
              price: productDetails.priceData[productDetails.condition] || 0
            });
          }

          // Add rarity examples
          if (productDetails.rarity) {
            visualLearningData.rarityExamples.push({
              rarity: productDetails.rarity,
              title: productDetails.title,
              set: productDetails.set
            });
          }

        } catch (detailError) {
          console.log(`⚠️ Failed to get details for ${result.title}:`, detailError.message);
          // Continue with other results
        }
      }

      return {
        success: true,
        visualLearningData,
        searchResults: searchResults.slice(0, 5)
      };

    } catch (error) {
      console.error('PriceCharting Visual AI Learning Error:', error);
      return {
        success: false,
        message: error.message,
        visualLearningData: null
      };
    }
  }

  /**
   * Extract visual patterns from product details for AI learning
   */
  extractVisualPattern(productDetails) {
    const pattern = {
      title: productDetails.title,
      set: productDetails.set,
      cardNumber: productDetails.cardNumber,
      rarity: productDetails.rarity,
      visualFeatures: [],
      textFeatures: []
    };

    // Extract visual features from title and set
    const titleWords = productDetails.title.toLowerCase().split(' ');
    const setWords = productDetails.set.toLowerCase().split(' ');

    // Common visual indicators
    const visualIndicators = [
      'holo', 'reverse', 'full', 'secret', 'ultra', 'rainbow', 'gold', 'silver',
      'shiny', 'sparkle', 'foil', 'metallic', 'prism', 'crystal', 'diamond',
      'vmax', 'vstar', 'gx', 'ex', 'mega', 'break', 'tag team', 'character'
    ];

    // Common text features
    const textFeatures = [
      '1st edition', 'unlimited', 'shadowless', 'error', 'misprint',
      'numbered', 'limited', 'promo', 'preview', 'championship'
    ];

    // Check for visual indicators
    visualIndicators.forEach(indicator => {
      if (titleWords.includes(indicator) || setWords.includes(indicator)) {
        pattern.visualFeatures.push(indicator);
      }
    });

    // Check for text features
    textFeatures.forEach(feature => {
      if (productDetails.title.toLowerCase().includes(feature)) {
        pattern.textFeatures.push(feature);
      }
    });

    return pattern;
  }

  /**
   * Download and process images for AI training dataset
   */
  async downloadImagesForTraining(query, limit = 20) {
    try {
      console.log(`📸 Downloading images for AI training: ${query}`);
      
      const searchResults = await this.searchPriceCharting(query);
      const trainingImages = [];

      for (const result of searchResults.slice(0, limit)) {
        try {
          const productDetails = await this.getProductDetails(result.url);
          
          if (productDetails.images && productDetails.images.length > 0) {
            trainingImages.push({
              title: productDetails.title,
              set: productDetails.set,
              cardNumber: productDetails.cardNumber,
              rarity: productDetails.rarity,
              condition: productDetails.condition,
              price: productDetails.priceData,
              imageUrl: productDetails.images[0], // Use first image
              metadata: {
                query,
                timestamp: new Date().toISOString(),
                source: 'pricecharting'
              }
            });
          }
        } catch (error) {
          console.log(`⚠️ Failed to process ${result.title}:`, error.message);
        }
      }

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
}

module.exports = new PriceChartingService();
