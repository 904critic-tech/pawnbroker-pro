const axios = require('axios');
const cheerio = require('cheerio');

class CamelCamelCamelScraperService {
  constructor() {
    this.baseUrl = 'https://camelcamelcamel.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Search for products on CamelCamelCamel
   */
  async searchProducts(query, limit = 10) {
    try {
      const searchUrl = `${this.baseUrl}/search?sq=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        timeout: 10000,
      });

      return this.parseSearchResults(response.data, query, limit);
    } catch (error) {
      console.error('CamelCamelCamel search error:', error);
      throw new Error(`Failed to search CamelCamelCamel: ${error.message}`);
    }
  }

  /**
   * Get price history for a specific product
   */
  async getPriceHistory(productUrl) {
    try {
      const response = await axios.get(productUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
        timeout: 10000,
      });

      return this.parsePriceHistory(response.data);
    } catch (error) {
      console.error('CamelCamelCamel price history error:', error);
      throw new Error(`Failed to get price history: ${error.message}`);
    }
  }

  /**
   * Parse search results from CamelCamelCamel
   */
  parseSearchResults(html, query, limit) {
    const $ = cheerio.load(html);
    const products = [];

    console.log('Parsing CamelCamelCamel search results...');

    // Look for product listings
    $('.product_row').each((index, element) => {
      if (index >= limit) return;

      const $product = $(element);
      
      // Extract product information
      const title = $product.find('.product_title').text().trim();
      const priceElement = $product.find('.price');
      const currentPrice = this.extractPrice(priceElement.text());
      const productUrl = $product.find('a').attr('href');
      const imageUrl = $product.find('img').attr('src');

      if (title && currentPrice) {
        products.push({
          title,
          currentPrice,
          productUrl: productUrl ? `${this.baseUrl}${productUrl}` : null,
          imageUrl,
          source: 'amazon',
          lastUpdated: new Date().toISOString()
        });
      }
    });

    console.log(`Found ${products.length} products for query: ${query}`);
    return {
      query,
      products,
      totalFound: products.length,
      source: 'camelcamelcamel'
    };
  }

  /**
   * Parse price history from product page
   */
  parsePriceHistory(html) {
    const $ = cheerio.load(html);
    
    // Extract current price
    const currentPriceText = $('.price').first().text();
    const currentPrice = this.extractPrice(currentPriceText);

    // Extract price statistics
    const priceStats = {};
    $('.price_stats .stat').each((index, element) => {
      const $stat = $(element);
      const label = $stat.find('.label').text().trim();
      const value = $stat.find('.value').text().trim();
      
      if (label && value) {
        priceStats[label.toLowerCase().replace(/\s+/g, '_')] = this.extractPrice(value);
      }
    });

    // Extract price history data points (if available)
    const priceHistory = [];
    $('.price_history .data_point').each((index, element) => {
      const $point = $(element);
      const date = $point.find('.date').text().trim();
      const price = this.extractPrice($point.find('.price').text());
      
      if (date && price) {
        priceHistory.push({
          date,
          price,
          timestamp: new Date(date).toISOString()
        });
      }
    });

    return {
      currentPrice,
      priceStats,
      priceHistory: priceHistory.slice(0, 30), // Last 30 data points
      lastUpdated: new Date().toISOString(),
      source: 'camelcamelcamel'
    };
  }

  /**
   * Extract price from text
   */
  extractPrice(priceText) {
    if (!priceText) return null;
    
    const match = priceText.match(/[\$£€]?([\d,]+\.?\d*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Get comprehensive price data for a product
   */
  async getProductPriceData(query) {
    try {
      // First search for the product
      const searchResults = await this.searchProducts(query, 5);
      
      if (searchResults.products.length === 0) {
        throw new Error('No products found');
      }

      // Get price history for the first (most relevant) product
      const firstProduct = searchResults.products[0];
      const priceHistory = await this.getPriceHistory(firstProduct.productUrl);

      return {
        product: firstProduct,
        priceHistory,
        searchResults: searchResults.products,
        source: 'camelcamelcamel'
      };
    } catch (error) {
      console.error('CamelCamelCamel product price data error:', error);
      throw new Error(`Failed to get product price data: ${error.message}`);
    }
  }
}

module.exports = new CamelCamelCamelScraperService();
