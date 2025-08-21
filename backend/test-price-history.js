const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testPriceHistoryService() {
  console.log('📊 Testing Price History Service...\n');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  const tests = [
    {
      name: 'Price History Health Check',
      endpoint: '/api/price-history/health',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Price History Sources',
      endpoint: '/api/price-history/sources',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Price History for iPhone',
      endpoint: '/api/price-history/iPhone',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Price History with Trend for iPhone',
      endpoint: '/api/price-history/iPhone?trend=true',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Price Trend Analysis for iPhone',
      endpoint: '/api/price-history/trend/iPhone',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Price History for Laptop',
      endpoint: '/api/price-history/laptop',
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
        timeout: 10000
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.status === test.expectedStatus) {
        console.log(`✅ PASSED - ${test.name}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response Time: ${responseTime}ms`);
        
        if (response.data && response.data.success) {
          console.log(`   Data: ${JSON.stringify(response.data.data, null, 2).substring(0, 200)}...`);
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
    console.log('\n🎉 All price history tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
}

testPriceHistoryService().catch(console.error);
