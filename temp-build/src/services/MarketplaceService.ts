
import { aiErrorReporter, safeFormatNumber } from './AIErrorReporter';

export interface MarketData {
  query: string;
  marketValue: number;
  pawnValue: number;
  confidence: number;
  dataPoints: number;
  priceRange: { min: number; max: number; avg: number };
  recentSales?: Array<{
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
    url?: string;
    soldDate: string;
    condition: string;
    source: string;
  }>;
  source: string;
  note: string;
  lastUpdated: string;
}

export interface ComprehensiveMarketData {
  query: string;
  primarySource: string;
  sources: Record<string, any>;
  aggregatedData: {
    primaryMarketData: {
      marketValue: number;
      pawnValue: number;
      confidence: number;
      dataPoints: number;
      priceRange: { min: number; max: number };
      source: string;
      note: string;
    };
    possibleMarketRates: Array<{
      source: string;
      marketValue: number;
      pawnValue: number;
      confidence: number;
      dataPoints: number;
      priceRange: { min: number; max: number };
      note: string;
    }>;
    aggregatedData: {
      marketValue: number;
      pawnValue: number;
      confidence: number;
      totalDataPoints: number;
      sourcesUsed: number;
      note: string;
    };
    priceHistory: any;
    summary: {
      primarySource: string;
      possibleMarketRateSources: string[];
      totalSources: number;
      recommendation: string;
    };
  };
  lastUpdated: string;
}

export interface MarketBreakdown {
  query: string;
  primarySource: {
    marketValue: number;
    pawnValue: number;
    confidence: number;
    dataPoints: number;
    priceRange: { min: number; max: number };
    source: string;
    note: string;
  };
  possibleMarketRates: Array<{
    source: string;
    marketValue: number;
    pawnValue: number;
    confidence: number;
    dataPoints: number;
    priceRange: { min: number; max: number };
    note: string;
  }>;
  priceHistory: any;
  summary: {
    primarySource: string;
    possibleMarketRateSources: string[];
    totalSources: number;
    recommendation: string;
  };
  sourceStatus: Array<{
    source: string;
    status: string;
    type: string | null;
    error: string | null;
  }>;
  lastUpdated: string;
}

class MarketplaceService {
  /**
   * Get quick market estimate (eBay only)
   */
  async getQuickMarketEstimate(query: string): Promise<MarketData> {
    try {
      const baseUrl = 'https://streamautoclipper.shop';
      const endpoint = '/api/pawnshop/quick';
      const url = `${baseUrl}${endpoint}?query=${encodeURIComponent(query)}`;
      
      console.log('🔍 Fetching market estimate from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Received market data:', data);
      
      // Transform the data to match the expected interface
      const transformedData = {
        query: data.searchQuery || query,
        marketValue: data.marketValue || 0,
        pawnValue: data.offerValue || 0,
        confidence: data.confidence || 0,
        dataPoints: data.dataPoints || 0,
        priceRange: {
          min: data.priceRange?.min || 0,
          max: data.priceRange?.max || 0,
          avg: data.marketValue || 0
        },
        recentSales: data.recentSales || [],
        source: data.source || 'eBay',
        note: data.message || '',
        lastUpdated: data.timestamp || new Date().toISOString()
      };
      
      console.log('✅ Transformed market data:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('❌ Error getting quick market estimate:', error);
      // Report error to AI Error Reporter
      aiErrorReporter.reportError(error as Error, {
        screen: 'MarketplaceService',
        action: 'getQuickMarketEstimate',
        data: { query, baseUrl: 'https://streamautoclipper.shop' }
      });
      throw error;
    }
  }

  /**
   * Get comprehensive market data from all sources
   */
  async getComprehensiveMarketData(query: string): Promise<ComprehensiveMarketData> {
    try {
      const baseUrl = 'https://streamautoclipper.shop';
      const endpoint = '/api/pawnshop/comprehensive';
      const response = await fetch(`${baseUrl}${endpoint}/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data.data || data;
    } catch (error) {
      console.error('Comprehensive market data error:', error);
      throw new Error('Failed to get comprehensive market data');
    }
  }

  /**
   * Get market data breakdown by source
   */
  async getMarketBreakdown(query: string): Promise<MarketBreakdown> {
    try {
      const baseUrl = 'https://streamautoclipper.shop';
      const endpoint = '/api/pawnshop/comprehensive';
      const response = await fetch(`${baseUrl}${endpoint}/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data.data || data;
    } catch (error) {
      console.error('Market breakdown error:', error);
      throw new Error('Failed to get market breakdown');
    }
  }

  /**
   * Check marketplace service health
   */
  async checkHealth(): Promise<{ success: boolean; message: string; availableSources: string[]; primarySource: string }> {
    try {
      const baseUrl = 'https://streamautoclipper.shop';
      const endpoint = '/api/pawnshop/health';
      const response = await fetch(`${baseUrl}${endpoint}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Marketplace health check error:', error);
      throw new Error('Failed to check marketplace health');
    }
  }

  /**
   * Get eBay visual data for AI learning
   */
  async getEbayVisualData(query: string): Promise<any> {
    try {
      const baseUrl = 'https://streamautoclipper.shop';
      const response = await fetch(`${baseUrl}/api/pawnshop/ebay-visual-learning/${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('eBay visual data failed:', error);
      return {
        success: false,
        message: error.message,
        aiLearningData: null
      };
    }
  }

  /**
   * Get PriceCharting visual data for AI learning
   */
  async getPriceChartingVisualData(query: string): Promise<any> {
    try {
      const baseUrl = 'https://streamautoclipper.shop';
      const response = await fetch(`${baseUrl}/api/pawnshop/pricecharting-visual-learning/${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('PriceCharting visual data failed:', error);
      return {
        success: false,
        message: error.message,
        visualLearningData: null
      };
    }
  }

  /**
   * Get formatted market data for display
   */
  formatMarketData(data: MarketData) {
    return {
      marketValue: `$${safeFormatNumber(data.marketValue)}`,
      pawnValue: `$${safeFormatNumber(data.pawnValue)}`,
      confidence: `${Math.round(data.confidence * 100)}%`,
      source: data.source.toUpperCase(),
      note: data.note,
      lastUpdated: new Date(data.lastUpdated).toLocaleDateString()
    };
  }

  /**
   * Get formatted comprehensive data for display
   */
  formatComprehensiveData(data: ComprehensiveMarketData) {
    const primary = data.aggregatedData.primaryMarketData;
    const aggregated = data.aggregatedData.aggregatedData;
    const summary = data.aggregatedData.summary;

    return {
      primary: {
        marketValue: `$${safeFormatNumber(primary.marketValue)}`,
        pawnValue: `$${safeFormatNumber(primary.pawnValue)}`,
        confidence: `${Math.round(primary.confidence * 100)}%`,
        dataPoints: primary.dataPoints,
        source: primary.source.toUpperCase(),
        note: primary.note
      },
      aggregated: {
        marketValue: `$${safeFormatNumber(aggregated.marketValue)}`,
        pawnValue: `$${safeFormatNumber(aggregated.pawnValue)}`,
        confidence: `${Math.round(aggregated.confidence * 100)}%`,
        totalDataPoints: aggregated.totalDataPoints,
        sourcesUsed: aggregated.sourcesUsed,
        note: aggregated.note
      },
      summary: {
        primarySource: summary.primarySource,
        possibleMarketRateSources: summary.possibleMarketRateSources,
        totalSources: summary.totalSources,
        recommendation: summary.recommendation
      },
      possibleMarketRates: data.aggregatedData.possibleMarketRates.map(rate => ({
        source: rate.source.toUpperCase(),
        marketValue: `$${safeFormatNumber(rate.marketValue)}`,
        pawnValue: `$${safeFormatNumber(rate.pawnValue)}`,
        confidence: `${Math.round(rate.confidence * 100)}%`,
        dataPoints: rate.dataPoints,
        note: rate.note
      }))
    };
  }
}

export const marketplaceService = new MarketplaceService();
