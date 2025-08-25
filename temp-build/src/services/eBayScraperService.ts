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
  private readonly LAMBDA_URL = 'https://5opd4n4a4yk4t2hs7efwcmplbm0cmidw.lambda-url.us-east-2.on.aws/';
  private readonly BACKEND_URL = 'https://pawnbroker-bm4w19zwh-904critic-techs-projects.vercel.app'; // Fallback backend URL
  
  async searchSoldItems(query: string): Promise<ScrapedResults> {
    try {
      // Try backend first, fall back to Lambda
      try {
        const response = await fetch(`${this.BACKEND_URL}/api/ebay/search/${encodeURIComponent(query)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            const backendData = data.data;
            return {
              totalFound: backendData.totalFound || backendData.items?.length || 0,
              sales: backendData.items || [],
              averagePrice: backendData.averagePrice || 0,
              minPrice: backendData.minPrice || 0,
              maxPrice: backendData.maxPrice || 0,
              priceRange: `$${backendData.minPrice || 0} - $${backendData.maxPrice || 0}`
            };
          }
        }
      } catch (backendError) {
        console.log('Backend failed, using Lambda fallback');
      }
      
      // Fallback: Use Lambda for basic pricing
      const lambdaResponse = await fetch(this.LAMBDA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemName: query })
      });
      
      if (lambdaResponse.ok) {
        const lambdaData = await lambdaResponse.json();
        if (lambdaData.success) {
          // Convert Lambda response to expected format
          return {
            totalFound: 1,
            sales: [{
              title: query,
              price: lambdaData.data.marketValue,
              condition: 'Used',
              soldDate: new Date().toISOString()
            }],
            averagePrice: lambdaData.data.marketValue,
            minPrice: lambdaData.data.marketValue,
            maxPrice: lambdaData.data.marketValue,
            priceRange: `$${lambdaData.data.marketValue} - $${lambdaData.data.marketValue}`
          };
        }
      }
      
      throw new Error('Both backend and Lambda failed');
      
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
      // Try backend first, fall back to Lambda
      try {
        const response = await fetch(`${this.BACKEND_URL}/api/ebay/estimate/${encodeURIComponent(query)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            const backendData = data.data;
            return {
              marketValue: backendData.marketValue,
              pawnValue: backendData.pawnValue,
              confidence: backendData.confidence,
              dataPoints: backendData.dataPoints,
              priceRange: backendData.priceRange,
              recentSales: backendData.recentSales || []
            };
          }
        }
      } catch (backendError) {
        console.log('Backend failed, using Lambda fallback');
      }
      
      // Fallback: Use Lambda directly
      const response = await fetch(this.LAMBDA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemName: query })
      });
      
      if (!response.ok) {
        throw new Error(`Lambda error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Lambda estimate failed');
      }
      
      // Convert Lambda response to expected format
      const lambdaData = data.data;
      return {
        marketValue: lambdaData.marketValue,
        pawnValue: lambdaData.pawnValue,
        confidence: lambdaData.confidence,
        dataPoints: lambdaData.dataPoints || 1,
        priceRange: {
          min: lambdaData.marketValue * 0.8,
          max: lambdaData.marketValue * 1.2,
          avg: lambdaData.marketValue
        },
        recentSales: lambdaData.recentSales || []
      };
      
    } catch (error) {
      console.error('Pricing estimate error:', error);
      throw new Error(`Failed to get pricing estimate: ${error.message}`);
    }
  }
}

export const ebayScraperService = new eBayScraperService();
export type { eBaySale, ScrapedResults };
