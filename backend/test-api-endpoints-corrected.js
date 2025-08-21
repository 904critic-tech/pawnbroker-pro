const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testAPIEndpoints() {
  console.log('🔍 Testing PawnBroker Pro API Endpoints (Corrected)...\n');

  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      endpoint: '/health',
      expectedStatus: 200
    },
    {
      name: 'Stats Health Check',
      method: 'GET', 
      endpoint: '/api/stats/health',
      expectedStatus: 200
    },
    {
      name: 'User Stats (without auth)',
      method: 'GET',
      endpoint: '/api/stats/user',
      expectedStatus: 401 // Should require authentication
    },
    {
      name: 'Market Data Search',
      method: 'GET',
      endpoint: '/api/market/search?query=iPhone',
      expectedStatus: 401 // Should require authentication
    },
    {
      name: 'Image Recognition Health',
      method: 'GET',
      endpoint: '/api/images/health',
      expectedStatus: 200
    },
    {
      name: 'eBay Scraper Test (Corrected)',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone',
      expectedStatus: 200
    },
    {
      name: 'eBay Health Check',
      method: 'GET',
      endpoint: '/api/ebay/health',
      expectedStatus: 200
    },
    {
      name: 'Marketplace Comprehensive (Corrected)',
      method: 'GET',
      endpoint: '/api/marketplace/comprehensive/laptop',
      expectedStatus: 200
    },
    {
      name: 'Marketplace Quick (Corrected)',
      method: 'GET',
      endpoint: '/api/marketplace/quick/laptop',
      expectedStatus: 200
    },
    {
      name: 'Amazon Search Test',
      method: 'GET',
      endpoint: '/api/amazon/search?query=iPhone',
      expectedStatus: 200
    },
    {
      name: 'CamelCamelCamel Test',
      method: 'GET',
      endpoint: '/api/camelcamelcamel/search?query=iPhone',
      expectedStatus: 200
    }
  ];

  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.endpoint}`,
        timeout: 15000,
        validateStatus: () => true // Don't throw on any status code
      });

      const statusMatch = response.status === test.expectedStatus;
      const statusIcon = statusMatch ? '✅' : '⚠️';
      
      console.log(`   ${statusIcon} Status: ${response.status} (expected: ${test.expectedStatus})`);
      
      if (response.data) {
        if (typeof response.data === 'object') {
          console.log(`   📊 Response: ${JSON.stringify(response.data).substring(0, 300)}...`);
        } else {
          console.log(`   📊 Response: ${response.data.substring(0, 300)}...`);
        }
      }

      if (!statusMatch) {
        console.log(`   ⚠️ Status mismatch - this might be expected behavior`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Error Response: ${JSON.stringify(error.response.data).substring(0, 300)}...`);
      }
    }
    
    console.log('');
  }

  // Test error handling
  console.log('🔍 Testing Error Handling...\n');
  
  const errorTests = [
    {
      name: 'Invalid Endpoint',
      method: 'GET',
      endpoint: '/api/nonexistent',
      expectedStatus: 404
    },
    {
      name: 'Invalid Search Query (Empty)',
      method: 'GET', 
      endpoint: '/api/ebay/search/',
      expectedStatus: 404
    },
    {
      name: 'Missing Required Parameters',
      method: 'POST',
      endpoint: '/api/images/recognize',
      expectedStatus: 401 // Should require auth
    }
  ];

  for (const test of errorTests) {
    console.log(`🧪 Testing Error: ${test.name}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.endpoint}`,
        timeout: 5000,
        validateStatus: () => true
      });

      const statusMatch = response.status === test.expectedStatus;
      const statusIcon = statusMatch ? '✅' : '⚠️';
      
      console.log(`   ${statusIcon} Status: ${response.status} (expected: ${test.expectedStatus})`);
      
      if (response.data && typeof response.data === 'object') {
        console.log(`   📊 Error Response: ${JSON.stringify(response.data).substring(0, 300)}...`);
      }

    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 Corrected API Testing Complete!');
}

testAPIEndpoints().catch(console.error);
