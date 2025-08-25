const axios = require('axios');
const cheerio = require('cheerio');

// eBay Scraper Logic (simplified for Lambda)
class eBayScraper {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async searchSoldItems(query, limit = 10) {
    try {
      const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&LH_Sold=1&LH_Complete=1&_ipg=${limit}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const items = [];

      $('.s-item').each((i, element) => {
        if (i === 0) return; // Skip first item (usually a header)
        
        const title = $(element).find('.s-item__title').text().trim();
        const priceText = $(element).find('.s-item__price').text().trim();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        
        if (title && price && !isNaN(price)) {
          items.push({
            title: title,
            price: price,
            source: 'eBay Sold'
          });
        }
      });

      return items.slice(0, limit);
    } catch (error) {
      console.error('eBay scraping error:', error.message);
      return [];
    }
  }
}

// Specialized Price Guides (simplified)
class SpecializedPriceGuides {
  constructor() {
    this.jewelryData = {
      'diamond ring': { marketValue: 2500, pawnValue: 750 },
      'gold necklace': { marketValue: 800, pawnValue: 240 },
      'silver bracelet': { marketValue: 150, pawnValue: 45 }
    };
    
    this.electronicsData = {
      'iphone': { marketValue: 800, pawnValue: 240 },
      'macbook': { marketValue: 1200, pawnValue: 360 },
      'playstation': { marketValue: 400, pawnValue: 120 }
    };
  }

  getSpecializedPricing(itemName) {
    const lowerName = itemName.toLowerCase();
    
    // Check jewelry
    for (const [key, data] of Object.entries(this.jewelryData)) {
      if (lowerName.includes(key)) {
        return {
          marketValue: data.marketValue,
          pawnValue: data.pawnValue,
          confidence: 0.8,
          source: 'Specialized Price Guide',
          category: 'Jewelry'
        };
      }
    }
    
    // Check electronics
    for (const [key, data] of Object.entries(this.electronicsData)) {
      if (lowerName.includes(key)) {
        return {
          marketValue: data.marketValue,
          pawnValue: data.pawnValue,
          confidence: 0.8,
          source: 'Specialized Price Guide',
          category: 'Electronics'
        };
      }
    }
    
    return null;
  }
}

// Main pricing calculator
class PricingCalculator {
  constructor() {
    this.ebayScraper = new eBayScraper();
    this.specializedGuides = new SpecializedPriceGuides();
  }

  async calculatePricing(itemName) {
    try {
      console.log(`🔍 Calculating pricing for: ${itemName}`);
      
      // Try specialized guides first
      const specializedPricing = this.specializedGuides.getSpecializedPricing(itemName);
      if (specializedPricing) {
        console.log(`✅ Found specialized pricing for: ${itemName}`);
        return {
          success: true,
          data: specializedPricing,
          timestamp: new Date().toISOString()
        };
      }
      
      // Try eBay scraping
      console.log(`🔍 Searching eBay for: ${itemName}`);
      const ebayItems = await this.ebayScraper.searchSoldItems(itemName, 5);
      
      if (ebayItems && ebayItems.length > 0) {
        const prices = ebayItems.map(item => item.price).filter(p => p > 0);
        const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
        const pawnValue = Math.round(avgPrice * 0.3);
        
        console.log(`✅ Found ${ebayItems.length} eBay items for: ${itemName}`);
        
        return {
          success: true,
          data: {
            marketValue: avgPrice,
            pawnValue: pawnValue,
            confidence: Math.min(0.85, 0.5 + (prices.length * 0.1)),
            dataPoints: prices.length,
            source: 'eBay Sold Listings',
            recentSales: ebayItems.slice(0, 3)
          },
          timestamp: new Date().toISOString()
        };
      }
      
      // No data found
      console.log(`⚠️ No pricing data found for: ${itemName}`);
      return {
        success: false,
        error: 'No pricing data available',
        data: {
          marketValue: 0,
          pawnValue: 0,
          confidence: 0,
          source: 'No data found'
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Pricing calculation failed for ${itemName}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: {
          marketValue: 0,
          pawnValue: 0,
          confidence: 0,
          source: 'Error occurred'
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Lambda handler
exports.handler = async (event) => {
  const calculator = new PricingCalculator();
  
  try {
    // Parse the request
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      body = event.body || {};
    }
    
    const { itemName } = body;
    
    if (!itemName) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'itemName is required',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Calculate pricing
    const result = await calculator.calculatePricing(itemName);
    
    return {
      statusCode: result.success ? 200 : 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Lambda handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
