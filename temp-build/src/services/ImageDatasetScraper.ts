import { apiService } from './api';

interface ScrapedImage {
  id: string;
  url: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  condition: string;
  price: number;
  timestamp: number;
  imageData?: string; // Base64 encoded image
}

interface ScrapingStats {
  totalImages: number;
  totalListings: number;
  categories: { [category: string]: number };
  brands: { [brand: string]: number };
  lastUpdated: string;
}

class ImageDatasetScraper {
  private static instance: ImageDatasetScraper;
  private scrapedImages: ScrapedImage[] = [];
  private stats: ScrapingStats = {
    totalImages: 0,
    totalListings: 0,
    categories: {},
    brands: {},
    lastUpdated: new Date().toISOString(),
  };
  private isScraping: boolean = false;
  private scrapingQueue: string[] = [];
  private maxImagesPerCategory: number = 1000;
  private maxConcurrentRequests: number = 5;

  private constructor() {
    this.loadScrapedData();
  }

  static getInstance(): ImageDatasetScraper {
    if (!ImageDatasetScraper.instance) {
      ImageDatasetScraper.instance = new ImageDatasetScraper();
    }
    return ImageDatasetScraper.instance;
  }

  // Load previously scraped data from storage
  private async loadScrapedData() {
    try {
      // In a real implementation, this would load from AsyncStorage or local database
      // For now, we'll start fresh each time to ensure real data only
      console.log('🔍 ImageDatasetScraper: Starting fresh - no cached data to ensure real data only');
    } catch (error) {
      console.error('❌ Failed to load scraped data:', error);
    }
  }

  // Save scraped data to storage
  private async saveScrapedData() {
    try {
      // In a real implementation, this would save to AsyncStorage or local database
      console.log('💾 ImageDatasetScraper: Saving scraped data');
    } catch (error) {
      console.error('❌ Failed to save scraped data:', error);
    }
  }

  // Start scraping images for a specific category
  async scrapeCategory(category: string, searchTerms: string[]): Promise<ScrapedImage[]> {
    if (this.isScraping) {
      console.log('⚠️ ImageDatasetScraper: Already scraping, please wait...');
      return [];
    }

    this.isScraping = true;
    const results: ScrapedImage[] = [];

    try {
      console.log(`🔍 ImageDatasetScraper: Starting to scrape ${category} with ${searchTerms.length} search terms`);

      for (const searchTerm of searchTerms) {
        if (results.length >= this.maxImagesPerCategory) {
          console.log(`✅ ImageDatasetScraper: Reached max images for ${category}`);
          break;
        }

        const images = await this.scrapeSearchTerm(searchTerm, category);
        results.push(...images);
        
        // Rate limiting to be respectful to eBay
        await this.delay(2000);
      }

      // Update stats
      this.stats.categories[category] = (this.stats.categories[category] || 0) + results.length;
      this.stats.totalImages += results.length;
      this.stats.lastUpdated = new Date().toISOString();

      console.log(`✅ ImageDatasetScraper: Scraped ${results.length} images for ${category}`);
      return results;

    } catch (error) {
      console.error('❌ ImageDatasetScraper: Failed to scrape category:', error);
      return [];
    } finally {
      this.isScraping = false;
      await this.saveScrapedData();
    }
  }

  // Scrape images for a specific search term
  private async scrapeSearchTerm(searchTerm: string, category: string): Promise<ScrapedImage[]> {
    try {
      console.log(`🔍 ImageDatasetScraper: Scraping search term: ${searchTerm}`);

      // Use the existing marketplace service to get real eBay data
      const response = await fetch(`http://10.0.0.214:5001/api/marketplace/comprehensive/${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.ebay || !data.data.ebay.items) {
        console.log(`⚠️ ImageDatasetScraper: No eBay data found for ${searchTerm}`);
        return [];
      }

      const images: ScrapedImage[] = [];
      const items = data.data.ebay.items;

      for (const item of items) {
        if (!item.image || !item.title || !item.price) {
          continue;
        }

        // Extract brand and model from title using LearningService
        const { brand, model } = this.extractBrandAndModelFromTitle(item.title);

        const scrapedImage: ScrapedImage = {
          id: item.id || `img_${Date.now()}_${Math.random()}`,
          url: item.image,
          title: item.title,
          brand: brand || 'Unknown',
          model: model || 'Unknown',
          category: category,
          condition: this.extractCondition(item.title),
          price: parseFloat(item.price) || 0,
          timestamp: Date.now(),
        };

        images.push(scrapedImage);
      }

      console.log(`✅ ImageDatasetScraper: Found ${images.length} images for ${searchTerm}`);
      return images;

    } catch (error) {
      console.error(`❌ ImageDatasetScraper: Failed to scrape ${searchTerm}:`, error);
      return [];
    }
  }

  // Extract brand and model from title (simplified version)
  private extractBrandAndModelFromTitle(title: string): { brand: string | null; model: string | null } {
    const lowerTitle = title.toLowerCase();
    
    // Common brand patterns
    const brandPatterns = [
      { patterns: ['iphone', 'ipad', 'macbook', 'imac', 'mac', 'apple watch'], brand: 'Apple' },
      { patterns: ['galaxy', 'samsung'], brand: 'Samsung' },
      { patterns: ['pixel', 'google'], brand: 'Google' },
      { patterns: ['oneplus'], brand: 'OnePlus' },
      { patterns: ['dell', 'latitude', 'inspiron', 'precision', 'xps'], brand: 'Dell' },
      { patterns: ['hp', 'hewlett', 'pavilion', 'elitebook', 'probook', 'spectre'], brand: 'HP' },
      { patterns: ['lenovo', 'thinkpad', 'ideapad', 'yoga', 'legion'], brand: 'Lenovo' },
      { patterns: ['asus', 'rog', 'zenbook', 'vivobook', 'tuf'], brand: 'ASUS' },
      { patterns: ['acer', 'aspire', 'predator', 'swift', 'spin'], brand: 'Acer' },
    ];

    let brand: string | null = null;
    let model: string | null = null;

    // Find brand
    for (const pattern of brandPatterns) {
      for (const keyword of pattern.patterns) {
        if (lowerTitle.includes(keyword)) {
          brand = pattern.brand;
          break;
        }
      }
      if (brand) break;
    }

    // Extract model (simplified)
    const modelMatch = title.match(/(\d+)/);
    if (modelMatch) {
      model = modelMatch[1];
    }

    return { brand, model };
  }

  // Extract condition from title
  private extractCondition(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('new') || lowerTitle.includes('brand new')) return 'New';
    if (lowerTitle.includes('used') || lowerTitle.includes('pre-owned')) return 'Used';
    if (lowerTitle.includes('refurbished')) return 'Refurbished';
    if (lowerTitle.includes('broken') || lowerTitle.includes('damaged')) return 'Damaged';
    
    return 'Used'; // Default
  }

  // Download and store image data
  async downloadImage(imageUrl: string): Promise<string | null> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      return base64;

    } catch (error) {
      console.error('❌ Failed to download image:', error);
      return null;
    }
  }

  // Convert blob to base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get scraping statistics
  getStats(): ScrapingStats {
    return { ...this.stats };
  }

  // Get scraped images by category
  getImagesByCategory(category: string): ScrapedImage[] {
    return this.scrapedImages.filter(img => img.category === category);
  }

  // Get scraped images by brand
  getImagesByBrand(brand: string): ScrapedImage[] {
    return this.scrapedImages.filter(img => img.brand === brand);
  }

  // Clear all scraped data
  clearData() {
    this.scrapedImages = [];
    this.stats = {
      totalImages: 0,
      totalListings: 0,
      categories: {},
      brands: {},
      lastUpdated: new Date().toISOString(),
    };
    this.saveScrapedData();
  }

  // Rate limiting delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if scraping is in progress
  isCurrentlyScraping(): boolean {
    return this.isScraping;
  }

  // Get predefined search terms for common categories
  getSearchTermsForCategory(category: string): string[] {
    const searchTerms: { [category: string]: string[] } = {
      'Smartphones': [
        'iPhone 13', 'iPhone 14', 'iPhone 15',
        'Samsung Galaxy S23', 'Samsung Galaxy S24',
        'Google Pixel 7', 'Google Pixel 8',
        'OnePlus 11', 'OnePlus 12'
      ],
      'Laptops': [
        'MacBook Pro', 'MacBook Air',
        'Dell Latitude', 'Dell XPS',
        'HP Pavilion', 'HP EliteBook',
        'Lenovo ThinkPad', 'Lenovo IdeaPad',
        'ASUS ROG', 'ASUS ZenBook',
        'Acer Aspire', 'Acer Predator'
      ],
      'Tablets': [
        'iPad Pro', 'iPad Air', 'iPad Mini',
        'Samsung Galaxy Tab', 'Microsoft Surface',
        'Amazon Fire Tablet'
      ],
      'Watches': [
        'Apple Watch', 'Samsung Galaxy Watch',
        'Fitbit', 'Garmin', 'Fossil'
      ],
      'Cameras': [
        'Canon EOS', 'Nikon D', 'Sony Alpha',
        'GoPro Hero', 'DJI Drone'
      ]
    };

    return searchTerms[category] || [];
  }
}

export default ImageDatasetScraper;
