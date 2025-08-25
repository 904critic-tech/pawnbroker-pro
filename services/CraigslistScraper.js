const axios = require('axios');
const cheerio = require('cheerio');

class CraigslistScraperService {
  constructor() {
    this.baseUrl = 'https://craigslist.org';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Search for items on Craigslist
   */
  async searchItems(query, location = 'sfbay', limit = 10) {
    try {
      const searchUrl = `https://${location}.craigslist.org/search/sss?query=${encodeURIComponent(query)}&sort=date`;
      
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
      console.error('Craigslist search error:', error);
      // Return empty results instead of throwing error
      return {
        query,
        items: [],
        totalFound: 0,
        source: 'craigslist',
        location,
        note: 'Craigslist data may be limited due to anti-scraping measures'
      };
    }
  }

  /**
   * Parse search results from Craigslist
   */
  parseSearchResults(html, query, limit) {
    const $ = cheerio.load(html);
    const items = [];

    console.log('Parsing Craigslist search results...');

    // Craigslist selectors
    $('.result-row').each((index, element) => {
      if (index >= limit) return;

      const $item = $(element);
      
      // Extract item information
      const title = $item.find('.result-title').text().trim();
      const priceText = $item.find('.result-price').text().trim();
      const price = this.extractPrice(priceText);
      const location = $item.find('.result-hood').text().trim();
      const imageUrl = $item.find('.result-image').attr('data-ids');
      const itemUrl = $item.find('.result-title').attr('href');
      const datePosted = $item.find('.result-date').attr('datetime');

      if (title && price) {
        items.push({
          title,
          price,
          location,
          imageUrl: imageUrl ? this.getImageUrl(imageUrl) : null,
          itemUrl: itemUrl ? `https://craigslist.org${itemUrl}` : null,
          source: 'craigslist',
          postedDate: datePosted ? new Date(datePosted) : new Date(),
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
      source: 'craigslist',
      note: 'Local classified ads - prices may vary by location'
    };
  }

  /**
   * Get image URL from Craigslist image ID
   */
  getImageUrl(imageIds) {
    if (!imageIds) return null;
    
    // Extract first image ID
    const match = imageIds.match(/1:([^,]+)/);
    if (match) {
      return `https://images.craigslist.org/${match[1]}_300x300.jpg`;
    }
    return null;
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
   * Get pricing estimate from Craigslist
   */
  async getPricingEstimate(query, location = 'sfbay') {
    try {
      const searchResults = await this.searchItems(query, location, 20);
      
      if (searchResults.items.length === 0) {
        throw new Error('No items found on Craigslist');
      }

      // Calculate pricing statistics
      const prices = searchResults.items.map(item => item.price).filter(price => price > 0);
      
      if (prices.length === 0) {
        throw new Error('No valid prices found');
      }

      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const confidence = Math.min(0.85, 0.4 + (prices.length * 0.02)); // Base confidence on data points

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
        source: 'craigslist',
        location,
        items: searchResults.items.slice(0, 10), // Top 10 items
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Craigslist pricing estimate error:', error);
      throw new Error(`Failed to get Craigslist pricing estimate: ${error.message}`);
    }
  }
}

module.exports = new CraigslistScraperService();
