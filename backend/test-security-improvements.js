const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testSecurityImprovements() {
  console.log('🔒 Testing Security Improvements...\n');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  const securityTests = [
    // Test SQL Injection protection
    {
      name: 'SQL Injection - Single Quote (Should be blocked)',
      method: 'GET',
      endpoint: '/api/ebay/search/\' OR 1=1--',
      expectedStatus: 400,
      category: 'SQL Injection'
    },
    {
      name: 'SQL Injection - Union (Should be blocked)',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone UNION SELECT * FROM users',
      expectedStatus: 400,
      category: 'SQL Injection'
    },

    // Test XSS protection
    {
      name: 'XSS - Script Tag (Should be blocked)',
      method: 'GET',
      endpoint: '/api/ebay/search/<script>alert("xss")</script>',
      expectedStatus: 400,
      category: 'XSS'
    },

    // Test Path Traversal protection
    {
      name: 'Path Traversal - Directory (Should be blocked)',
      method: 'GET',
      endpoint: '/api/ebay/search/../../../etc/passwd',
      expectedStatus: 400,
      category: 'Path Traversal'
    },

    // Test Command Injection protection
    {
      name: 'Command Injection - Semicolon (Should be blocked)',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone; ls -la',
      expectedStatus: 400,
      category: 'Command Injection'
    },

    // Test valid inputs (should work)
    {
      name: 'Valid Input - Normal Search',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone',
      expectedStatus: 200,
      category: 'Valid Input'
    },
    {
      name: 'Valid Input - With Numbers',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone 13 Pro',
      expectedStatus: 200,
      category: 'Valid Input'
    }
  ];

  let passedTests = 0;
  let totalTests = securityTests.length;

  for (const test of securityTests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   Category: ${test.category}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.endpoint}`,
        timeout: 10000,
        validateStatus: () => true
      });

      const statusMatch = response.status === test.expectedStatus;
      const securityIcon = statusMatch ? '✅' : '❌';
      
      if (statusMatch) {
        passedTests++;
      }
      
      console.log(`   ${securityIcon} Status: ${response.status} (expected: ${test.expectedStatus})`);
      
      if (response.data && typeof response.data === 'object') {
        const responseStr = JSON.stringify(response.data);
        console.log(`   📊 Response: ${responseStr.substring(0, 200)}${responseStr.length > 200 ? '...' : ''}`);
      }

      if (!statusMatch) {
        console.log(`   ⚠️ Security test failed!`);
        if (test.expectedStatus === 400 && response.status !== 400) {
          console.log(`   Expected: 400 (blocked malicious input)`);
          console.log(`   Got: ${response.status} (potentially vulnerable)`);
        } else if (test.expectedStatus === 200 && response.status !== 200) {
          console.log(`   Expected: 200 (valid input should work)`);
          console.log(`   Got: ${response.status} (valid input blocked)`);
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
  console.log('🎯 Security Improvements Test Summary');
  console.log('=' .repeat(50));
  
  console.log(`📊 Security Score: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All security improvements working correctly!');
    console.log('✅ Malicious inputs are being blocked');
    console.log('✅ Valid inputs are working normally');
    console.log('✅ Input validation middleware is active');
  } else {
    console.log('⚠️ Some security improvements need attention');
    console.log('🔧 Check input validation middleware implementation');
  }

  console.log('\n🔍 Security Features Implemented:');
  console.log('   - Input sanitization for all user inputs');
  console.log('   - SQL injection protection');
  console.log('   - XSS protection');
  console.log('   - Path traversal protection');
  console.log('   - Command injection protection');
  console.log('   - Security headers (XSS, Content-Type, Frame-Options)');
  console.log('   - Request size limiting');
  console.log('   - Suspicious pattern detection');
}

testSecurityImprovements().catch(console.error);
