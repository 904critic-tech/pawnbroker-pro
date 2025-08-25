const eBayScraper = require('./eBayScraper');
const eBayAPIService = require('./eBayAPIService');
const FacebookMarketplaceScraper = require('./FacebookMarketplaceScraper');
const CraigslistScraper = require('./CraigslistScraper');
const OfferUpScraper = require('./OfferUpScraper');
const MercariScraper = require('./MercariScraper');
const CamelCamelCamelScraper = require('./CamelCamelCamelScraper');
const SpecializedPriceGuides = require('./SpecializedPriceGuides');
const AmazonAPIService = require('./AmazonAPIService');

class MarketDataAggregatorService {
  constructor() {
    this.sources = {
      ebay: eBayScraper,
      ebayApi: eBayAPIService,
      facebook: FacebookMarketplaceScraper,
      craigslist: CraigslistScraper,
      offerup: OfferUpScraper,
      mercari: MercariScraper,
      camelcamelcamel: CamelCamelCamelScraper,
      specialized: SpecializedPriceGuides,
      amazon: AmazonAPIService
    };
  }

  /**
   * Get comprehensive market data from all sources
   */
  async getComprehensiveMarketData(query) {
    console.log(`🔍 Getting comprehensive market data for: ${query}`);
    
    const results = {
      query,
      primarySource: 'ebay',
      sources: {},
      aggregatedData: null,
      lastUpdated: new Date().toISOString()
    };

    // Get data from all sources in parallel
    const promises = Object.entries(this.sources).map(async ([sourceName, scraper]) => {
      try {
        console.log(`📊 Fetching data from ${sourceName}...`);
        
        if (sourceName === 'camelcamelcamel') {
          // CamelCamelCamel provides price history, not sold data
          const priceData = await scraper.getProductPriceData(query);
          return { sourceName, data: priceData, type: 'price_history' };
        } else {
          // All other sources provide sold/listing data
          const estimate = await scraper.getPricingEstimate(query);
          return { sourceName, data: estimate, type: 'market_data' };
        }
      } catch (error) {
        console.log(`⚠️  ${sourceName} failed: ${error.message}`);
        return { sourceName, data: null, error: error.message };
      }
    });

    const sourceResults = await Promise.allSettled(promises);
    
    // Process results
    sourceResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { sourceName, data, type, error } = result.value;
        if (data) {
          results.sources[sourceName] = {
            type,
            data,
            status: 'success'
          };
        } else {
          results.sources[sourceName] = {
            status: 'error',
            error
          };
        }
      } else {
        const sourceName = Object.keys(this.sources)[index];
        results.sources[sourceName] = {
          status: 'error',
          error: result.reason.message
        };
      }
    });

    // Aggregate the data with eBay as primary source
    results.aggregatedData = this.aggregateMarketData(results.sources, query);
    
    return results;
  }

  /**
   * Aggregate market data from all sources
   */
  aggregateMarketData(sources, query) {
    // Prioritize eBay API over scraper
    const ebayApiData = sources.ebayApi?.data;
    const ebayScraperData = sources.ebay?.data;
    const ebayScraperType = sources.ebay?.type;
    const marketDataSources = ['facebook', 'craigslist', 'offerup', 'mercari'];
    
    // Use eBay API as primary source, fallback to scraper
    let primaryMarketValue = 0;
    let primaryPawnValue = 0;
    let primaryConfidence = 0;
    let primaryDataPoints = 0;
    let primaryPriceRange = { min: 0, max: 0 };
    let primarySource = 'ebay-api';

    // Debug logging for troubleshooting
    console.log('🔍 eBay API data available:', !!ebayApiData);
    console.log('🔍 eBay Scraper data available:', !!ebayScraperData);
    console.log('🔍 eBay Scraper type:', ebayScraperType);
    
    if (ebayApiData && ebayApiData.type === 'market_data') {
      // eBay API returns data directly, not wrapped in a 'data' property
      primaryMarketValue = ebayApiData.marketValue;
      primaryPawnValue = ebayApiData.pawnValue;
      primaryConfidence = ebayApiData.confidence;
      primaryDataPoints = ebayApiData.dataPoints;
      primaryPriceRange = ebayApiData.priceRange;
      primarySource = 'ebay-api';
      console.log('✅ Using eBay API as primary source');
    } else if (ebayScraperData && ebayScraperType === 'market_data') {
      // eBay scraper data is the actual data (no extra 'data' wrapper)
      primaryMarketValue = ebayScraperData.marketValue;
      primaryPawnValue = ebayScraperData.pawnValue;
      primaryConfidence = ebayScraperData.confidence;
      primaryDataPoints = ebayScraperData.dataPoints;
      primaryPriceRange = ebayScraperData.priceRange;
      primarySource = 'ebay-scraper';
      console.log('✅ Using eBay Scraper as primary source - Market Value:', primaryMarketValue);
    } else {
      console.log('❌ No valid eBay data found');
    }

    // Collect "possible market rate" data from other sources
    const possibleMarketRates = [];
    
    marketDataSources.forEach(sourceName => {
      const sourceData = sources[sourceName];
      if (sourceData?.data && sourceData.data.type === 'market_data') {
        // Handle both wrapped and direct data structures
        const marketData = sourceData.data.data || sourceData.data;
        possibleMarketRates.push({
          source: sourceName,
          marketValue: marketData.marketValue,
          pawnValue: marketData.pawnValue,
          confidence: marketData.confidence,
          dataPoints: marketData.dataPoints,
          priceRange: marketData.priceRange,
          note: this.getSourceNote(sourceName)
        });
      }
    });

    // Calculate aggregated statistics
    const allMarketValues = [primaryMarketValue, ...possibleMarketRates.map(r => r.marketValue)].filter(v => v > 0);
    const allPawnValues = [primaryPawnValue, ...possibleMarketRates.map(r => r.pawnValue)].filter(v => v > 0);
    
    const aggregatedMarketValue = allMarketValues.length > 0 ? 
      Math.round(allMarketValues.reduce((sum, val) => sum + val, 0) / allMarketValues.length) : 0;
    
    const aggregatedPawnValue = allPawnValues.length > 0 ? 
      Math.round(allPawnValues.reduce((sum, val) => sum + val, 0) / allPawnValues.length) : 0;

    // Calculate overall confidence based on data availability
    const totalDataPoints = primaryDataPoints + possibleMarketRates.reduce((sum, r) => sum + r.dataPoints, 0);
    const overallConfidence = Math.min(0.95, 0.5 + (totalDataPoints * 0.01));

    return {
      // Primary market data (eBay)
      primaryMarketData: {
        marketValue: primaryMarketValue,
        pawnValue: primaryPawnValue,
        confidence: primaryConfidence,
        dataPoints: primaryDataPoints,
        priceRange: primaryPriceRange,
        source: primarySource,
        note: this.getSourceNote(primarySource)
      },
      
      // Possible market rates from other sources
      possibleMarketRates,
      
      // Aggregated data
      aggregatedData: {
        marketValue: aggregatedMarketValue,
        pawnValue: aggregatedPawnValue,
        confidence: Math.round(overallConfidence * 100) / 100,
        totalDataPoints,
        sourcesUsed: Object.keys(sources).filter(s => sources[s]?.status === 'success').length,
        note: 'Combined data from multiple marketplaces'
      },
      
      // Price history from CamelCamelCamel
      priceHistory: sources.camelcamelcamel?.data || null,
      
      // Summary
      summary: {
        primarySource: primarySource,
        possibleMarketRateSources: possibleMarketRates.map(r => r.source),
        totalSources: Object.keys(sources).filter(s => sources[s]?.status === 'success').length,
        recommendation: this.generateRecommendation(primaryConfidence, possibleMarketRates.length)
      }
    };
  }

  /**
   * Get source-specific notes for data quality
   */
  getSourceNote(sourceName) {
    const notes = {
      'ebay-api': 'Official eBay API - sold listings data',
      'ebay-scraper': 'eBay web scraping - sold listings data',
      facebook: 'Local marketplace data - prices may vary by location',
      craigslist: 'Local classified ads - prices may vary by location',
      offerup: 'Mobile marketplace data - prices may vary by location',
      mercari: 'Popular resale platform - prices may reflect current market trends'
    };
    return notes[sourceName] || 'Marketplace data';
  }

  /**
   * Generate recommendation based on data quality
   */
  generateRecommendation(primaryConfidence, additionalSources) {
    if (primaryConfidence >= 0.8 && additionalSources >= 2) {
      return 'High confidence - Multiple sources confirm pricing';
    } else if (primaryConfidence >= 0.7 && additionalSources >= 1) {
      return 'Good confidence - Primary source with supporting data';
    } else if (primaryConfidence >= 0.6) {
      return 'Moderate confidence - Primary source only';
    } else {
      return 'Low confidence - Limited data available';
    }
  }

  /**
   * Get quick market estimate (eBay API first, then scraper)
   */
  async getQuickMarketEstimate(query) {
    try {
      // Try eBay API first
      console.log(`🔍 Trying eBay API for quick estimate: ${query}`);
      const ebayApiData = await this.sources.ebayApi.getPricingEstimate(query);
      return {
        query,
        marketValue: ebayApiData.marketValue,
        pawnValue: ebayApiData.pawnValue,
        confidence: ebayApiData.confidence,
        dataPoints: ebayApiData.dataPoints || 0,
        priceRange: ebayApiData.priceRange || { min: 0, max: 0, avg: 0 },
        recentSales: ebayApiData.recentSales || [],
        source: 'ebay-api',
        note: 'Quick estimate from eBay API - sold listings data',
        lastUpdated: new Date().toISOString()
      };
    } catch (apiError) {
      console.log(`⚠️  eBay API failed for "${query}": ${apiError.message}`);
      
      // Fallback to eBay scraper
      try {
        console.log(`🔄 Falling back to eBay scraper for: ${query}`);
        const ebayData = await this.sources.ebay.getPricingEstimate(query);
        return {
          query,
          marketValue: ebayData.marketValue,
          pawnValue: ebayData.pawnValue,
          confidence: ebayData.confidence,
          dataPoints: ebayData.dataPoints || 0,
          priceRange: ebayData.priceRange || { min: 0, max: 0, avg: 0 },
          recentSales: ebayData.recentSales || [],
          source: 'ebay-scraper',
          note: 'Quick estimate from eBay scraper - sold listings data',
          lastUpdated: new Date().toISOString()
        };
      } catch (scraperError) {
        console.log(`⚠️  eBay scraper also failed for "${query}": ${scraperError.message}`);
        
        // Try alternative search terms if both fail
        const alternativeTerms = this.generateAlternativeSearchTerms(query);
        
        for (const altTerm of alternativeTerms) {
          try {
            console.log(`🔄 Trying alternative search term: "${altTerm}"`);
            const ebayData = await this.sources.ebay.getPricingEstimate(altTerm);
            return {
              query,
              marketValue: ebayData.marketValue,
              pawnValue: ebayData.pawnValue,
              confidence: ebayData.confidence * 0.8, // Reduce confidence for alternative terms
              dataPoints: ebayData.dataPoints || 0,
              priceRange: ebayData.priceRange || { min: 0, max: 0, avg: 0 },
              recentSales: ebayData.recentSales || [],
              source: 'ebay-scraper',
              note: `Quick estimate using alternative search term: "${altTerm}"`,
              lastUpdated: new Date().toISOString()
            };
          } catch (altError) {
            console.log(`⚠️  Alternative term "${altTerm}" also failed: ${altError.message}`);
          }
        }
        
        // If all eBay attempts fail, try specialized pricing guides
        console.log(`🔄 Trying specialized pricing guides for: "${query}"`);
        try {
          const specializedData = await this.sources.specialized.getSpecializedPricing(query);
          if (specializedData && specializedData.marketValue > 0) {
            return {
              query,
              marketValue: specializedData.marketValue,
              pawnValue: specializedData.pawnValue,
              confidence: specializedData.confidence,
              dataPoints: specializedData.dataPoints,
              priceRange: specializedData.priceRange,
              source: specializedData.source,
              note: specializedData.note,
              lastUpdated: new Date().toISOString()
            };
          }
        } catch (specializedError) {
          console.log(`⚠️  Specialized pricing also failed: ${specializedError.message}`);
        }

        // If all attempts fail, return a fallback response
        return {
          query,
          marketValue: 0,
          pawnValue: 0,
          confidence: 0,
          dataPoints: 0,
          priceRange: { min: 0, max: 0, avg: 0 },
          source: 'ebay',
          note: 'No sold items found on eBay or specialized sources. Try a different search term or check spelling.',
          lastUpdated: new Date().toISOString()
        };
      }
    }
  }

  /**
   * Generate alternative search terms when primary search fails
   */
  generateAlternativeSearchTerms(query) {
    const terms = [];
    
    // Remove common words that might interfere with search
    const cleanQuery = query.replace(/\b(pro|max|mini|plus|ultra|se)\b/gi, '').trim();
    if (cleanQuery !== query) {
      terms.push(cleanQuery);
    }
    
    // Try without brand names for electronics
    const withoutBrand = query.replace(/\b(apple|samsung|google|sony|lg|nike|adidas)\b/gi, '').trim();
    if (withoutBrand !== query && withoutBrand.length > 2) {
      terms.push(withoutBrand);
    }
    
    // Try with common variations
    if (query.toLowerCase().includes('iphone')) {
      terms.push(query.replace(/iphone/i, 'iPhone'));
      terms.push(query.replace(/iphone/i, 'phone'));
    }
    
    // Limit to 3 alternatives to avoid too many requests
    return terms.slice(0, 3);
  }
}

module.exports = new MarketDataAggregatorService();
