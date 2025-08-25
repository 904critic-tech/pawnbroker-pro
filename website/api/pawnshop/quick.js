// Pawnshop Quick Market Estimate API
// Follows the same structure as existing website APIs

const axios = require('axios');
const cheerio = require('cheerio');

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data
function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// Helper function to set cached data
function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// eBay scraper function
async function scrapeEbaySoldItems(query) {
  try {
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&LH_Sold=1&LH_Complete=1&_ipg=50`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const items = [];

    $('.s-item').each((index, element) => {
      if (index === 0) return; // Skip first item (usually a header)

      const title = $(element).find('.s-item__title').text().trim();
      const priceText = $(element).find('.s-item__price').text().trim();
      const soldDate = $(element).find('.s-item__title--tagblock .POSITIVE').text().trim();
      const imageUrl = $(element).find('.s-item__image-img').attr('src');
      const condition = $(element).find('.SECONDARY_INFO').text().trim();

      // Skip placeholder items
      if (title.includes('Shop on eBay') || 
          title.includes('click here') || 
          title.toLowerCase().includes('advertisement')) {
        return;
      }

      // Extract price
      const priceMatch = priceText.match(/[\$£€]?[\d,]+\.?\d*/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/[\$£€,]/g, '')) : 0;

      if (price > 5 && title.length > 10) { // Filter out very cheap items and short titles
        items.push({
          title,
          price,
          soldDate,
          imageUrl,
          condition: condition || 'Used',
          source: 'eBay'
        });
      }
    });

    return items.slice(0, 20); // Return top 20 items
  } catch (error) {
    console.error('eBay scraping error:', error.message);
    return [];
  }
}

// Calculate market estimate from items
function calculateMarketEstimate(items) {
  if (items.length === 0) {
    return {
      marketValue: 0,
      offerValue: 0,
      dataPoints: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 0
    };
  }

  const prices = items.map(item => item.price).filter(price => price > 0);
  
  if (prices.length === 0) {
    return {
      marketValue: 0,
      offerValue: 0,
      dataPoints: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 0
    };
  }

  // Calculate statistics
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const sortedPrices = prices.sort((a, b) => a - b);
  const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
  
  // Use median for more accurate estimate
  const marketValue = Math.round(medianPrice);
  const offerValue = Math.round(marketValue * 0.3); // 30% of market value
  
  const confidence = Math.min(95, Math.max(30, prices.length * 3)); // 30-95% based on data points

  return {
    marketValue,
    offerValue,
    dataPoints: prices.length,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    confidence,
    recentSales: items.slice(0, 5) // Top 5 recent sales
  };
}

module.exports = async function handler(req, res) {
  // Enable CORS (following your existing pattern)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`🔍 Pawnshop quick estimate request for: ${query}`);

    // Check cache first
    const cacheKey = `quick_${query.toLowerCase()}`;
    const cachedResult = getCachedData(cacheKey);
    
    if (cachedResult) {
      console.log('✅ Returning cached result');
      return res.status(200).json(cachedResult);
    }

    // Scrape eBay for sold items
    console.log('📊 Scraping eBay for sold items...');
    const items = await scrapeEbaySoldItems(query);
    
    if (items.length === 0) {
      console.log('❌ No items found');
      return res.status(200).json({
        marketValue: 0,
        offerValue: 0,
        dataPoints: 0,
        priceRange: { min: 0, max: 0 },
        confidence: 0,
        recentSales: [],
        message: 'No recent sales data found for this item'
      });
    }

    // Calculate market estimate
    const estimate = calculateMarketEstimate(items);
    
    const result = {
      ...estimate,
      searchQuery: query,
      timestamp: new Date().toISOString(),
      source: 'eBay Scraper'
    };

    // Cache the result
    setCachedData(cacheKey, result);

    console.log(`✅ Market estimate calculated: $${estimate.marketValue} (${estimate.dataPoints} data points)`);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Pawnshop API error:', error);
    res.status(500).json({ 
      error: 'Failed to get market estimate',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
