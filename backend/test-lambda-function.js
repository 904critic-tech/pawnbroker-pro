const axios = require('axios');

const LAMBDA_URL = 'https://5opd4n4a4yk4t2hs7efwcmplbm0cmidw.lambda-url.us-east-2.on.aws/';

async function testLambdaFunction() {
  console.log('🧪 Testing Lambda Pricing Function\n');
  
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
      const response = await axios.post(LAMBDA_URL, {
        itemName: item
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      const result = response.data;
      
      if (result.success) {
        console.log(`✅ Success!`);
        console.log(`💰 Market Value: $${result.data.marketValue}`);
        console.log(`🏪 Pawn Value: $${result.data.pawnValue}`);
        console.log(`🎯 Confidence: ${Math.round(result.data.confidence * 100)}%`);
        console.log(`📊 Source: ${result.data.source}`);
        if (result.data.dataPoints) {
          console.log(`📈 Data Points: ${result.data.dataPoints}`);
        }
        if (result.data.recentSales) {
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
  
  console.log('🎯 Lambda Function Test Complete!');
}

// Test the function
testLambdaFunction().catch(console.error);
