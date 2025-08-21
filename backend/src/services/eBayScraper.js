const axios = require('axios');
const cheerio = require('cheerio');

class eBayScraperService {
  constructor() {
    this.baseUrl = 'https://www.ebay.com/sch/i.html';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async searchSoldItems(query, limit = 25) {
    try {
      const searchParams = new URLSearchParams({
        '_nkw': query,
        '_sacat': '0',
        'LH_Sold': '1',
        'LH_Complete': '1',
        '_sop': '13', // Sort by sold date
        '_ipg': limit.toString()
      });

      const url = `${this.baseUrl}?${searchParams}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
      });

      return this.parseSearchResults(response.data, query);
      
    } catch (error) {
      console.error('eBay scraping error:', error);
      throw new Error('Failed to scrape eBay data');
    }
  }

  parseSearchResults(html, query) {
    const $ = cheerio.load(html);
    const items = [];

    // Parse eBay search results
    $('.s-item').each((index, element) => {
      if (index === 0) return; // Skip first item (usually a header)

      const $item = $(element);
      
      // Extract item title
      const title = $item.find('.s-item__title').text().trim();
      
      // Extract price
      const priceText = $item.find('.s-item__price').text().trim();
      const price = this.extractPrice(priceText);
      
      // Extract condition
      const condition = $item.find('.SECONDARY_INFO').text().trim() || 'Used';
      
      // Extract sold date
      const soldDateText = $item.find('.s-item__title--tagblock').text().trim();
      const soldDate = this.parseSoldDate(soldDateText);
      
      // Extract shipping
      const shippingText = $item.find('.s-item__shipping').text().trim();
      const shipping = this.extractShipping(shippingText);
      
      // Extract URL
      const url = $item.find('.s-item__link').attr('href');

      if (title && price) {
        items.push({
          title,
          price,
          condition,
          soldDate,
          shipping,
          url
        });
      }
    });

    return {
      query,
      totalFound: items.length,
      items,
      averagePrice: this.calculateAveragePrice(items),
      minPrice: Math.min(...items.map(item => item.price)),
      maxPrice: Math.max(...items.map(item => item.price))
    };
  }

  extractPrice(priceText) {
    const match = priceText.match(/[\$£€]?([\d,]+\.?\d*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  }

  extractShipping(shippingText) {
    if (shippingText.includes('Free')) return 0;
    const match = shippingText.match(/[\$£€]?([\d,]+\.?\d*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  }

  parseSoldDate(dateText) {
    // Parse eBay's sold date format
    const now = new Date();
    
    if (dateText.includes('Today')) {
      return now.toISOString();
    }
    
    if (dateText.includes('Yesterday')) {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return yesterday.toISOString();
    }
    
    // Try to parse other date formats
    const match = dateText.match(/(\d+)\s+(day|week|month)s?\s+ago/);
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2];
      
      let milliseconds;
      switch (unit) {
        case 'day':
          milliseconds = amount * 24 * 60 * 60 * 1000;
          break;
        case 'week':
          milliseconds = amount * 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          milliseconds = amount * 30 * 24 * 60 * 60 * 1000;
          break;
        default:
          milliseconds = 0;
      }
      
      const date = new Date(now.getTime() - milliseconds);
      return date.toISOString();
    }
    
    return now.toISOString();
  }

  calculateAveragePrice(items) {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + item.price, 0);
    return Math.round(total / items.length);
  }

  async getPricingEstimate(query) {
    try {
      const searchResults = await this.searchSoldItems(query, 25);
      
      if (searchResults.items.length === 0) {
        throw new Error('No sold items found');
      }

      const prices = searchResults.items.map(item => item.price);
      const avgPrice = searchResults.averagePrice;
      const minPrice = searchResults.minPrice;
      const maxPrice = searchResults.maxPrice;

      // Calculate confidence based on data quality
      const dataPointsScore = Math.min(searchResults.totalFound / 50, 1);
      const priceConsistency = this.calculatePriceConsistency(prices);
      const confidence = (dataPointsScore * 0.7 + priceConsistency * 0.3);

      // Calculate pawn value (30% of market value)
      const marketValue = avgPrice;
      const pawnValue = Math.round(marketValue * 0.3);

      return {
        marketValue,
        pawnValue,
        confidence: Math.min(confidence, 0.95),
        dataPoints: searchResults.totalFound,
        priceRange: {
          min: minPrice,
          max: maxPrice,
          avg: avgPrice
        },
        recentSales: searchResults.items.slice(0, 10)
      };

    } catch (error) {
      console.error('Pricing estimate error:', error);
      throw error;
    }
  }

  calculatePriceConsistency(prices) {
    if (prices.length < 2) return 0.5;
    
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Calculate coefficient of variation (lower = more consistent)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgPrice;
    
    // Convert to consistency score (0-1, higher = more consistent)
    return Math.max(0, 1 - coefficientOfVariation);
  }
}

module.exports = new eBayScraperService();
