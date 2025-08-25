import { ENVIRONMENT } from '../config/environment';

interface eBayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  condition: string;
  soldDate: string;
  shippingCost?: {
    value: string;
    currency: string;
  };
}

interface eBaySearchResult {
  total: number;
  items: eBayItem[];
}

class eBayService {
  private readonly EBAY_APP_ID = ENVIRONMENT.EBAY_APP_ID;
  private readonly BASE_URL = 'https://svcs.ebay.com/services/search/FindingService/v1';
  private cache = new Map<string, { data: eBaySearchResult; timestamp: number }>();
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds
  
  async searchSoldItems(query: string): Promise<eBaySearchResult> {
    try {
      // Check cache first
      const cached = this.getCachedResults(query);
      if (cached) {
        return cached;
      }

      // Check if we have a valid API key
      if (!this.EBAY_APP_ID || this.EBAY_APP_ID === 'YOUR_PRODUCTION_EBAY_APP_ID') {
        throw new Error('eBay API key not configured. Please set up production credentials.');
      }

      const params = new URLSearchParams({
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': this.EBAY_APP_ID,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': '',
        'keywords': query,
        'itemFilter(0).name': 'SoldItemsOnly',
        'itemFilter(0).value': 'true',
        'sortOrder': 'EndTimeSoonest',
        'paginationInput.entriesPerPage': '25'
      });

      const response = await fetch(`${this.BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`eBay API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.findCompletedItemsResponse && data.findCompletedItemsResponse[0].ack[0] === 'Success') {
        const results = this.parseSearchResults(data);
        // Cache the results
        this.cacheResults(query, results);
        return results;
      } else {
        throw new Error('eBay API returned an error response');
      }
      
    } catch (error) {
      console.error('eBay API error:', error);
      throw new Error('Failed to fetch eBay data');
    }
  }

  private parseSearchResults(data: any): eBaySearchResult {
    const searchResult = data.findCompletedItemsResponse[0];
    const items = searchResult.searchResult[0].item || [];
    
    const parsedItems: eBayItem[] = items.map((item: any) => ({
      itemId: item.itemId[0],
      title: item.title[0],
      price: {
        value: item.sellingStatus[0].currentPrice[0].__value__,
        currency: item.sellingStatus[0].currentPrice[0]['@currencyId']
      },
      condition: item.condition ? item.condition[0].conditionDisplayName[0] : 'Unknown',
      soldDate: item.listingInfo[0].endTime[0],
      shippingCost: item.shippingInfo && item.shippingInfo[0].shippingServiceCost ? {
        value: item.shippingInfo[0].shippingServiceCost[0].__value__,
        currency: item.shippingInfo[0].shippingServiceCost[0]['@currencyId']
      } : undefined
    }));

    return {
      total: parseInt(searchResult.paginationOutput[0].totalEntries[0]),
      items: parsedItems
    };
  }

  private getCachedResults(query: string): eBaySearchResult | null {
    const cached = this.cache.get(query);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private cacheResults(query: string, results: eBaySearchResult): void {
    this.cache.set(query, {
      data: results,
      timestamp: Date.now()
    });
  }

  private handleEBayError(error: any): void {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      // Implement exponential backoff
      console.warn('eBay API rate limit exceeded, implementing backoff');
    } else if (error.code === 'INVALID_APP_ID') {
      console.error('Invalid eBay App ID configured');
    }
  }

  async getPricingEstimate(query: string): Promise<{
    marketValue: number;
    pawnValue: number;
    confidence: number;
    dataPoints: number;
    priceRange: { min: number; max: number; avg: number };
    recentSales: eBayItem[];
  }> {
    try {
      const searchResult = await this.searchSoldItems(query);
      
      if (searchResult.items.length === 0) {
        throw new Error('No sold items found');
      }
      
      // Calculate pricing statistics
      const prices = searchResult.items.map(item => parseFloat(item.price.value));
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Calculate confidence based on data points and price consistency
      const priceVariance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
      const priceStdDev = Math.sqrt(priceVariance);
      const coefficientOfVariation = priceStdDev / avgPrice;
      
      // Higher confidence for more data points and consistent pricing
      const dataPointsScore = Math.min(searchResult.items.length / 20, 1);
      const consistencyScore = Math.max(0, 1 - coefficientOfVariation);
      const confidence = (dataPointsScore * 0.6 + consistencyScore * 0.4);
      
      // Calculate market value (weighted average of recent sales)
      const recentSales = searchResult.items.slice(0, 10); // Last 10 sales
      const recentPrices = recentSales.map(item => parseFloat(item.price.value));
      const marketValue = Math.round(recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length);
      
      // Pawn value is 30% of market value
      const pawnValue = Math.round(marketValue * 0.3);
      
      return {
        marketValue,
        pawnValue,
        confidence: Math.min(confidence, 0.95), // Cap at 95%
        dataPoints: searchResult.items.length,
        priceRange: {
          min: Math.round(minPrice),
          max: Math.round(maxPrice),
          avg: Math.round(avgPrice)
        },
        recentSales: recentSales
      };
      
    } catch (error) {
      console.error('Pricing estimate error:', error);
      throw error;
    }
  }

  // Method to implement actual eBay API call (requires eBay developer account)
  private async callEBayAPI(query: string): Promise<any> {
    // This would be the actual eBay API implementation
    // You need to register at https://developer.ebay.com/
    // and get an App ID to use their Finding API
    
    const params = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': this.EBAY_APP_ID,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': query,
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      'sortOrder': 'EndTimeSoonest'
    });

    const response = await fetch(`${this.BASE_URL}?${params}`);
    return response.json();
  }
}

export const ebayService = new eBayService();
export type { eBayItem, eBaySearchResult };
