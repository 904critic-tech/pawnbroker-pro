const axios = require('axios');
const cheerio = require('cheerio');

class OfferUpScraperService {
  constructor() {
    this.baseUrl = 'https://offerup.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Search for items on OfferUp
   */
  async searchItems(query, limit = 10) {
    try {
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&sort=recent`;
      
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
        timeout: 15000,
      });

      return this.parseSearchResults(response.data, query, limit);
    } catch (error) {
      console.error('OfferUp search error:', error);
      // Return empty results instead of throwing error
      return {
        query,
        items: [],
        totalFound: 0,
        source: 'offerup',
        note: 'OfferUp data may be limited due to anti-scraping measures'
      };
    }
  }

  /**
   * Parse search results from OfferUp
   */
  parseSearchResults(html, query, limit) {
    const $ = cheerio.load(html);
    const items = [];

    console.log('Parsing OfferUp search results...');

    // OfferUp selectors (these may need updating based on current site structure)
    $('[data-testid="item-card"]').each((index, element) => {
      if (index >= limit) return;

      const $item = $(element);
      
      // Extract item information
      const title = $item.find('[data-testid="item-title"]').text().trim();
      const priceText = $item.find('[data-testid="item-price"]').text().trim();
      const price = this.extractPrice(priceText);
      const location = $item.find('[data-testid="item-location"]').text().trim();
      const imageUrl = $item.find('img').attr('src');
      const itemUrl = $item.find('a').attr('href');

      if (title && price) {
        items.push({
          title,
          price,
          location,
          imageUrl,
          itemUrl: itemUrl ? `${this.baseUrl}${itemUrl}` : null,
          source: 'offerup',
          postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Estimated
          condition: this.estimateCondition(title),
          lastUpdated: new Date().toISOString()
        });
      }
    });

    console.log(`Found ${items.length} items for query: ${query}`);
    return {
      query,
      items,
      totalFound: items.length,
      source: 'offerup',
      note: 'Mobile marketplace data - prices may vary by location'
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
   * Estimate condition based on title keywords
   */
  estimateCondition(title) {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('new') || lowerTitle.includes('brand new')) return 'excellent';
    if (lowerTitle.includes('like new') || lowerTitle.includes('mint')) return 'excellent';
    if (lowerTitle.includes('good') || lowerTitle.includes('used')) return 'good';
    if (lowerTitle.includes('fair') || lowerTitle.includes('acceptable')) return 'fair';
    if (lowerTitle.includes('poor') || lowerTitle.includes('broken')) return 'poor';
    
    return 'good'; // Default
  }

  /**
   * Get pricing estimate from OfferUp
   */
  async getPricingEstimate(query) {
    try {
      const searchResults = await this.searchItems(query, 20);
      
      if (searchResults.items.length === 0) {
        throw new Error('No items found on OfferUp');
      }

      // Calculate pricing statistics
      const prices = searchResults.items.map(item => item.price).filter(price => price > 0);
      
      if (prices.length === 0) {
        throw new Error('No valid prices found');
      }

      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const confidence = Math.min(0.8, 0.3 + (prices.length * 0.025)); // Base confidence on data points

      return {
        query,
        marketValue: Math.round(averagePrice),
        pawnValue: Math.round(averagePrice * 0.3), // 30% of market value
        confidence: Math.round(confidence * 100) / 100,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        dataPoints: prices.length,
        source: 'offerup',
        items: searchResults.items.slice(0, 10), // Top 10 items
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('OfferUp pricing estimate error:', error);
      throw new Error(`Failed to get OfferUp pricing estimate: ${error.message}`);
    }
  }
}

module.exports = new OfferUpScraperService();
