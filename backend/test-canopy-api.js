const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testCanopyAPI() {
  console.log('🔍 Testing Canopy API Integration...\n');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  const tests = [
    {
      name: 'Canopy API Health Check',
      endpoint: '/api/canopy/health',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Canopy API Info',
      endpoint: '/api/canopy/info',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Canopy API Test (Sample ASIN)',
      endpoint: '/api/canopy/test',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Canopy API Search - iPhone',
      endpoint: '/api/canopy/search/iPhone',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Canopy API Search - Laptop',
      endpoint: '/api/canopy/search/laptop',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Canopy API Product Details - Sample ASIN',
      endpoint: '/api/canopy/product/B0D1XD1ZV3',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Canopy API Price History - Sample ASIN',
      endpoint: '/api/canopy/price-history/B0D1XD1ZV3',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Canopy API Reviews - Sample ASIN',
      endpoint: '/api/canopy/reviews/B0D1XD1ZV3',
      method: 'GET',
      expectedStatus: 200
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      const startTime = Date.now();
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.endpoint}`,
        timeout: 15000
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.status === test.expectedStatus) {
        console.log(`✅ PASSED - ${test.name}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response Time: ${responseTime}ms`);
        
        if (response.data && response.data.success) {
          const data = response.data.data;
          if (Array.isArray(data)) {
            console.log(`   Data: ${data.length} items returned`);
          } else if (typeof data === 'object') {
            console.log(`   Data: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
          }
        }
        
        passedTests++;
      } else {
        console.log(`❌ FAILED - ${test.name}`);
        console.log(`   Expected: ${test.expectedStatus}, Got: ${response.status}`);
      }

    } catch (error) {
      console.log(`❌ FAILED - ${test.name}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.message || error.message}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All Canopy API tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }

  // Additional information
  console.log('\n📋 Canopy API Information:');
  console.log('• Base URL: https://graphql.canopyapi.co');
  console.log('• Type: GraphQL API');
  console.log('• Features: Product search, details, price history, reviews');
  console.log('• Rate Limits: 50 requests/15min, 1000 requests/hour');
  console.log('• Documentation: https://canopyapi.co/docs');
  console.log('• Next Step: Get API key from Canopy API');
}

testCanopyAPI().catch(console.error);
