

export interface MarketData {
  query: string;
  marketValue: number;
  pawnValue: number;
  confidence: number;
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
      // Use only the Ethernet interface that your phone can reach
      const baseUrl = __DEV__ ? 'http://10.0.0.7:5001' : 'https://your-production-backend.com';
      const response = await fetch(`${baseUrl}/api/marketplace/quick/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data.data;
    } catch (error) {
      console.error('Quick market estimate error:', error);
      throw new Error('Failed to get quick market estimate');
    }
  }

  /**
   * Get comprehensive market data from all sources
   */
  async getComprehensiveMarketData(query: string): Promise<ComprehensiveMarketData> {
    try {
      // Use only the Ethernet interface that your phone can reach
      const baseUrl = __DEV__ ? 'http://10.0.0.7:5001' : 'https://your-production-backend.com';
      const response = await fetch(`${baseUrl}/api/marketplace/comprehensive/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data.data;
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
      // Use only the Ethernet interface that your phone can reach
      const baseUrl = __DEV__ ? 'http://10.0.0.7:5001' : 'https://your-production-backend.com';
      const response = await fetch(`${baseUrl}/api/marketplace/breakdown/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data.data;
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
      // Use only the Ethernet interface that your phone can reach
      const baseUrl = __DEV__ ? 'http://10.0.0.7:5001' : 'https://your-production-backend.com';
      const response = await fetch(`${baseUrl}/api/marketplace/health`);
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
   * Get formatted market data for display
   */
  formatMarketData(data: MarketData) {
    return {
      marketValue: `$${data.marketValue.toLocaleString()}`,
      pawnValue: `$${data.pawnValue.toLocaleString()}`,
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
        marketValue: `$${primary.marketValue.toLocaleString()}`,
        pawnValue: `$${primary.pawnValue.toLocaleString()}`,
        confidence: `${Math.round(primary.confidence * 100)}%`,
        dataPoints: primary.dataPoints,
        source: primary.source.toUpperCase(),
        note: primary.note
      },
      aggregated: {
        marketValue: `$${aggregated.marketValue.toLocaleString()}`,
        pawnValue: `$${aggregated.pawnValue.toLocaleString()}`,
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
        marketValue: `$${rate.marketValue.toLocaleString()}`,
        pawnValue: `$${rate.pawnValue.toLocaleString()}`,
        confidence: `${Math.round(rate.confidence * 100)}%`,
        dataPoints: rate.dataPoints,
        note: rate.note
      }))
    };
  }
}

export const marketplaceService = new MarketplaceService();
