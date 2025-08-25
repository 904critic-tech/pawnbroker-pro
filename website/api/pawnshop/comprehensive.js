// Pawnshop Comprehensive Market Data API
// Provides detailed market analysis from multiple sources

const axios = require('axios');
const cheerio = require('cheerio');

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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

// eBay scraper function (same as quick endpoint)
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

    return items.slice(0, 30); // Return top 30 items for comprehensive analysis
  } catch (error) {
    console.error('eBay scraping error:', error.message);
    return [];
  }
}

// Extract brand and model from item titles
function extractBrandModel(items) {
  const brandCounts = {};
  const modelCounts = {};
  
  items.forEach(item => {
    const title = item.title.toLowerCase();
    
    // Common brand patterns
    const brandPatterns = [
      'iphone', 'samsung', 'apple', 'google', 'sony', 'lg', 'motorola', 'nokia',
      'nintendo', 'playstation', 'xbox', 'microsoft', 'dell', 'hp', 'lenovo',
      'canon', 'nikon', 'fujifilm', 'gopro', 'dji', 'rolex', 'omega', 'seiko'
    ];
    
    brandPatterns.forEach(brand => {
      if (title.includes(brand)) {
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      }
    });
    
    // Extract model numbers (common patterns)
    const modelMatches = title.match(/\b[a-z]+\s*\d+[a-z]*\b/gi);
    if (modelMatches) {
      modelMatches.forEach(model => {
        const cleanModel = model.trim();
        if (cleanModel.length > 2) {
          modelCounts[cleanModel] = (modelCounts[cleanModel] || 0) + 1;
        }
      });
    }
  });
  
  // Get top brands and models
  const topBrands = Object.entries(brandCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([brand, count]) => ({ brand, count, confidence: Math.min(95, count * 10) }));
    
  const topModels = Object.entries(modelCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([model, count]) => ({ model, count, confidence: Math.min(95, count * 10) }));
  
  return { brands: topBrands, models: topModels };
}

// Calculate comprehensive market analysis
function calculateComprehensiveAnalysis(items) {
  if (items.length === 0) {
    return {
      marketValue: 0,
      offerValue: 0,
      dataPoints: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 0,
      priceDistribution: [],
      conditionAnalysis: {},
      brandModelAnalysis: { brands: [], models: [] }
    };
  }

  const prices = items.map(item => item.price).filter(price => price > 0);
  
  if (prices.length === 0) {
    return {
      marketValue: 0,
      offerValue: 0,
      dataPoints: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 0,
      priceDistribution: [],
      conditionAnalysis: {},
      brandModelAnalysis: { brands: [], models: [] }
    };
  }

  // Calculate statistics
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const sortedPrices = prices.sort((a, b) => a - b);
  const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
  
  // Use median for more accurate estimate
  const marketValue = Math.round(medianPrice);
  const offerValue = Math.round(marketValue * 0.3); // 30% of market value
  
  const confidence = Math.min(95, Math.max(30, prices.length * 2)); // 30-95% based on data points

  // Price distribution analysis
  const priceRanges = [
    { range: 'Under $50', count: 0, min: 0, max: 50 },
    { range: '$50-$100', count: 0, min: 50, max: 100 },
    { range: '$100-$250', count: 0, min: 100, max: 250 },
    { range: '$250-$500', count: 0, min: 250, max: 500 },
    { range: '$500-$1000', count: 0, min: 500, max: 1000 },
    { range: 'Over $1000', count: 0, min: 1000, max: Infinity }
  ];

  prices.forEach(price => {
    const range = priceRanges.find(r => price >= r.min && price < r.max);
    if (range) range.count++;
  });

  // Condition analysis
  const conditionAnalysis = {};
  items.forEach(item => {
    const condition = item.condition || 'Unknown';
    conditionAnalysis[condition] = (conditionAnalysis[condition] || 0) + 1;
  });

  // Brand and model analysis
  const brandModelAnalysis = extractBrandModel(items);

  return {
    marketValue,
    offerValue,
    dataPoints: prices.length,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    confidence,
    priceDistribution: priceRanges,
    conditionAnalysis,
    brandModelAnalysis,
    recentSales: items.slice(0, 10) // Top 10 recent sales
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

    console.log(`🔍 Pawnshop comprehensive analysis request for: ${query}`);

    // Check cache first
    const cacheKey = `comprehensive_${query.toLowerCase()}`;
    const cachedResult = getCachedData(cacheKey);
    
    if (cachedResult) {
      console.log('✅ Returning cached comprehensive result');
      return res.status(200).json(cachedResult);
    }

    // Scrape eBay for sold items
    console.log('📊 Scraping eBay for comprehensive analysis...');
    const items = await scrapeEbaySoldItems(query);
    
    if (items.length === 0) {
      console.log('❌ No items found for comprehensive analysis');
      return res.status(200).json({
        marketValue: 0,
        offerValue: 0,
        dataPoints: 0,
        priceRange: { min: 0, max: 0 },
        confidence: 0,
        priceDistribution: [],
        conditionAnalysis: {},
        brandModelAnalysis: { brands: [], models: [] },
        recentSales: [],
        message: 'No recent sales data found for this item'
      });
    }

    // Calculate comprehensive analysis
    const analysis = calculateComprehensiveAnalysis(items);
    
    const result = {
      ...analysis,
      searchQuery: query,
      timestamp: new Date().toISOString(),
      source: 'eBay Scraper',
      analysisType: 'comprehensive'
    };

    // Cache the result
    setCachedData(cacheKey, result);

    console.log(`✅ Comprehensive analysis completed: $${analysis.marketValue} (${analysis.dataPoints} data points)`);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Pawnshop comprehensive API error:', error);
    res.status(500).json({ 
      error: 'Failed to get comprehensive market data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
