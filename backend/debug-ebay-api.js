const axios = require('axios');

async function debugEBayAPI() {
  console.log('🔍 Debugging eBay API...\n');
  
  const appId = 'WilliamS-PawnBrok-PRD-181203948-0c731637';
  const baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';
  
  try {
    // Test 1: Basic search without filters
    console.log('1. Testing basic search...');
    const basicParams = {
      'OPERATION-NAME': 'findItemsByKeywords',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': 'iPhone',
      'GLOBAL-ID': 'EBAY-US'
    };
    
    const basicResponse = await axios.get(baseUrl, { params: basicParams });
    console.log('Basic search response status:', basicResponse.status);
    console.log('Basic search response data:', JSON.stringify(basicResponse.data, null, 2).substring(0, 500) + '...');
    console.log('');
    
    // Test 2: Completed items search
    console.log('2. Testing completed items search...');
    const completedParams = {
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.13.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': 'iPhone',
      'GLOBAL-ID': 'EBAY-US'
    };
    
    const completedResponse = await axios.get(baseUrl, { params: completedParams });
    console.log('Completed items response status:', completedResponse.status);
    console.log('Completed items response data:', JSON.stringify(completedResponse.data, null, 2).substring(0, 500) + '...');
    console.log('');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugEBayAPI();
