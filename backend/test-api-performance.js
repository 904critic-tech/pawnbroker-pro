const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testAPIPerformance() {
  console.log('🚀 PawnBroker Pro API Performance Testing...\n');

  const performanceTests = [
    {
      name: 'Health Check (Fast)',
      endpoint: '/health',
      expectedMaxTime: 100
    },
    {
      name: 'Stats Health Check',
      endpoint: '/api/stats/health',
      expectedMaxTime: 200
    },
    {
      name: 'eBay Health Check',
      endpoint: '/api/ebay/health',
      expectedMaxTime: 200
    },
    {
      name: 'eBay Search (iPhone)',
      endpoint: '/api/ebay/search/iPhone',
      expectedMaxTime: 5000
    },
    {
      name: 'eBay Estimate (iPhone)',
      endpoint: '/api/ebay/estimate/iPhone',
      expectedMaxTime: 5000
    },
    {
      name: 'Marketplace Quick (laptop)',
      endpoint: '/api/marketplace/quick/laptop',
      expectedMaxTime: 3000
    },
    {
      name: 'Marketplace Comprehensive (laptop)',
      endpoint: '/api/marketplace/comprehensive/laptop',
      expectedMaxTime: 8000
    }
  ];

  const results = [];

  for (const test of performanceTests) {
    console.log(`🧪 Testing Performance: ${test.name}`);
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
        console.log(`   ${statusIcon} Test ${i + 1}: ${responseTime}ms (Status: ${response.status})`);
        
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        times.push(responseTime);
        
        console.log(`   ❌ Test ${i + 1}: ${responseTime}ms (Error: ${error.message})`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
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
      isAcceptable
    });
    
    console.log('');
  }

  // Summary
  console.log('🎯 Performance Testing Summary');
  console.log('=' .repeat(50));
  
  const acceptableTests = results.filter(r => r.isAcceptable).length;
  const totalTests = results.length;
  
  console.log(`📊 Performance Score: ${acceptableTests}/${totalTests} tests meeting performance targets (${Math.round(acceptableTests/totalTests*100)}%)`);
  
  console.log('\n📈 Detailed Results:');
  results.forEach(result => {
    const icon = result.isAcceptable ? '✅' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.avgTime}ms (target: ≤${result.expectedMaxTime}ms)`);
  });
  
  // Identify optimization opportunities
  const slowEndpoints = results.filter(r => !r.isAcceptable);
  if (slowEndpoints.length > 0) {
    console.log('\n🔧 Optimization Opportunities:');
    slowEndpoints.forEach(endpoint => {
      console.log(`   ⚠️ ${endpoint.name}: ${endpoint.avgTime}ms vs ${endpoint.expectedMaxTime}ms target`);
      console.log(`      Endpoint: ${endpoint.endpoint}`);
      console.log(`      Recommendations:`);
      if (endpoint.avgTime > 5000) {
        console.log(`        - Consider caching for frequently requested data`);
        console.log(`        - Optimize database queries`);
        console.log(`        - Implement request batching`);
      }
      if (endpoint.avgTime > 3000) {
        console.log(`        - Add response compression`);
        console.log(`        - Optimize external API calls`);
      }
      console.log('');
    });
  }
  
  // Performance recommendations
  console.log('💡 General Performance Recommendations:');
  console.log('   - Implement Redis caching for frequently accessed data');
  console.log('   - Add database query optimization and indexing');
  console.log('   - Consider CDN for static assets');
  console.log('   - Implement request rate limiting and throttling');
  console.log('   - Add response compression middleware');
  console.log('   - Monitor and optimize external API calls');
  console.log('   - Consider implementing request queuing for heavy operations');
}

testAPIPerformance().catch(console.error);
