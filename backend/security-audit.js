const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function securityAudit() {
  console.log('🔒 PawnBroker Pro Security Audit...\n');

  const securityTests = [
    // SQL Injection Tests
    {
      name: 'SQL Injection Test - Single Quote',
      method: 'GET',
      endpoint: '/api/ebay/search/\' OR 1=1--',
      expectedStatus: 400,
      category: 'SQL Injection'
    },
    {
      name: 'SQL Injection Test - Comment',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone/*',
      expectedStatus: 400,
      category: 'SQL Injection'
    },
    {
      name: 'SQL Injection Test - Union',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone UNION SELECT * FROM users',
      expectedStatus: 400,
      category: 'SQL Injection'
    },

    // XSS Tests
    {
      name: 'XSS Test - Script Tag',
      method: 'GET',
      endpoint: '/api/ebay/search/<script>alert("xss")</script>',
      expectedStatus: 400,
      category: 'XSS'
    },
    {
      name: 'XSS Test - JavaScript URI',
      method: 'GET',
      endpoint: '/api/ebay/search/javascript:alert("xss")',
      expectedStatus: 400,
      category: 'XSS'
    },

    // Path Traversal Tests
    {
      name: 'Path Traversal Test - Directory',
      method: 'GET',
      endpoint: '/api/ebay/search/../../../etc/passwd',
      expectedStatus: 400,
      category: 'Path Traversal'
    },
    {
      name: 'Path Traversal Test - Windows',
      method: 'GET',
      endpoint: '/api/ebay/search/..\\..\\..\\windows\\system32\\config\\sam',
      expectedStatus: 400,
      category: 'Path Traversal'
    },

    // Command Injection Tests
    {
      name: 'Command Injection Test - Semicolon',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone; ls -la',
      expectedStatus: 400,
      category: 'Command Injection'
    },
    {
      name: 'Command Injection Test - Pipe',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone | cat /etc/passwd',
      expectedStatus: 400,
      category: 'Command Injection'
    },

    // NoSQL Injection Tests
    {
      name: 'NoSQL Injection Test - Object',
      method: 'GET',
      endpoint: '/api/ebay/search/{"$gt": ""}',
      expectedStatus: 400,
      category: 'NoSQL Injection'
    },
    {
      name: 'NoSQL Injection Test - Array',
      method: 'GET',
      endpoint: '/api/ebay/search/[$ne]',
      expectedStatus: 400,
      category: 'NoSQL Injection'
    },

    // Authentication Bypass Tests
    {
      name: 'Auth Bypass - Empty Token',
      method: 'GET',
      endpoint: '/api/market/search?query=iPhone',
      headers: { 'Authorization': '' },
      expectedStatus: 401,
      category: 'Authentication'
    },
    {
      name: 'Auth Bypass - Invalid Token',
      method: 'GET',
      endpoint: '/api/market/search?query=iPhone',
      headers: { 'Authorization': 'Bearer invalid-token' },
      expectedStatus: 401,
      category: 'Authentication'
    },
    {
      name: 'Auth Bypass - Malformed Token',
      method: 'GET',
      endpoint: '/api/market/search?query=iPhone',
      headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid' },
      expectedStatus: 401,
      category: 'Authentication'
    },

    // Rate Limiting Tests
    {
      name: 'Rate Limiting Test - Multiple Requests',
      method: 'GET',
      endpoint: '/api/ebay/search/iPhone',
      expectedStatus: 429,
      category: 'Rate Limiting',
      multipleRequests: 15
    },

    // Input Validation Tests
    {
      name: 'Input Validation - Empty Query',
      method: 'GET',
      endpoint: '/api/ebay/search/',
      expectedStatus: 404,
      category: 'Input Validation'
    },
    {
      name: 'Input Validation - Very Long Query',
      method: 'GET',
      endpoint: `/api/ebay/search/${'A'.repeat(1000)}`,
      expectedStatus: 400,
      category: 'Input Validation'
    },
    {
      name: 'Input Validation - Special Characters',
      method: 'GET',
      endpoint: '/api/ebay/search/!@#$%^&*()_+-=[]{}|;:,.<>?',
      expectedStatus: 400,
      category: 'Input Validation'
    }
  ];

  const results = {
    passed: 0,
    failed: 0,
    total: securityTests.length,
    categories: {}
  };

  for (const test of securityTests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   Category: ${test.category}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    
    try {
      let response;
      
      if (test.multipleRequests) {
        // Test rate limiting
        const promises = [];
        for (let i = 0; i < test.multipleRequests; i++) {
          promises.push(axios({
            method: test.method,
            url: `${BASE_URL}${test.endpoint}`,
            headers: test.headers || {},
            timeout: 5000,
            validateStatus: () => true
          }));
        }
        
        const responses = await Promise.all(promises);
        response = responses[responses.length - 1]; // Check the last response
      } else {
        response = await axios({
          method: test.method,
          url: `${BASE_URL}${test.endpoint}`,
          headers: test.headers || {},
          timeout: 5000,
          validateStatus: () => true
        });
      }

      const statusMatch = response.status === test.expectedStatus;
      const securityIcon = statusMatch ? '✅' : '❌';
      
      if (statusMatch) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // Track by category
      if (!results.categories[test.category]) {
        results.categories[test.category] = { passed: 0, failed: 0, total: 0 };
      }
      results.categories[test.category].total++;
      if (statusMatch) {
        results.categories[test.category].passed++;
      } else {
        results.categories[test.category].failed++;
      }
      
      console.log(`   ${securityIcon} Status: ${response.status} (expected: ${test.expectedStatus})`);
      
      if (response.data && typeof response.data === 'object') {
        console.log(`   📊 Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
      }

      if (!statusMatch) {
        console.log(`   ⚠️ Security vulnerability detected!`);
        console.log(`   Expected: ${test.expectedStatus} (secure response)`);
        console.log(`   Got: ${response.status} (potentially vulnerable)`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.failed++;
    }
    
    console.log('');
  }

  // Summary
  console.log('🎯 Security Audit Summary');
  console.log('=' .repeat(50));
  
  console.log(`📊 Overall Security Score: ${results.passed}/${results.total} tests passed (${Math.round(results.passed/results.total*100)}%)`);
  
  console.log('\n📈 Results by Category:');
  Object.entries(results.categories).forEach(([category, stats]) => {
    const percentage = Math.round(stats.passed/stats.total*100);
    const icon = stats.failed === 0 ? '✅' : '⚠️';
    console.log(`${icon} ${category}: ${stats.passed}/${stats.total} passed (${percentage}%)`);
  });
  
  if (results.failed > 0) {
    console.log('\n🔒 Security Recommendations:');
    console.log('   - Implement input sanitization for all user inputs');
    console.log('   - Add SQL injection protection (parameterized queries)');
    console.log('   - Implement XSS protection (output encoding)');
    console.log('   - Add path traversal protection (validate file paths)');
    console.log('   - Implement proper authentication middleware');
    console.log('   - Add rate limiting for all endpoints');
    console.log('   - Validate and sanitize all query parameters');
    console.log('   - Implement proper error handling (don\'t expose internals)');
    console.log('   - Add request size limits');
    console.log('   - Implement CORS properly');
  } else {
    console.log('\n🎉 All security tests passed! The API appears to be secure.');
  }
  
  console.log('\n🔍 Additional Security Checks:');
  console.log('   - Review API key storage and rotation');
  console.log('   - Check for exposed sensitive data in responses');
  console.log('   - Verify HTTPS enforcement in production');
  console.log('   - Review logging for sensitive information');
  console.log('   - Check for proper session management');
  console.log('   - Verify database connection security');
}

securityAudit().catch(console.error);
