import { apiService } from './api';
import { marketplaceService, MarketData } from './MarketplaceService';

export interface PricingEstimate {
  itemName: string;
  category: string;
  brand?: string;
  model?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  marketValue: number;
  pawnValue: number;
  confidence: number;
  searchResults: MarketResult[];
  estimatedAt: Date;
}

export interface MarketResult {
  id: string;
  title: string;
  price: number;
  condition: string;
  soldDate: Date;
  source: 'ebay' | 'other';
  url: string;
}

class PricingService {
  // Market value multipliers based on condition
  private conditionMultipliers = {
    excellent: 1.0,
    good: 0.8,
    fair: 0.6,
    poor: 0.4,
  };

  // Category-specific base values (for fallback)
  private categoryBaseValues = {
    'Electronics': 200,
    'Jewelry': 500,
    'Tools': 150,
    'Musical Instruments': 300,
    'Sports Equipment': 100,
    'Collectibles': 250,
    'Antiques': 400,
    'Furniture': 300,
    'Clothing': 50,
    'Books': 25,
    'Other': 100,
  };

  // Brand multipliers for premium items
  private brandMultipliers = {
    'Apple': 1.3,
    'Samsung': 1.1,
    'Sony': 1.2,
    'Nike': 1.1,
    'Adidas': 1.0,
    'Rolex': 2.0,
    'Cartier': 1.8,
    'Tiffany': 1.5,
    'Gibson': 1.4,
    'Fender': 1.3,
    'Dewalt': 1.2,
    'Milwaukee': 1.2,
  };



  /**
   * Estimate pricing for an item from text description
   */
  async estimateFromText(itemName: string, category?: string): Promise<PricingEstimate> {
    try {
      // Step 1: Get market data for the item
      const marketData = await this.getMarketData(itemName);
      
      // Step 2: Calculate pricing based on market data
      const estimate = this.calculatePricing(
        { itemName, category: category || 'Other', confidence: 0.7 },
        marketData
      );
      
      return estimate;
    } catch (error) {
      console.error('Text-based pricing estimation failed:', error);
      throw new Error('Failed to estimate pricing from text');
    }
  }



  /**
   * Get market data for an item
   */
  private async getMarketData(itemName: string): Promise<MarketData> {
    try {
      // Get real market data from marketplace service
      const marketData = await marketplaceService.getQuickMarketEstimate(itemName);
      return marketData;
    } catch (error) {
      console.error('Failed to get market data:', error);
      throw new Error(`No market data available for ${itemName}`);
    }
  }

  /**
   * Calculate pricing based on market data
   */
  private calculatePricing(
    recognitionResult: { itemName: string; category: string; confidence: number },
    marketData: MarketData
  ): PricingEstimate {
    // Use the market data directly from the marketplace service
    const marketValue = marketData.marketValue;
    const pawnValue = marketData.pawnValue;
    const confidence = marketData.confidence;

    return {
      itemName: recognitionResult.itemName,
      category: recognitionResult.category,
      condition: 'good', // Default condition
      marketValue,
      pawnValue,
      confidence,
      searchResults: [], // Empty for now since we're using aggregated data
      estimatedAt: new Date(),
    };
  }

  /**
   * Get brand multiplier for pricing
   */
  private getBrandMultiplier(itemName: string): number {
    const itemNameLower = itemName.toLowerCase();
    for (const [brand, multiplier] of Object.entries(this.brandMultipliers)) {
      if (itemNameLower.includes(brand.toLowerCase())) {
        return multiplier;
      }
    }
    return 1.0; // Default multiplier
  }



  /**
   * Update estimate with user-provided details
   */
  updateEstimateWithDetails(
    estimate: PricingEstimate,
    details: {
      condition?: 'excellent' | 'good' | 'fair' | 'poor';
      brand?: string;
      model?: string;
    }
  ): PricingEstimate {
    let adjustedMarketValue = estimate.marketValue;

    // Apply condition adjustment
    if (details.condition && details.condition !== estimate.condition) {
      const oldMultiplier = this.conditionMultipliers[estimate.condition];
      const newMultiplier = this.conditionMultipliers[details.condition];
      adjustedMarketValue = (estimate.marketValue / oldMultiplier) * newMultiplier;
    }

    // Apply brand adjustment
    if (details.brand) {
      const brandMultiplier = this.getBrandMultiplier(details.brand);
      adjustedMarketValue *= brandMultiplier;
    }

    return {
      ...estimate,
      condition: details.condition || estimate.condition,
      brand: details.brand || estimate.brand,
      model: details.model || estimate.model,
      marketValue: Math.round(adjustedMarketValue),
      pawnValue: Math.round(adjustedMarketValue * 0.3),
    };
  }
}

export const pricingService = new PricingService();
export default PricingService;
