const axios = require('axios');

const BACKEND_URL = 'https://pawnbroker-bm4w19zwh-904critic-techs-projects.vercel.app';

async function testLambdaIntegration() {
  console.log('🧪 Testing Lambda Integration with Backend\n');
  
  const testItems = [
    'iPhone 14 Pro',
    'Diamond Ring',
    'MacBook Pro'
  ];
  
  for (const item of testItems) {
    console.log(`🔍 Testing: "${item}"`);
    console.log('─'.repeat(50));
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/ebay/estimate/${encodeURIComponent(item)}`, {
        timeout: 30000
      });
      
      const result = response.data;
      
      if (result.success) {
        console.log(`✅ Success!`);
        console.log(`💰 Market Value: $${result.data.marketValue}`);
        console.log(`🏪 Pawn Value: $${result.data.pawnValue}`);
        console.log(`🎯 Confidence: ${Math.round(result.data.confidence * 100)}%`);
        console.log(`📊 Source: ${result.data.source}`);
        console.log(`📈 Data Points: ${result.data.dataPoints || 'N/A'}`);
      } else {
        console.log(`❌ Failed: ${result.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    
    console.log('\n');
  }
  
  // Test Lambda connection endpoint
  console.log('🔗 Testing Lambda Connection Endpoint');
  console.log('─'.repeat(50));
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ebay/test-lambda`, {
      timeout: 10000
    });
    
    const result = response.data;
    
    if (result.success) {
      console.log(`✅ Lambda connection test successful!`);
      console.log(`Status: ${result.lambdaTest.status}`);
      console.log(`Lambda Response: ${JSON.stringify(result.lambdaTest.data, null, 2)}`);
    } else {
      console.log(`❌ Lambda connection test failed: ${result.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Lambda connection test error: ${error.message}`);
  }
  
  console.log('\n🎯 Lambda Integration Test Complete!');
}

// Test the integration
testLambdaIntegration().catch(console.error);
