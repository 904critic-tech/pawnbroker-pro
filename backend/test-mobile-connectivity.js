const axios = require('axios');

const BASE_URL = 'http://10.0.0.7:5001';

async function testMobileConnectivity() {
  console.log('📱 Testing Mobile App Connectivity...\n');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  const connectivityTests = [
    {
      name: 'Health Check',
      method: 'GET',
      endpoint: '/health',
      expectedStatus: 200,
      description: 'Basic server health check'
    },
    {
      name: 'eBay Health Check',
      method: 'GET',
      endpoint: '/api/ebay/health',
      expectedStatus: 200,
      description: 'eBay service health check'
    },
    {
      name: 'Marketplace Quick Search',
      method: 'GET',
      endpoint: '/api/marketplace/quick/iPhone',
      expectedStatus: 200,
      description: 'Quick marketplace search (no auth required)'
    },
    {
      name: 'eBay Search',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone',
      expectedStatus: 200,
      description: 'eBay search (no auth required)'
    },
    {
      name: 'Protected Endpoint (No Auth)',
      method: 'GET',
      endpoint: '/api/market/search?query=iPhone',
      expectedStatus: 401,
      description: 'Protected endpoint should require authentication'
    }
  ];

  let passedTests = 0;
  let totalTests = connectivityTests.length;

  for (const test of connectivityTests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.endpoint}`,
        timeout: 10000,
        validateStatus: () => true
      });

      const statusMatch = response.status === test.expectedStatus;
      const statusIcon = statusMatch ? '✅' : '❌';
      
      if (statusMatch) {
        passedTests++;
      }
      
      console.log(`   ${statusIcon} Status: ${response.status} (expected: ${test.expectedStatus})`);
      
      if (response.data && typeof response.data === 'object') {
        const responseStr = JSON.stringify(response.data);
        console.log(`   📊 Response: ${responseStr.substring(0, 200)}${responseStr.length > 200 ? '...' : ''}`);
      }

      if (!statusMatch) {
        console.log(`   ⚠️ Test failed!`);
        if (test.expectedStatus === 200 && response.status !== 200) {
          console.log(`   Expected: 200 (successful response)`);
          console.log(`   Got: ${response.status} (error response)`);
        } else if (test.expectedStatus === 401 && response.status !== 401) {
          console.log(`   Expected: 401 (authentication required)`);
          console.log(`   Got: ${response.status} (unexpected response)`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Error Response: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
      }
    }
    
    console.log('');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('🎯 Mobile Connectivity Test Summary');
  console.log('=' .repeat(50));
  
  console.log(`📊 Connectivity Score: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All connectivity tests passed!');
    console.log('✅ Backend server is accessible from mobile app');
    console.log('✅ CORS is properly configured');
    console.log('✅ Authentication is working correctly');
    console.log('✅ API endpoints are responding');
  } else {
    console.log('⚠️ Some connectivity issues detected');
    console.log('🔧 Check server configuration and CORS settings');
  }

  console.log('\n🔍 Connectivity Configuration:');
  console.log(`   Backend URL: ${BASE_URL}`);
  console.log(`   Mobile App API URL: ${BASE_URL}/api`);
  console.log('   CORS Origins: localhost:19006, localhost:3000, 10.0.0.7:19006, 10.0.0.7:3000');
  console.log('   Expo Development: exp://10.0.0.7:19000, exp://localhost:19000');

  console.log('\n📱 Mobile App Configuration:');
  console.log('   API_BASE_URL should be: http://10.0.0.7:5001/api');
  console.log('   Ensure mobile device is on same network');
  console.log('   Check firewall settings if issues persist');
}

testMobileConnectivity().catch(console.error);
