const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    // Initialize in-memory cache with 5 minutes default TTL
    this.cache = new NodeCache({ 
      stdTTL: 300, // 5 minutes
      checkperiod: 60, // Check for expired keys every minute
      useClones: false // Don't clone objects for better performance
    });

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    console.log('✅ CacheService initialized successfully');
  }

  // Get value from cache
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      console.log(`📦 Cache HIT: ${key}`);
      return value;
    } else {
      this.stats.misses++;
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }
  }

  // Set value in cache
  set(key, value, ttl = 300) {
    this.cache.set(key, value, ttl);
    this.stats.sets++;
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
  }

  // Delete value from cache
  delete(key) {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      this.stats.deletes++;
      console.log(`🗑️ Cache DELETE: ${key}`);
    }
    return deleted > 0;
  }

  // Clear all cache
  clear() {
    this.cache.flushAll();
    console.log('🧹 Cache cleared');
  }

  // Get cache statistics
  getStats() {
    const cacheStats = this.cache.getStats();
    return {
      ...this.stats,
      keys: cacheStats.keys,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  // Generate cache key for search queries
  generateSearchKey(query, limit = 25) {
    return `search:${query.toLowerCase().trim()}:${limit}`;
  }

  // Generate cache key for pricing estimates
  generateEstimateKey(query) {
    return `estimate:${query.toLowerCase().trim()}`;
  }

  // Generate cache key for marketplace data
  generateMarketplaceKey(query, type = 'quick') {
    return `marketplace:${type}:${query.toLowerCase().trim()}`;
  }

  // Generate cache key for image recognition
  generateImageKey(imageHash) {
    return `image:${imageHash}`;
  }

  // Cache search results
  cacheSearchResults(query, results, limit = 25) {
    const key = this.generateSearchKey(query, limit);
    this.set(key, results, 600); // 10 minutes TTL for search results
  }

  // Get cached search results
  getCachedSearchResults(query, limit = 25) {
    const key = this.generateSearchKey(query, limit);
    return this.get(key);
  }

  // Cache pricing estimate
  cachePricingEstimate(query, estimate) {
    const key = this.generateEstimateKey(query);
    this.set(key, estimate, 900); // 15 minutes TTL for pricing estimates
  }

  // Get cached pricing estimate
  getCachedPricingEstimate(query) {
    const key = this.generateEstimateKey(query);
    return this.get(key);
  }

  // Cache marketplace data
  cacheMarketplaceData(query, data, type = 'quick') {
    const key = this.generateMarketplaceKey(query, type);
    this.set(key, data, 600); // 10 minutes TTL for marketplace data
  }

  // Get cached marketplace data
  getCachedMarketplaceData(query, type = 'quick') {
    const key = this.generateMarketplaceKey(query, type);
    return this.get(key);
  }

  // Cache image recognition results
  cacheImageRecognition(imageHash, results) {
    const key = this.generateImageKey(imageHash);
    this.set(key, results, 1800); // 30 minutes TTL for image recognition
  }

  // Get cached image recognition results
  getCachedImageRecognition(imageHash) {
    const key = this.generateImageKey(imageHash);
    return this.get(key);
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => this.delete(key));
    console.log(`🔄 Cache invalidated ${matchingKeys.length} keys matching pattern: ${pattern}`);
  }

  // Warm up cache with popular searches
  async warmupCache() {
    const popularSearches = [
      'iPhone',
      'laptop',
      'gold',
      'diamond',
      'watch',
      'guitar',
      'camera',
      'tablet'
    ];

    console.log('🔥 Warming up cache with popular searches...');
    
    for (const search of popularSearches) {
      // This would typically fetch from the actual services
      // For now, we'll just log the warmup
      console.log(`🔥 Cache warmup: ${search}`);
    }

    console.log('✅ Cache warmup completed');
  }

  // Health check for cache service
  healthCheck() {
    try {
      const stats = this.getStats();
      return {
        status: 'healthy',
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
module.exports = new CacheService();
