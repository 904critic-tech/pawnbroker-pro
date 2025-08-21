const axios = require('axios');

class eBayAPIService {
  constructor() {
    this.appId = 'WilliamS-PawnBrok-PRD-181203948-0c731637';
    this.baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';
    this.globalId = 'EBAY-US'; // US marketplace
  }

  async searchSoldItems(query, limit = 10) {
    console.log(`🔍 Searching eBay Finding API for sold items: ${query}`);
    
    try {
      const params = {
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': this.appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': query,
        'itemFilter(0).name': 'Condition',
        'itemFilter(0).value': 'Used',
        'itemFilter(1).name': 'ListingType',
        'itemFilter(1).value': 'AuctionWithBIN,FixedPrice',
        'itemFilter(2).name': 'SoldItemsOnly',
        'itemFilter(2).value': 'true',
        'sortOrder': 'EndTimeSoonest',
        'paginationInput.entriesPerPage': limit,
        'GLOBAL-ID': this.globalId
      };

      const response = await axios.get(this.baseUrl, { params });
      
      if (response.data && response.data.findCompletedItemsResponse && 
          response.data.findCompletedItemsResponse[0] && 
          response.data.findCompletedItemsResponse[0].searchResult && 
          response.data.findCompletedItemsResponse[0].searchResult[0] &&
          response.data.findCompletedItemsResponse[0].searchResult[0].item) {
        
        const items = response.data.findCompletedItemsResponse[0].searchResult[0].item;
        const parsedItems = items.map(item => this.parseItem(item));
        
        console.log(`✅ Found ${parsedItems.length} sold items on eBay API for: ${query}`);
        return parsedItems;
      } else {
        console.log(`⚠️  No sold items found on eBay API for: ${query}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ eBay API search failed for: ${query}`, error.message);
      throw new Error(`eBay API search failed: ${error.message}`);
    }
  }

  parseItem(item) {
    const title = item.title && item.title[0] ? item.title[0] : 'Unknown Item';
    const price = item.sellingStatus && item.sellingStatus[0] && 
                  item.sellingStatus[0].currentPrice && 
                  item.sellingStatus[0].currentPrice[0] ? 
                  parseFloat(item.sellingStatus[0].currentPrice[0].__value__) : 0;
    
    const endTime = item.listingInfo && item.listingInfo[0] && 
                    item.listingInfo[0].endTime ? 
                    item.listingInfo[0].endTime[0] : new Date().toISOString();
    
    const condition = item.condition && item.condition[0] && 
                      item.condition[0].conditionDisplayName ? 
                      item.condition[0].conditionDisplayName[0] : 'Used';
    
    const imageUrl = item.galleryURL && item.galleryURL[0] ? item.galleryURL[0] : null;
    const itemUrl = item.viewItemURL && item.viewItemURL[0] ? item.viewItemURL[0] : null;
    
    return {
      id: item.itemId && item.itemId[0] ? item.itemId[0] : `ebay-${Date.now()}`,
      title: title,
      price: price,
      imageUrl: imageUrl,
      url: itemUrl,
      soldDate: endTime,
      condition: condition,
      source: 'ebay-api'
    };
  }

  async getPricingEstimate(query) {
    console.log(`💰 Getting eBay API pricing estimate for: ${query}`);
    
    try {
      const items = await this.searchSoldItems(query, 20);
      
      if (!items || items.length === 0) {
        throw new Error('No sold items found on eBay');
      }

      // Filter out items with valid prices
      const validItems = items.filter(item => item.price > 0);
      
      if (validItems.length === 0) {
        throw new Error('No valid prices found');
      }

      // Calculate pricing statistics
      const prices = validItems.map(item => item.price);
      const avgPrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Calculate confidence based on data points and price consistency
      const priceVariance = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length);
      const confidence = Math.min(0.95, 0.5 + (validItems.length * 0.02) + (1 / (1 + priceVariance / avgPrice)) * 0.3);

      return {
        marketValue: avgPrice,
        pawnValue: Math.round(avgPrice * 0.3), // 30% of market value for pawn
        confidence: confidence,
        dataPoints: validItems.length,
        priceRange: {
          min: minPrice,
          max: maxPrice,
          avg: avgPrice
        },
        source: 'ebay-api',
        note: `eBay API pricing based on ${validItems.length} sold items`,
        recentSales: validItems.slice(0, 5) // Include top 5 recent sales
      };
    } catch (error) {
      console.error('❌ eBay API pricing estimate failed:', error.message);
      throw new Error(`eBay API pricing estimate failed: ${error.message}`);
    }
  }

  async healthCheck() {
    try {
      // Test with a simple search
      const testResponse = await this.searchSoldItems('test', 1);
      return {
        status: 'healthy',
        appId: !!this.appId,
        apiResponse: testResponse.length >= 0,
        note: 'eBay Finding API working with official credentials',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        appId: !!this.appId,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new eBayAPIService();
