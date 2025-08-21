const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testPerformanceImprovements() {
  console.log('🚀 Testing Performance Improvements...\n');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  const performanceTests = [
    {
      name: 'Health Check (Baseline)',
      endpoint: '/health',
      expectedMaxTime: 100,
      description: 'Basic health check response time'
    },
    {
      name: 'eBay Search - First Request (Cache Miss)',
      endpoint: '/api/ebay/search/iPhone',
      expectedMaxTime: 5000,
      description: 'First search request (should be slower)'
    },
    {
      name: 'eBay Search - Second Request (Cache Hit)',
      endpoint: '/api/ebay/search/iPhone',
      expectedMaxTime: 200,
      description: 'Second search request (should be much faster)'
    },
    {
      name: 'eBay Estimate - First Request (Cache Miss)',
      endpoint: '/api/ebay/estimate/iPhone',
      expectedMaxTime: 5000,
      description: 'First estimate request (should be slower)'
    },
    {
      name: 'eBay Estimate - Second Request (Cache Hit)',
      endpoint: '/api/ebay/estimate/iPhone',
      expectedMaxTime: 200,
      description: 'Second estimate request (should be much faster)'
    },
    {
      name: 'Marketplace Quick Search',
      endpoint: '/api/marketplace/quick/laptop',
      expectedMaxTime: 3000,
      description: 'Marketplace search response time'
    },
    {
      name: 'Cache Statistics',
      endpoint: '/api/ebay/cache/stats',
      expectedMaxTime: 100,
      description: 'Cache statistics endpoint'
    }
  ];

  const results = [];

  for (const test of performanceTests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   ${test.endpoint}`);
    
    const times = [];
    const numTests = 3; // Run each test 3 times for average

    for (let i = 0; i < numTests; i++) {
      const startTime = Date.now();

      try {
        const response = await axios({
          method: 'GET',
          url: `${BASE_URL}${test.endpoint}`,
          timeout: 30000,
          validateStatus: () => true
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        times.push(responseTime);

        const statusIcon = response.status === 200 ? '✅' : '⚠️';
        const cachedIcon = response.data && response.data.cached ? '📦' : '🆕';
        
        console.log(`   ${statusIcon}${cachedIcon} Test ${i + 1}: ${responseTime}ms (Status: ${response.status})`);

        if (response.data && response.data.cached !== undefined) {
          console.log(`      Cache: ${response.data.cached ? 'HIT' : 'MISS'}`);
        }

      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        times.push(responseTime);

        console.log(`   ❌ Test ${i + 1}: ${responseTime}ms (Error: ${error.message})`);
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate statistics
    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const isAcceptable = avgTime <= test.expectedMaxTime;

    const performanceIcon = isAcceptable ? '✅' : '⚠️';

    console.log(`   📊 Average: ${avgTime}ms (Min: ${minTime}ms, Max: ${maxTime}ms)`);
    console.log(`   ${performanceIcon} Performance: ${isAcceptable ? 'Acceptable' : 'Needs Optimization'} (Expected: ≤${test.expectedMaxTime}ms)`);

    results.push({
      name: test.name,
      endpoint: test.endpoint,
      avgTime,
      minTime,
      maxTime,
      expectedMaxTime: test.expectedMaxTime,
      isAcceptable,
      description: test.description
    });

    console.log('');
  }

  // Test cache statistics
  console.log('📊 Cache Performance Analysis...\n');

  try {
    const cacheStatsResponse = await axios.get(`${BASE_URL}/api/ebay/cache/stats`);
    const cacheStats = cacheStatsResponse.data.data;

    console.log('📦 Cache Statistics:');
    console.log(`   Hits: ${cacheStats.hits}`);
    console.log(`   Misses: ${cacheStats.misses}`);
    console.log(`   Hit Rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`);
    console.log(`   Total Keys: ${cacheStats.keys}`);
    console.log(`   Sets: ${cacheStats.sets}`);
    console.log(`   Deletes: ${cacheStats.deletes}`);

    if (cacheStats.hitRate > 0.5) {
      console.log('   ✅ Cache is working effectively!');
    } else {
      console.log('   ⚠️ Cache hit rate could be improved');
    }

  } catch (error) {
    console.log('   ❌ Failed to get cache statistics');
  }

  console.log('');

  // Summary
  console.log('🎯 Performance Testing Summary');
  console.log('=' .repeat(50));
  
  const acceptableTests = results.filter(r => r.isAcceptable).length;
  const totalTests = results.length;

  console.log(`📊 Performance Score: ${acceptableTests}/${totalTests} tests meeting targets (${Math.round(acceptableTests/totalTests*100)}%)`);

  console.log('\n📈 Detailed Results:');
  results.forEach(result => {
    const icon = result.isAcceptable ? '✅' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.avgTime}ms (target: ≤${result.expectedMaxTime}ms)`);
  });

  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  
  const slowEndpoints = results.filter(r => !r.isAcceptable);
  if (slowEndpoints.length > 0) {
    console.log('🔧 Endpoints needing optimization:');
    slowEndpoints.forEach(endpoint => {
      console.log(`   ⚠️ ${endpoint.name}: ${endpoint.avgTime}ms vs ${endpoint.expectedMaxTime}ms target`);
      console.log(`      Recommendations:`);
      if (endpoint.avgTime > 5000) {
        console.log(`        - Implement caching for this endpoint`);
        console.log(`        - Optimize database queries`);
        console.log(`        - Consider async processing`);
      }
      if (endpoint.avgTime > 3000) {
        console.log(`        - Add response compression`);
        console.log(`        - Optimize external API calls`);
      }
      console.log('');
    });
  } else {
    console.log('🎉 All endpoints are performing well!');
  }

  // Cache recommendations
  console.log('📦 Cache Optimization Recommendations:');
  console.log('   - Monitor cache hit rates regularly');
  console.log('   - Adjust TTL values based on data freshness requirements');
  console.log('   - Implement cache warming for popular searches');
  console.log('   - Consider Redis for distributed caching');
  console.log('   - Add cache invalidation strategies');

  // Overall recommendations
  console.log('\n🚀 Overall Performance Recommendations:');
  console.log('   - Implement response compression (gzip)');
  console.log('   - Add database query optimization');
  console.log('   - Consider CDN for static assets');
  console.log('   - Implement request batching where possible');
  console.log('   - Add performance monitoring and alerting');
  console.log('   - Regular performance audits and optimization');
}

testPerformanceImprovements().catch(console.error);
