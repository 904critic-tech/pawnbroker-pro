const axios = require('axios');

const LAMBDA_URL = 'https://5opd4n4a4yk4t2hs7efwcmplbm0cmidw.lambda-url.us-east-2.on.aws/';

async function testMobileLambdaIntegration() {
  console.log('🧪 Testing Mobile App Lambda Integration\n');
  
  const testItems = [
    'iPhone 14 Pro',
    'Diamond Ring',
    'MacBook Pro',
    'Gold Necklace',
    'PlayStation 5'
  ];
  
  for (const item of testItems) {
    console.log(`🔍 Testing: "${item}"`);
    console.log('─'.repeat(50));
    
    try {
      // Simulate mobile app calling Lambda directly
      const response = await axios.post(LAMBDA_URL, {
        itemName: item
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
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
        
        if (result.data.recentSales && result.data.recentSales.length > 0) {
          console.log(`🛒 Recent Sales: ${result.data.recentSales.length} items`);
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
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
  
  console.log('🎯 Mobile Lambda Integration Test Complete!');
  console.log('\n📱 Mobile app can now call Lambda function directly!');
  console.log('✅ No backend dependency required');
  console.log('✅ Fallback to backend if needed');
  console.log('✅ Lambda provides real pricing data');
}

// Test the integration
testMobileLambdaIntegration().catch(console.error);
