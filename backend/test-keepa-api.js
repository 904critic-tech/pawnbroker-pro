const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testKeepaAPI() {
  console.log('🔍 Testing Keepa API Integration...\n');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  const tests = [
    {
      name: 'Keepa Health Check',
      endpoint: '/api/keepa/health',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Keepa Domains',
      endpoint: '/api/keepa/domains',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Keepa Token Status',
      endpoint: '/api/keepa/token',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Keepa Search - iPhone',
      endpoint: '/api/keepa/search/iPhone',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Keepa Search - Laptop',
      endpoint: '/api/keepa/search/laptop',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Keepa Categories',
      endpoint: '/api/keepa/categories',
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
    console.log('\n🎉 All Keepa API tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }

  // Additional information
  console.log('\n📋 Keepa API Information:');
  console.log('• Free Tier: 100 requests/day');
  console.log('• Paid Tier: $0.01 per request');
  console.log('• Documentation: https://keepa.com/#!api');
  console.log('• Sign up: https://keepa.com/#!signup');
}

testKeepaAPI().catch(console.error);
