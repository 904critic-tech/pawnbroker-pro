interface eBaySale {
  title: string;
  price: number;
  condition: string;
  soldDate: string;
  shipping?: number;
  url?: string;
}

interface ScrapedResults {
  totalFound: number;
  sales: eBaySale[];
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: string;
}

class eBayScraperService {
  private readonly BACKEND_URL = 'http://10.0.0.214:5001'; // Backend server URL
  
  async searchSoldItems(query: string): Promise<ScrapedResults> {
    try {
      // Make real API call to backend scraper
      const response = await fetch(`${this.BACKEND_URL}/api/ebay/search/${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Backend scraping failed');
      }
      
      // Convert backend response to our format
      const backendData = data.data;
      return {
        totalFound: backendData.totalFound || backendData.items?.length || 0,
        sales: backendData.items || [],
        averagePrice: backendData.averagePrice || 0,
        minPrice: backendData.minPrice || 0,
        maxPrice: backendData.maxPrice || 0,
        priceRange: `$${backendData.minPrice || 0} - $${backendData.maxPrice || 0}`
      };
      
               } catch (error) {
             console.error('eBay scraping error:', error);
             throw new Error(`Failed to get pricing estimate: ${error.message}`);
           }
  }

  async getPricingEstimate(query: string): Promise<{
    marketValue: number;
    pawnValue: number;
    confidence: number;
    dataPoints: number;
    priceRange: { min: number; max: number; avg: number };
    recentSales: eBaySale[];
  }> {
    try {
      // Make real API call to backend for pricing estimate
      const response = await fetch(`${this.BACKEND_URL}/api/ebay/estimate/${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Backend estimate failed');
      }
      
      // Return real backend data
      const backendData = data.data;
      return {
        marketValue: backendData.marketValue,
        pawnValue: backendData.pawnValue,
        confidence: backendData.confidence,
        dataPoints: backendData.dataPoints,
        priceRange: backendData.priceRange,
        recentSales: backendData.recentSales || []
      };
      
    } catch (error) {
      console.error('Pricing estimate error:', error);
      throw new Error(`Failed to get pricing estimate: ${error.message}`);
    }
  }


}

export const ebayScraperService = new eBayScraperService();
export type { eBaySale, ScrapedResults };
