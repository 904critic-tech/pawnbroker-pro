const axios = require('axios');

class KeepaAPIService {
  constructor() {
    this.baseUrl = 'https://api.keepa.com';
    this.apiKey = process.env.KEEPA_API_KEY || 'demo'; // Use demo key for testing
    this.session = axios.create({
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PawnBroker-Pro/1.0'
      }
    });
  }

  /**
   * Search for products on Amazon
   * @param {string} query - Search query
   * @param {string} domain - Amazon domain (1=US, 2=UK, 3=DE, etc.)
   * @returns {Object} Search results
   */
  async searchProducts(query, domain = 1) {
    try {
      console.log(`🔍 Keepa: Searching for "${query}" on domain ${domain}`);
      
      const url = `${this.baseUrl}/search`;
      const params = {
        key: this.apiKey,
        domain: domain,
        term: query,
        excludeCategories: '0', // Don't exclude any categories
        productType: '0' // All product types
      };

      const response = await this.session.get(url, { params });
      
      if (response.status === 200 && response.data) {
        const products = response.data.products || [];
        console.log(`✅ Keepa: Found ${products.length} products for "${query}"`);
        
        return {
          success: true,
          data: products.map(product => ({
            asin: product.asin,
            title: product.title,
            image: product.image,
            category: product.categoryTree,
            rating: product.rating,
            reviewCount: product.reviewCount
          })),
          total: products.length
        };
      }
      
      return { success: false, error: 'No products found' };
      
    } catch (error) {
      console.error(`❌ Keepa search failed for "${query}":`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get product price history
   * @param {string} asin - Amazon ASIN
   * @param {string} domain - Amazon domain (1=US, 2=UK, 3=DE, etc.)
   * @returns {Object} Price history data
   */
  async getProductPriceHistory(asin, domain = 1) {
    try {
      console.log(`📊 Keepa: Getting price history for ASIN ${asin} on domain ${domain}`);
      
      const url = `${this.baseUrl}/product`;
      const params = {
        key: this.apiKey,
        domain: domain,
        asin: asin,
        history: 1, // Include price history
        rating: 1, // Include rating
        buybox: 1, // Include buybox data
        update: 1 // Update data if available
      };

      const response = await this.session.get(url, { params });
      
      if (response.status === 200 && response.data && response.data.products) {
        const product = response.data.products[0];
        const priceHistory = this.parsePriceHistory(product, domain);
        
        console.log(`✅ Keepa: Retrieved price history for ${asin}`);
        
        return {
          success: true,
          data: {
            asin: asin,
            title: product.title,
            image: product.image,
            category: product.categoryTree,
            rating: product.rating,
            reviewCount: product.reviewCount,
            currentPrice: priceHistory.currentPrice,
            lowestPrice: priceHistory.lowestPrice,
            highestPrice: priceHistory.highestPrice,
            averagePrice: priceHistory.averagePrice,
            priceHistory: priceHistory.history,
            lastUpdated: new Date().toISOString(),
            source: 'keepa'
          }
        };
      }
      
      return { success: false, error: 'Product not found' };
      
    } catch (error) {
      console.error(`❌ Keepa price history failed for ASIN ${asin}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Keepa price history data
   * @param {Object} product - Keepa product data
   * @param {number} domain - Amazon domain
   * @returns {Object} Parsed price history
   */
  parsePriceHistory(product, domain) {
    const priceTypes = {
      1: 'AMAZON', // Amazon price
      2: 'NEW', // New price
      3: 'USED', // Used price
      4: 'SALES', // Sales price
      5: 'COLLECTIBLE', // Collectible price
      6: 'REFURBISHED', // Refurbished price
      7: 'NEW_FBM', // New FBM price
      8: 'LIGHTNING_DEAL', // Lightning deal price
      9: 'WAREHOUSE', // Warehouse price
      10: 'NEW_FBA', // New FBA price
      11: 'NEW_SHIPPING', // New shipping price
      12: 'USED_SHIPPING', // Used shipping price
      13: 'NEW_SHIPPING_SAME', // New shipping same price
      14: 'USED_SHIPPING_SAME', // Used shipping same price
      15: 'NEW_SHIPPING_ADD', // New shipping add price
      16: 'USED_SHIPPING_ADD', // Used shipping add price
      17: 'NEW_SHIPPING_SUB', // New shipping sub price
      18: 'USED_SHIPPING_SUB', // Used shipping sub price
      19: 'NEW_SHIPPING_MULTI', // New shipping multi price
      20: 'USED_SHIPPING_MULTI' // Used shipping multi price
    };

    const priceHistory = [];
    let currentPrice = null;
    let lowestPrice = Infinity;
    let highestPrice = 0;
    let totalPrice = 0;
    let priceCount = 0;

    // Process Amazon price history (type 1)
    if (product.csv && product.csv[1]) {
      const amazonPrices = product.csv[1];
      const keepaTime = product.keepaTime;
      
      for (let i = 0; i < amazonPrices.length; i++) {
        const price = amazonPrices[i];
        if (price !== -1) { // -1 means no data
          const timestamp = keepaTime + (i * 24 * 60 * 60 * 1000); // Convert to milliseconds
          const date = new Date(timestamp);
          
          // Keepa prices are in cents, convert to dollars
          const priceInDollars = price / 100;
          
          priceHistory.push({
            date: date.toISOString().split('T')[0],
            price: priceInDollars,
            type: 'amazon'
          });
          
          // Track statistics
          if (priceInDollars < lowestPrice) lowestPrice = priceInDollars;
          if (priceInDollars > highestPrice) highestPrice = priceInDollars;
          totalPrice += priceInDollars;
          priceCount++;
          
          // Current price is the most recent non-null price
          if (currentPrice === null) currentPrice = priceInDollars;
        }
      }
    }

    // Sort by date
    priceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      currentPrice: currentPrice,
      lowestPrice: lowestPrice === Infinity ? null : lowestPrice,
      highestPrice: highestPrice === 0 ? null : highestPrice,
      averagePrice: priceCount > 0 ? totalPrice / priceCount : null,
      history: priceHistory
    };
  }

  /**
   * Get product categories
   * @param {string} domain - Amazon domain
   * @returns {Object} Category data
   */
  async getCategories(domain = 1) {
    try {
      console.log(`📂 Keepa: Getting categories for domain ${domain}`);
      
      const url = `${this.baseUrl}/category`;
      const params = {
        key: this.apiKey,
        domain: domain
      };

      const response = await this.session.get(url, { params });
      
      if (response.status === 200 && response.data) {
        console.log(`✅ Keepa: Retrieved categories for domain ${domain}`);
        return {
          success: true,
          data: response.data
        };
      }
      
      return { success: false, error: 'Failed to get categories' };
      
    } catch (error) {
      console.error(`❌ Keepa categories failed for domain ${domain}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get API token status
   * @returns {Object} Token status
   */
  async getTokenStatus() {
    try {
      console.log('🔑 Keepa: Checking token status');
      
      const url = `${this.baseUrl}/token`;
      const params = {
        key: this.apiKey
      };

      const response = await this.session.get(url, { params });
      
      if (response.status === 200 && response.data) {
        console.log(`✅ Keepa: Token status retrieved`);
        return {
          success: true,
          data: response.data
        };
      }
      
      return { success: false, error: 'Failed to get token status' };
      
    } catch (error) {
      console.error('❌ Keepa token status failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    try {
      const tokenStatus = await this.getTokenStatus();
      return {
        status: tokenStatus.success ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        tokenStatus: tokenStatus,
        apiKey: this.apiKey === 'demo' ? 'demo' : 'configured'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new KeepaAPIService();
