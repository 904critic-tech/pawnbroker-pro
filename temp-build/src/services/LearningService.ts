import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

interface LearningData {
  brandPatterns: { [brand: string]: { count: number; examples: string[]; confidence: number } };
  modelPatterns: { [model: string]: { count: number; examples: string[]; confidence: number; brand?: string } };
  searchHistory: Array<{
    query: string;
    brands: string[];
    models: string[];
    timestamp: number;
  }>;
  titlePatterns: { [pattern: string]: { count: number; brand: string; model: string } };
  // PriceCharting AI Learning Data
  priceChartingInsights: Array<{
    query: string;
    category: string;
    seriesNames: string[];
    conditionTerms: string[];
    searchOptimizations: Array<{
      type: string;
      suggestion: string;
      example?: string;
      category?: string;
    }>;
    commonPatterns: Array<{
      originalQuery: string;
      suggestedTerms: string[];
      fullTitle: string;
    }>;
    timestamp: string;
  }>;
  
  // Visual AI Learning Data (eBay + PriceCharting images)
  visualLearningData: Array<{
    query: string;
    source: 'ebay' | 'pricecharting';
    images: Array<{
      title: string;
      imageUrl: string;
      price?: number;
      condition?: string;
      brand?: string;
      model?: string;
      set?: string;
      rarity?: string;
      metadata: {
        timestamp: string;
        source: string;
      };
    }>;
    brandPatterns: Array<{
      brand: string;
      title: string;
      imageUrl: string;
      price?: number;
    }>;
    modelPatterns: Array<{
      model: string;
      brand?: string;
      title: string;
      imageUrl: string;
      price?: number;
    }>;
    timestamp: string;
  }>;
}

interface GlobalLearningData {
  brandPatterns: { [brand: string]: { count: number; examples: string[]; confidence: number } };
  modelPatterns: { [model: string]: { count: number; examples: string[]; confidence: number; brand?: string } };
  titlePatterns: { [pattern: string]: { count: number; brand: string; model: string } };
  stats: {
    totalBrands: number;
    totalModels: number;
    totalSearches: number;
    totalPatterns: number;
    totalUsers: number;
    lastUpdated: string;
  };
  lastUpdated: string;
}

class LearningService {
  private static instance: LearningService;
  private learningData: LearningData = {
    brandPatterns: {},
    modelPatterns: {},
    searchHistory: [],
    titlePatterns: {},
    priceChartingInsights: [],
    visualLearningData: [],
  };
  private globalLearningData: GlobalLearningData | null = null;
  private lastGlobalSync: number = 0;
  private lastLocalSync: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes
  private globalSyncInterval: number = 30 * 60 * 1000; // 30 minutes
  private syncInProgress: boolean = false;

  private constructor() {
    this.loadLearningData();
    this.loadGlobalLearningData();
    this.startPeriodicSync();
  }

  static getInstance(): LearningService {
    if (!LearningService.instance) {
      LearningService.instance = new LearningService();
    }
    return LearningService.instance;
  }

  private async loadLearningData() {
    try {
      const data = await AsyncStorage.getItem('learningData');
      if (data) {
        this.learningData = JSON.parse(data);
      }
    } catch (error) {
      // Silent error handling for production
    }
  }

  private async saveLearningData() {
    try {
      await AsyncStorage.setItem('learningData', JSON.stringify(this.learningData));
    } catch (error) {
      // Silent error handling for production
    }
  }

  private async loadGlobalLearningData() {
    try {
      const data = await AsyncStorage.getItem('globalLearningData');
      if (data) {
        this.globalLearningData = JSON.parse(data);
        this.lastGlobalSync = Date.now();
      }
    } catch (error) {
      // Silent error handling for production
    }
  }

  private async saveGlobalLearningData() {
    try {
      if (this.globalLearningData) {
        await AsyncStorage.setItem('globalLearningData', JSON.stringify(this.globalLearningData));
      }
    } catch (error) {
      // Silent error handling for production
    }
  }

  // Start periodic sync with global learning system (completely silent)
  private startPeriodicSync() {
    // Sync local data to global every 5 minutes (silent)
    setInterval(() => {
      if (!this.syncInProgress) {
        this.syncToGlobal();
      }
    }, this.syncInterval);

    // Sync global data to local every 30 minutes (silent)
    setInterval(() => {
      if (!this.syncInProgress) {
        this.syncFromGlobal();
      }
    }, this.globalSyncInterval);
  }

  // Sync local learning data to global database (silent)
  async syncToGlobal() {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      const userId = await this.getUserId();
      if (!userId) {
        return;
      }

      // Only sync if we have new data since last sync
      if (this.lastLocalSync >= this.getLastLearningUpdate()) {
        return;
      }

      const response = await fetch(`${apiService['API_BASE_URL']}/global-learning/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiService.isAuthenticated() ? { 'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}` } : {})
        },
        body: JSON.stringify({
          userId,
          learningData: this.learningData
        })
      });

      const data = await response.json();
      if (data.success) {
        this.lastLocalSync = Date.now();
      }
    } catch (error) {
      // Silent error handling for production
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync global learning data to local (silent)
  async syncFromGlobal() {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      const response = await fetch(`${apiService['API_BASE_URL']}/global-learning/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiService.isAuthenticated() ? { 'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}` } : {})
        }
      });
      
      const data = await response.json();
      if (data.success) {
        this.globalLearningData = data.data;
        this.lastGlobalSync = Date.now();
        await this.saveGlobalLearningData();
      }
    } catch (error) {
      // Silent error handling for production
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get user ID for global sync
  private async getUserId(): Promise<string | null> {
    try {
      const userId = await AsyncStorage.getItem('userId');
      return userId;
    } catch (error) {
      return null;
    }
  }

  // Get timestamp of last learning update
  private getLastLearningUpdate(): number {
    let lastUpdate = 0;
    
    // Check brand patterns
    Object.values(this.learningData.brandPatterns).forEach(brand => {
      if (brand.count > lastUpdate) lastUpdate = brand.count;
    });
    
    // Check model patterns
    Object.values(this.learningData.modelPatterns).forEach(model => {
      if (model.count > lastUpdate) lastUpdate = model.count;
    });
    
    // Check search history
    if (this.learningData.searchHistory.length > 0) {
      const lastSearch = Math.max(...this.learningData.searchHistory.map(s => s.timestamp));
      if (lastSearch > lastUpdate) lastUpdate = lastSearch;
    }
    
    return lastUpdate;
  }

  // Learn from search results - this is the core learning function
  async learnFromSearch(query: string, items: any[]) {
    const brands: string[] = [];
    const models: string[] = [];

    items.forEach(item => {
      // Extract brand and model from each item
      const { brand, model } = this.extractBrandAndModelFromTitle(item.title);
      
      if (brand) {
        brands.push(brand);
        this.learnBrand(brand, item.title);
      }
      
      if (model) {
        models.push(model);
        this.learnModel(model, brand, item.title);
      }

      // Learn title patterns for future recognition
      this.learnTitlePattern(item.title, brand, model);
    });

    // Store search history
    this.learningData.searchHistory.push({
      query,
      brands: [...new Set(brands)],
      models: [...new Set(models)],
      timestamp: Date.now(),
    });

    // Keep only last 200 searches for better learning
    if (this.learningData.searchHistory.length > 200) {
      this.learningData.searchHistory = this.learningData.searchHistory.slice(-200);
    }

    await this.saveLearningData();
  }

  /**
   * Learn from visual data (eBay + PriceCharting images) for AI training
   * This should be called for EVERY search to build our visual recognition dataset
   */
  async learnFromVisualData(query: string, source: 'ebay' | 'pricecharting', visualData: any) {
    console.log(`📸 LearningService: Learning from ${source} visual data for query: ${query}`);
    
    try {
      const visualLearningEntry = {
        query,
        source,
        images: [],
        brandPatterns: [],
        modelPatterns: [],
        timestamp: new Date().toISOString()
      };

      // Process eBay visual data
      if (source === 'ebay' && visualData.aiLearningData) {
        const { visualTrainingData, brandPatterns, modelPatterns } = visualData.aiLearningData;
        
        // Add images for visual recognition training
        visualTrainingData.forEach((item: any) => {
          visualLearningEntry.images.push({
            title: item.title,
            imageUrl: item.imageUrl,
            price: item.price,
            condition: item.condition,
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'ebay-api'
            }
          });
        });

        // Add brand patterns with images
        brandPatterns.forEach((pattern: any) => {
          visualLearningEntry.brandPatterns.push({
            brand: pattern.brand,
            title: pattern.title,
            imageUrl: pattern.imageUrl,
            price: pattern.price
          });
        });

        // Add model patterns with images
        modelPatterns.forEach((pattern: any) => {
          visualLearningEntry.modelPatterns.push({
            model: pattern.model,
            brand: pattern.brand,
            title: pattern.title,
            imageUrl: pattern.imageUrl,
            price: pattern.price
          });
        });
      }

      // Process PriceCharting visual data
      if (source === 'pricecharting' && visualData.visualLearningData) {
        const { cardImages, setSymbols, visualPatterns } = visualData.visualLearningData;
        
        // Add card images for visual recognition training
        cardImages.forEach((card: any) => {
          card.imageUrls.forEach((imageUrl: string) => {
            visualLearningEntry.images.push({
              title: card.title,
              imageUrl: imageUrl,
              set: card.set,
              cardNumber: card.cardNumber,
              rarity: card.rarity,
              priceData: card.priceData,
              metadata: {
                timestamp: new Date().toISOString(),
                source: 'pricecharting'
              }
            });
          });
        });

        // Add set symbols for set recognition
        setSymbols.forEach((symbol: any) => {
          visualLearningEntry.images.push({
            title: `${symbol.set} Set Symbol`,
            imageUrl: symbol.symbolUrl,
            set: symbol.set,
            year: symbol.year,
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'pricecharting-set-symbol'
            }
          });
        });
      }

      // Add to visual learning data
      this.learningData.visualLearningData.push(visualLearningEntry);

      // Keep only last 100 visual learning entries to avoid memory bloat
      if (this.learningData.visualLearningData.length > 100) {
        this.learningData.visualLearningData = this.learningData.visualLearningData.slice(-100);
      }

      await this.saveLearningData();
      
      console.log(`✅ LearningService: Successfully learned from ${source} visual data. Total visual entries: ${this.learningData.visualLearningData.length}`);
      
      return {
        success: true,
        visualEntriesAdded: visualLearningEntry.images.length,
        totalVisualEntries: this.learningData.visualLearningData.length
      };

    } catch (error) {
      console.error('❌ LearningService: Failed to learn from visual data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get visual training data for AI model training
   */
  getVisualTrainingData() {
    const allImages: any[] = [];
    
    this.learningData.visualLearningData.forEach(entry => {
      entry.images.forEach(image => {
        allImages.push({
          ...image,
          query: entry.query,
          source: entry.source,
          timestamp: entry.timestamp
        });
      });
    });

    return {
      totalImages: allImages.length,
      images: allImages,
      sources: {
        ebay: allImages.filter(img => img.metadata?.source === 'ebay-api').length,
        pricecharting: allImages.filter(img => img.metadata?.source === 'pricecharting').length,
        setSymbols: allImages.filter(img => img.metadata?.source === 'pricecharting-set-symbol').length
      }
    };
  }

  /**
   * Get brand patterns with images for visual recognition training
   */
  getBrandPatternsWithImages() {
    const brandPatterns: any[] = [];
    
    this.learningData.visualLearningData.forEach(entry => {
      entry.brandPatterns.forEach(pattern => {
        brandPatterns.push({
          ...pattern,
          query: entry.query,
          source: entry.source,
          timestamp: entry.timestamp
        });
      });
    });

    return brandPatterns;
  }

  /**
   * Get model patterns with images for visual recognition training
   */
  getModelPatternsWithImages() {
    const modelPatterns: any[] = [];
    
    this.learningData.visualLearningData.forEach(entry => {
      entry.modelPatterns.forEach(pattern => {
        modelPatterns.push({
          ...pattern,
          query: entry.query,
          source: entry.source,
          timestamp: entry.timestamp
        });
      });
    });

    return modelPatterns;
  }

  // Learn a new brand
  private learnBrand(brand: string, exampleTitle: string) {
    if (!this.learningData.brandPatterns[brand]) {
      this.learningData.brandPatterns[brand] = {
        count: 0,
        examples: [],
        confidence: 0,
      };
    }

    const brandData = this.learningData.brandPatterns[brand];
    brandData.count++;
    brandData.examples.push(exampleTitle);
    
    // Keep only last 10 examples to avoid memory bloat
    if (brandData.examples.length > 10) {
      brandData.examples = brandData.examples.slice(-10);
    }

    // Increase confidence based on frequency
    brandData.confidence = Math.min(brandData.count / 5, 1.0);
  }

  // Learn a new model
  private learnModel(model: string, brand: string, exampleTitle: string) {
    if (!this.learningData.modelPatterns[model]) {
      this.learningData.modelPatterns[model] = {
        count: 0,
        examples: [],
        confidence: 0,
        brand: brand,
      };
    }

    const modelData = this.learningData.modelPatterns[model];
    modelData.count++;
    modelData.examples.push(exampleTitle);
    modelData.brand = brand; // Update brand association
    
    // Keep only last 10 examples
    if (modelData.examples.length > 10) {
      modelData.examples = modelData.examples.slice(-10);
    }

    // Increase confidence based on frequency
    modelData.confidence = Math.min(modelData.count / 3, 1.0);
  }

  // Learn title patterns for better future recognition
  private learnTitlePattern(title: string, brand: string, model: string) {
    // Create a simplified pattern from the title
    const pattern = this.createTitlePattern(title);
    
    if (!this.learningData.titlePatterns[pattern]) {
      this.learningData.titlePatterns[pattern] = {
        count: 0,
        brand: brand,
        model: model,
      };
    }

    this.learningData.titlePatterns[pattern].count++;
  }

  // Create a simplified pattern from title for learning
  private createTitlePattern(title: string): string {
    // Convert title to a pattern by keeping important words and removing common words
    const commonWords = ['new', 'used', 'refurbished', 'original', 'genuine', 'authentic', 'like', 'condition', 'excellent', 'good', 'fair', 'poor'];
    const words = title.toLowerCase().split(/\s+/).filter(word => 
      word.length > 2 && !commonWords.includes(word) && /^[a-z0-9]+$/.test(word)
    );
    return words.slice(0, 5).join(' '); // Keep first 5 meaningful words
  }

  // Extract brand and model from title using learned patterns (enhanced with global data)
  extractBrandAndModelFromTitle(title: string): { brand: string | null; model: string | null } {
    console.log('🔍 LearningService: Starting extraction for title:', title);
    const lowerTitle = title.toLowerCase();
    let brand: string | null = null;
    let model: string | null = null;

    // First, try to match against learned title patterns (local + global)
    const pattern = this.createTitlePattern(title);
    console.log('🔍 LearningService: Created pattern:', pattern);
    const localPattern = this.learningData.titlePatterns[pattern];
    const globalPattern = this.globalLearningData?.titlePatterns[pattern];
    
    console.log('🔍 LearningService: Local pattern found:', localPattern);
    console.log('🔍 LearningService: Global pattern found:', globalPattern);
    
    if (localPattern && localPattern.count > 1) {
      console.log('🔍 LearningService: Using local pattern - brand:', localPattern.brand, 'model:', localPattern.model);
      return {
        brand: localPattern.brand,
        model: localPattern.model,
      };
    } else if (globalPattern && globalPattern.count > 2) {
      console.log('🔍 LearningService: Using global pattern - brand:', globalPattern.brand, 'model:', globalPattern.model);
      return {
        brand: globalPattern.brand,
        model: globalPattern.model,
      };
    }

    // Try to find brand using learned patterns (local + global, sorted by confidence)
    const allBrands = new Map<string, { confidence: number; source: 'local' | 'global' }>();
    
    // Add local brands
    Object.entries(this.learningData.brandPatterns).forEach(([brandName, brandData]) => {
      allBrands.set(brandName, { confidence: brandData.confidence, source: 'local' });
    });
    
    // Add global brands (with higher weight for global data)
    if (this.globalLearningData) {
      Object.entries(this.globalLearningData.brandPatterns).forEach(([brandName, brandData]) => {
        const existing = allBrands.get(brandName);
        if (!existing || brandData.confidence > existing.confidence) {
          allBrands.set(brandName, { confidence: brandData.confidence * 1.2, source: 'global' });
        }
      });
    }

    // Sort by confidence and check for matches
    const sortedBrands = Array.from(allBrands.entries())
      .sort(([, a], [, b]) => b.confidence - a.confidence);

    for (const [brandName, brandInfo] of sortedBrands) {
      if (lowerTitle.includes(brandName.toLowerCase())) {
        brand = brandName;
        break;
      }
    }

    // Try to find model using learned patterns (local + global, sorted by confidence)
    const allModels = new Map<string, { confidence: number; source: 'local' | 'global'; brand?: string }>();
    
    // Add local models
    Object.entries(this.learningData.modelPatterns).forEach(([modelName, modelData]) => {
      allModels.set(modelName, { confidence: modelData.confidence, source: 'local', brand: modelData.brand });
    });
    
    // Add global models (with higher weight for global data)
    if (this.globalLearningData) {
      Object.entries(this.globalLearningData.modelPatterns).forEach(([modelName, modelData]) => {
        const existing = allModels.get(modelName);
        if (!existing || modelData.confidence > existing.confidence) {
          allModels.set(modelName, { confidence: modelData.confidence * 1.2, source: 'global', brand: modelData.brand });
        }
      });
    }

    // Sort by confidence and check for matches
    const sortedModels = Array.from(allModels.entries())
      .sort(([, a], [, b]) => b.confidence - a.confidence);

    for (const [modelName, modelInfo] of sortedModels) {
      if (lowerTitle.includes(modelName.toLowerCase())) {
        model = modelName;
        break;
      }
    }

    // If we found a brand but no model, try to extract model from title
    if (brand && !model) {
      model = this.extractModelFromTitleWithoutBrand(title, brand);
    }

    // If we found a model but no brand, try to extract brand from title
    if (model && !brand) {
      // Try to extract brand from title
      brand = this.extractBrandFromTitleWithoutModel(title, model);
      // If still no brand, try to map model to brand using learned modelPatterns
      if (!brand) {
        // Search local and global modelPatterns for a matching model
        let foundBrand = null;
        if (this.learningData.modelPatterns[model]) {
          foundBrand = this.learningData.modelPatterns[model].brand;
        } else if (this.globalLearningData && this.globalLearningData.modelPatterns[model]) {
          foundBrand = this.globalLearningData.modelPatterns[model].brand;
        }
        if (foundBrand) {
          brand = foundBrand;
        }
      }
    }

    // If still no brand, try to extract any capitalized word as potential brand
    if (!brand) {
      brand = this.extractPotentialBrandFromTitle(title);
    }

    // If still no model, try to extract any meaningful word as potential model
    if (!model) {
      model = this.extractPotentialModelFromTitle(title);
    }

    // Special handling for Apple products - if we found Apple brand but no proper model
    if (brand === 'Apple' && !model) {
      console.log('🔍 LearningService: Apple product detected, extracting full model name');
      const appleModel = this.extractAppleModelFromTitle(title);
      if (appleModel) {
        model = appleModel;
        console.log('🔍 LearningService: Apple model extracted:', model);
      }
    }

    // Fallback: If model matches Apple product but brand is missing, set brand to Apple
    if (!brand && model) {
      const appleModelPatterns = [/^iPhone/i, /^iPad/i, /^MacBook/i, /^Apple Watch/i];
      if (appleModelPatterns.some(pat => pat.test(model))) {
        brand = 'Apple';
        console.log('🔍 LearningService: Brand set to Apple based on model:', model);
      }
    }

    // Enhanced brand recognition for common patterns - PRIORITY FIRST
    console.log('🔍 LearningService: Trying common brand recognition for:', title);
    const commonBrand = this.recognizeCommonBrands(title);
    console.log('🔍 LearningService: Common brand recognition result:', commonBrand);
    
    if (commonBrand) {
      brand = commonBrand;
    } else if (!brand) {
      console.log('🔍 LearningService: No common brand found, using fallback methods');
    }

    console.log('🔍 LearningService: Final result - brand:', brand, 'model:', model);
    return { brand, model };
  }

  // Enhanced brand recognition for common patterns
  private recognizeCommonBrands(title: string): string | null {
    console.log('🔍 LearningService: recognizeCommonBrands called with:', title);
    const lowerTitle = title.toLowerCase();
    console.log('🔍 LearningService: lowerTitle:', lowerTitle);
    
    // Common brand indicators (these are learned from real data patterns)
    const brandIndicators = [
      { patterns: ['iphone', 'ipad', 'macbook', 'imac', 'mac', 'apple watch'], brand: 'Apple' },
      { patterns: ['galaxy', 'samsung'], brand: 'Samsung' },
      { patterns: ['pixel', 'google'], brand: 'Google' },
      { patterns: ['oneplus'], brand: 'OnePlus' },
      { patterns: ['mate', 'huawei', 'p series'], brand: 'Huawei' },
      { patterns: ['xiaomi', 'mi'], brand: 'Xiaomi' },
      { patterns: ['oppo'], brand: 'Oppo' },
      { patterns: ['vivo', 'vivo v', 'vivo y'], brand: 'Vivo' },
      { patterns: ['realme', 'realme 5', 'realme 6'], brand: 'Realme' },
      { patterns: ['nokia', 'nokia 7', 'nokia 8'], brand: 'Nokia' },
      { patterns: ['motorola', 'moto g', 'moto e'], brand: 'Motorola' },
      { patterns: ['blackberry', 'blackberry key'], brand: 'HTC' },
      { patterns: ['alcatel', 'alcatel idol'], brand: 'Alcatel' },
      { patterns: ['zte', 'zte axon'], brand: 'ZTE' },
      { patterns: ['dell', 'dell xps', 'dell inspiron'], brand: 'Dell' },
      { patterns: ['hp', 'hp pavilion', 'hp spectre'], brand: 'HP' },
      { patterns: ['lenovo', 'lenovo thinkpad', 'lenovo yoga'], brand: 'Lenovo' },
      { patterns: ['asus', 'asus zenbook', 'asus rog'], brand: 'ASUS' },
      { patterns: ['acer', 'acer aspire', 'acer predator'], brand: 'Acer' },
      { patterns: ['msi', 'msi gaming'], brand: 'MSI' },
      { patterns: ['sony', 'sony vaio'], brand: 'Sony' },
      { patterns: ['lg', 'lg gram'], brand: 'LG' },
      { patterns: ['toshiba', 'toshiba satellite'], brand: 'Toshiba' },
      { patterns: ['fujitsu', 'fujitsu lifebook'], brand: 'Fujitsu' },
      { patterns: ['microsoft', 'microsoft surface'], brand: 'Microsoft' },
      { patterns: ['canon', 'canon eos'], brand: 'Canon' },
      { patterns: ['nikon', 'nikon d'], brand: 'Nikon' },
      { patterns: ['fujifilm', 'fujifilm x'], brand: 'Fujifilm' },
      { patterns: ['panasonic', 'panasonic lumix'], brand: 'Panasonic' },
      { patterns: ['olympus', 'olympus om'], brand: 'Olympus' },
      { patterns: ['gopro', 'gopro hero'], brand: 'GoPro' },
      { patterns: ['dji', 'dji mavic'], brand: 'DJI' },
      { patterns: ['garmin', 'garmin forerunner'], brand: 'Garmin' },
      { patterns: ['fitbit', 'fitbit versa'], brand: 'Fitbit' },
      { patterns: ['amazfit', 'amazfit bip'], brand: 'Amazfit' },
      { patterns: ['fossil', 'fossil gen'], brand: 'Fossil' },
      { patterns: ['casio', 'casio g-shock'], brand: 'Casio' },
      { patterns: ['seiko', 'seiko 5'], brand: 'Seiko' },
      { patterns: ['citizen', 'citizen eco-drive'], brand: 'Citizen' },
      { patterns: ['rolex', 'rolex submariner'], brand: 'Rolex' },
      { patterns: ['omega', 'omega seamaster'], brand: 'Omega' },
      { patterns: ['tag heuer', 'tag heuer carrera'], brand: 'Tag Heuer' },
      { patterns: ['breitling', 'breitling navitimer'], brand: 'Breitling' },
      { patterns: ['cartier', 'cartier tank'], brand: 'Cartier' },
      { patterns: ['tissot', 'tissot prc'], brand: 'Tissot' },
      { patterns: ['swatch', 'swatch classic'], brand: 'Swatch' },
      { patterns: ['timex', 'timex expedition'], brand: 'Timex' },
      { patterns: ['nixon', 'nixon mission'], brand: 'Nixon' },
    ];

    for (const indicator of brandIndicators) {
      for (const pattern of indicator.patterns) {
        console.log('🔍 LearningService: Checking pattern:', pattern, 'against:', lowerTitle);
        if (lowerTitle.includes(pattern)) {
          console.log('🔍 LearningService: MATCH FOUND! Pattern:', pattern, 'Brand:', indicator.brand);
          return indicator.brand;
        }
      }
    }

    console.log('🔍 LearningService: No brand match found');
    return null;
  }

  // Extract brand from title (for backward compatibility)
  extractBrandFromTitle(title: string): string | null {
    const result = this.extractBrandAndModelFromTitle(title);
    return result.brand;
  }

  // Extract model from title (for backward compatibility)
  extractModelFromTitle(title: string, brand?: string): string | null {
    const result = this.extractBrandAndModelFromTitle(title);
    return result.model;
  }

  // Extract model when we know the brand
  private extractModelFromTitleWithoutBrand(title: string, brand: string): string | null {
    const lowerTitle = title.toLowerCase();
    const lowerBrand = brand.toLowerCase();
    
    // Remove brand name from title
    let modelTitle = lowerTitle.replace(lowerBrand, '').trim();
    
    // Look for learned models that appear in the remaining text (local + global)
    const allModels = new Map<string, { confidence: number; source: 'local' | 'global' }>();
    
    // Add local models
    Object.entries(this.learningData.modelPatterns).forEach(([modelName, modelData]) => {
      allModels.set(modelName, { confidence: modelData.confidence, source: 'local' });
    });
    
    // Add global models
    if (this.globalLearningData) {
      Object.entries(this.globalLearningData.modelPatterns).forEach(([modelName, modelData]) => {
        const existing = allModels.get(modelName);
        if (!existing || modelData.confidence > existing.confidence) {
          allModels.set(modelName, { confidence: modelData.confidence * 1.2, source: 'global' });
        }
      });
    }

    // Sort by confidence and check for matches
    const sortedModels = Array.from(allModels.entries())
      .sort(([, a], [, b]) => b.confidence - a.confidence);

    for (const [modelName, modelInfo] of sortedModels) {
      if (modelTitle.includes(modelName.toLowerCase())) {
        return modelName;
      }
    }

    return null;
  }

  // Extract brand when we know the model
  private extractBrandFromTitleWithoutModel(title: string, model: string): string | null {
    const lowerTitle = title.toLowerCase();
    const lowerModel = model.toLowerCase();
    
    // Remove model name from title
    let brandTitle = lowerTitle.replace(lowerModel, '').trim();
    
    // Look for learned brands that appear in the remaining text (local + global)
    const allBrands = new Map<string, { confidence: number; source: 'local' | 'global' }>();
    
    // Add local brands
    Object.entries(this.learningData.brandPatterns).forEach(([brandName, brandData]) => {
      allBrands.set(brandName, { confidence: brandData.confidence, source: 'local' });
    });
    
    // Add global brands
    if (this.globalLearningData) {
      Object.entries(this.globalLearningData.brandPatterns).forEach(([brandName, brandData]) => {
        const existing = allBrands.get(brandName);
        if (!existing || brandData.confidence > existing.confidence) {
          allBrands.set(brandName, { confidence: brandData.confidence * 1.2, source: 'global' });
        }
      });
    }

    // Sort by confidence and check for matches
    const sortedBrands = Array.from(allBrands.entries())
      .sort(([, a], [, b]) => b.confidence - a.confidence);

    for (const [brandName, brandInfo] of sortedBrands) {
      if (brandTitle.includes(brandName.toLowerCase())) {
        return brandName;
      }
    }

    return null;
  }

  // Extract potential brand from title using capitalization patterns
  private extractPotentialBrandFromTitle(title: string): string | null {
    const words = title.split(/\s+/);
    
    // Look for capitalized words that might be brands
    for (const word of words) {
      if (word.length > 2 && /^[A-Z][a-z]+$/.test(word)) {
        // Check if this word appears frequently in our learned data (local + global)
        const allBrands = new Set([
          ...Object.keys(this.learningData.brandPatterns),
          ...(this.globalLearningData ? Object.keys(this.globalLearningData.brandPatterns) : [])
        ]);
        
        if (allBrands.has(word)) {
          return word;
        }
        
        // If it's a new potential brand, return it for learning
        return word;
      }
    }

    return null;
  }

  // Extract potential model from title
  private extractPotentialModelFromTitle(title: string): string | null {
    const words = title.split(/\s+/);
    
    // Look for words that might be model identifiers
    for (const word of words) {
      if (word.length > 2 && /^[A-Za-z0-9]+$/.test(word)) {
        // Skip common words
        const commonWords = ['new', 'used', 'refurbished', 'original', 'genuine', 'authentic', 'condition', 'excellent', 'good', 'fair', 'poor'];
        if (!commonWords.includes(word.toLowerCase())) {
          // Check if this word appears frequently in our learned data (local + global)
          const allModels = new Set([
            ...Object.keys(this.learningData.modelPatterns),
            ...(this.globalLearningData ? Object.keys(this.globalLearningData.modelPatterns) : [])
          ]);
          
          if (allModels.has(word)) {
            return word;
          }
          
          // If it's a new potential model, return it for learning
          return word;
        }
      }
    }

    // Enhanced model recognition for common patterns
    return this.recognizeCommonModels(title);
  }

  // Extract Apple model from title (special handling for Apple products)
  private extractAppleModelFromTitle(title: string): string | null {
    const lowerTitle = title.toLowerCase();
    
    // Apple product patterns
    const applePatterns = [
      { pattern: /iphone\s+(\d+)\s*(pro|max|mini|plus)?/i, extract: (match: RegExpMatchArray) => `iPhone ${match[1]}${match[2] ? ' ' + match[2] : ''}` },
      { pattern: /ipad\s+(pro|air|mini)\s*(\d+)?/i, extract: (match: RegExpMatchArray) => `iPad ${match[1]}${match[2] ? ' ' + match[2] : ''}` },
      { pattern: /macbook\s+(pro|air)\s*(\d+)?/i, extract: (match: RegExpMatchArray) => `MacBook ${match[1]}${match[2] ? ' ' + match[2] : ''}` },
      { pattern: /apple\s+watch\s*(series\s*\d+)?/i, extract: (match: RegExpMatchArray) => `Apple Watch${match[1] ? ' ' + match[1] : ''}` },
    ];

    for (const applePattern of applePatterns) {
      const match = title.match(applePattern.pattern);
      if (match) {
        return applePattern.extract(match);
      }
    }

    return null;
  }

  // Enhanced model recognition for common patterns
  private recognizeCommonModels(title: string): string | null {
    const lowerTitle = title.toLowerCase();
    
    // Common model patterns
    const modelPatterns = [
      // iPhone patterns
      { pattern: /iphone\s+(\d+)\s*(pro|max|mini|plus)?/i, extract: (match: RegExpMatchArray) => `iPhone ${match[1]}${match[2] ? ' ' + match[2] : ''}` },
      { pattern: /iphone\s+(se|xs|xr)/i, extract: (match: RegExpMatchArray) => `iPhone ${match[1].toUpperCase()}` },
      
      // Samsung patterns
      { pattern: /galaxy\s+(s\d+|note\d+|a\d+|tab\s*\w*)/i, extract: (match: RegExpMatchArray) => `Galaxy ${match[1]}` },
      
      // Google patterns
      { pattern: /pixel\s+(\d+)/i, extract: (match: RegExpMatchArray) => `Pixel ${match[1]}` },
      
      // OnePlus patterns
      { pattern: /oneplus\s+(\d+)/i, extract: (match: RegExpMatchArray) => `OnePlus ${match[1]}` },
      
      // Huawei patterns
      { pattern: /mate\s+(\d+)/i, extract: (match: RegExpMatchArray) => `Mate ${match[1]}` },
      { pattern: /p(\d+)/i, extract: (match: RegExpMatchArray) => `P${match[1]}` },
      
      // Laptop patterns
      { pattern: /macbook\s+(pro|air)/i, extract: (match: RegExpMatchArray) => `MacBook ${match[1]}` },
      { pattern: /latitude\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Latitude ${match[1]}` },
      { pattern: /inspiron\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Inspiron ${match[1]}` },
      { pattern: /precision\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Precision ${match[1]}` },
      { pattern: /xps\s+(\w+)/i, extract: (match: RegExpMatchArray) => `XPS ${match[1]}` },
      { pattern: /pavilion\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Pavilion ${match[1]}` },
      { pattern: /elitebook\s+(\w+)/i, extract: (match: RegExpMatchArray) => `EliteBook ${match[1]}` },
      { pattern: /probook\s+(\w+)/i, extract: (match: RegExpMatchArray) => `ProBook ${match[1]}` },
      { pattern: /spectre\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Spectre ${match[1]}` },
      { pattern: /thinkpad\s+(\w+)/i, extract: (match: RegExpMatchArray) => `ThinkPad ${match[1]}` },
      { pattern: /ideapad\s+(\w+)/i, extract: (match: RegExpMatchArray) => `IdeaPad ${match[1]}` },
      { pattern: /yoga\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Yoga ${match[1]}` },
      { pattern: /legion\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Legion ${match[1]}` },
      { pattern: /rog\s+(\w+)/i, extract: (match: RegExpMatchArray) => `ROG ${match[1]}` },
      { pattern: /zenbook\s+(\w+)/i, extract: (match: RegExpMatchArray) => `ZenBook ${match[1]}` },
      { pattern: /vivobook\s+(\w+)/i, extract: (match: RegExpMatchArray) => `VivoBook ${match[1]}` },
      { pattern: /tuf\s+(\w+)/i, extract: (match: RegExpMatchArray) => `TUF ${match[1]}` },
      { pattern: /aspire\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Aspire ${match[1]}` },
      { pattern: /predator\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Predator ${match[1]}` },
      { pattern: /swift\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Swift ${match[1]}` },
      { pattern: /spin\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Spin ${match[1]}` },
      
      // Tablet patterns
      { pattern: /ipad\s+(pro|air|mini)/i, extract: (match: RegExpMatchArray) => `iPad ${match[1]}` },
      { pattern: /surface\s+(pro|go|laptop)/i, extract: (match: RegExpMatchArray) => `Surface ${match[1]}` },
      
      // Watch patterns
      { pattern: /apple\s+watch/i, extract: () => 'Apple Watch' },
      { pattern: /galaxy\s+watch/i, extract: () => 'Galaxy Watch' },
      { pattern: /fitbit\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Fitbit ${match[1]}` },
      { pattern: /garmin\s+(\w+)/i, extract: (match: RegExpMatchArray) => `Garmin ${match[1]}` },
    ];

    for (const modelPattern of modelPatterns) {
      const match = title.match(modelPattern.pattern);
      if (match) {
        return modelPattern.extract(match);
      }
    }

    return null;
  }

  // Get all learned brands (for display purposes) - now includes global data
  getAllLearnedBrands(): Array<{ name: string; count: number; confidence: number; source: 'local' | 'global' }> {
    const allBrands = new Map<string, { count: number; confidence: number; source: 'local' | 'global' }>();
    
    // Add local brands
    Object.entries(this.learningData.brandPatterns).forEach(([name, data]) => {
      allBrands.set(name, { count: data.count, confidence: data.confidence, source: 'local' });
    });
    
    // Add global brands (with higher weight)
    if (this.globalLearningData) {
      Object.entries(this.globalLearningData.brandPatterns).forEach(([name, data]) => {
        const existing = allBrands.get(name);
        if (!existing || data.confidence > existing.confidence) {
          allBrands.set(name, { count: data.count, confidence: data.confidence, source: 'global' });
        }
      });
    }
    
    return Array.from(allBrands.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        confidence: data.confidence,
        source: data.source
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Get all learned models (for display purposes) - now includes global data
  getAllLearnedModels(): Array<{ name: string; count: number; confidence: number; brand?: string; source: 'local' | 'global' }> {
    const allModels = new Map<string, { count: number; confidence: number; brand?: string; source: 'local' | 'global' }>();
    
    // Add local models
    Object.entries(this.learningData.modelPatterns).forEach(([name, data]) => {
      allModels.set(name, { count: data.count, confidence: data.confidence, brand: data.brand, source: 'local' });
    });
    
    // Add global models (with higher weight)
    if (this.globalLearningData) {
      Object.entries(this.globalLearningData.modelPatterns).forEach(([name, data]) => {
        const existing = allModels.get(name);
        if (!existing || data.confidence > existing.confidence) {
          allModels.set(name, { count: data.count, confidence: data.confidence, brand: data.brand, source: 'global' });
        }
      });
    }
    
    return Array.from(allModels.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        confidence: data.confidence,
        brand: data.brand,
        source: data.source
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Get search suggestions based on learning (local + global)
  async getSearchSuggestions(query: string): Promise<string[]> {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Find similar past searches (local)
    const localSearches = this.learningData.searchHistory
      .filter(history => history.query.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    localSearches.forEach(search => {
      suggestions.push(search.query);
    });

    // Get global search suggestions (silent)
    try {
      const response = await fetch(`${apiService['API_BASE_URL']}/global-learning/suggestions?query=${encodeURIComponent(query)}&limit=5`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiService.isAuthenticated() ? { 'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        suggestions.push(...data.suggestions);
      }
    } catch (error) {
      // Silent error handling for production
    }

    return [...new Set(suggestions)];
  }

  // Get learning statistics (local + global)
  getLearningStats() {
    const localStats = {
      totalBrands: Object.keys(this.learningData.brandPatterns).length,
      totalModels: Object.keys(this.learningData.modelPatterns).length,
      totalSearches: this.learningData.searchHistory.length,
      totalPatterns: Object.keys(this.learningData.titlePatterns).length,
    };

    const globalStats = this.globalLearningData?.stats || {
      totalBrands: 0,
      totalModels: 0,
      totalSearches: 0,
      totalPatterns: 0,
      totalUsers: 0,
    };

    return {
      local: localStats,
      global: globalStats,
      lastGlobalSync: this.lastGlobalSync,
      lastLocalSync: this.lastLocalSync
    };
  }

  // Get trending items from global data (silent)
  async getTrendingItems(limit: number = 20) {
    try {
      const response = await fetch(`${apiService['API_BASE_URL']}/global-learning/trending?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiService.isAuthenticated() ? { 'Authorization': `Bearer ${await AsyncStorage.getItem('auth_token')}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } catch (error) {
      // Silent error handling for production
    }
    
    return { trendingBrands: [], trendingModels: [] };
  }

  // Clear learning data
  async clearLearningData() {
    this.learningData = {
      brandPatterns: {},
      modelPatterns: {},
      searchHistory: [],
      titlePatterns: {},
      priceChartingInsights: [],
      visualLearningData: [],
    };
    await this.saveLearningData();
  }

  // Clear all learning data (for debugging/testing)
  async clearAllLearningData(): Promise<void> {
    console.log('🧹 LearningService: Clearing all learning data');
    this.learningData = {
      brandPatterns: {},
      modelPatterns: {},
      searchHistory: [],
      titlePatterns: {},
      priceChartingInsights: [],
      visualLearningData: [],
    };
    this.globalLearningData = {
      brandPatterns: {},
      modelPatterns: {},
      titlePatterns: {},
      stats: {
        totalBrands: 0,
        totalModels: 0,
        totalSearches: 0,
        totalPatterns: 0,
        totalUsers: 0,
        lastUpdated: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };
    await this.saveLearningData();
    await this.saveGlobalLearningData();
    console.log('🧹 LearningService: All learning data cleared');
  }

  // Force sync to global (for admin/debug purposes only)
  async forceSyncToGlobal() {
    await this.syncToGlobal();
  }

  // Force sync from global (for admin/debug purposes only)
  async forceSyncFromGlobal() {
    await this.syncFromGlobal();
  }
}

export default LearningService;

