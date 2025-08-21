const axios = require('axios');

async function testEBayAPI() {
  console.log('🔍 Comprehensive eBay API Test...\n');
  
  const appId = 'WilliamS-PawnBrok-PRD-181203948-0c731637';
  const baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';
  
  // Test different parameter combinations
  const testCases = [
    {
      name: 'Basic findItemsByKeywords (minimal params)',
      params: {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': 'iPhone'
      }
    },
    {
      name: 'findItemsByKeywords with GLOBAL-ID',
      params: {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': 'iPhone',
        'GLOBAL-ID': 'EBAY-US'
      }
    },
    {
      name: 'findCompletedItems (minimal params)',
      params: {
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': 'iPhone'
      }
    },
    {
      name: 'findCompletedItems with GLOBAL-ID',
      params: {
        'OPERATION-NAME': 'findCompletedItems',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': 'iPhone',
        'GLOBAL-ID': 'EBAY-US'
      }
    },
    {
      name: 'getSearchKeywordsRecommendation (test API access)',
      params: {
        'OPERATION-NAME': 'getSearchKeywordsRecommendation',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': 'iPhone'
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${i + 1}. Testing: ${testCase.name}`);
    
    try {
      const response = await axios.get(baseUrl, { 
        params: testCase.params,
        timeout: 10000
      });
      
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`Response data preview: ${JSON.stringify(response.data, null, 2).substring(0, 300)}...`);
      
      if (response.data.findItemsByKeywordsResponse) {
        console.log(`📊 Found ${response.data.findItemsByKeywordsResponse[0].searchResult[0]['@count']} items`);
      }
      if (response.data.findCompletedItemsResponse) {
        console.log(`📊 Found ${response.data.findCompletedItemsResponse[0].searchResult[0]['@count']} completed items`);
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Headers:`, error.response.headers);
        console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
      }
    }
    console.log('');
  }

  // Test App ID validation
  console.log('🔍 Testing App ID validation...');
  try {
    const testResponse = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
      params: {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.13.0',
        'SECURITY-APPNAME': 'INVALID-APP-ID',
        'RESPONSE-DATA-FORMAT': 'JSON',
        'keywords': 'test'
      }
    });
    console.log('❌ Invalid App ID should have failed but succeeded - this is unexpected');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Invalid App ID correctly rejected (400 error)');
    } else {
      console.log(`❌ Unexpected error with invalid App ID: ${error.message}`);
    }
  }
}

testEBayAPI();
