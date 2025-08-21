const AmazonAPIService = require('./services/AmazonAPIService');

async function testAmazonAPI() {
  console.log('🧪 Testing Amazon API Service\n');

  const testItems = [
    'iPhone 14 Pro',
    'Air Jordan 1',
    'MacBook Pro',
    'PlayStation 5'
  ];

  for (const item of testItems) {
    console.log(`\n🔍 Testing: "${item}"`);
    console.log('─'.repeat(40));
    
    try {
      // Test product search
      console.log('📦 Testing product search...');
      const products = await AmazonAPIService.searchProducts(item, 3);
      if (products && products.length > 0) {
        console.log(`✅ Found ${products.length} products`);
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.title} - $${product.price}`);
        });
      } else {
        console.log('❌ No products found');
      }

      // Test pricing estimate
      console.log('\n💰 Testing pricing estimate...');
      const pricing = await AmazonAPIService.getPricingEstimate(item);
      if (pricing) {
        console.log(`✅ Market Value: $${pricing.marketValue}`);
        console.log(`   Pawn Value: $${pricing.pawnValue}`);
        console.log(`   Confidence: ${Math.round(pricing.confidence * 100)}%`);
        console.log(`   Data Points: ${pricing.dataPoints}`);
        console.log(`   Source: ${pricing.source}`);
      } else {
        console.log('❌ No pricing estimate');
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test health check
  console.log('\n🔧 Testing health check...');
  try {
    const health = await AmazonAPIService.healthCheck();
    console.log(`✅ Status: ${health.status}`);
    console.log(`   Access Token: ${health.accessToken ? 'Available' : 'Not Available'}`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  console.log('\n🎯 Amazon API Test Complete!');
}

testAmazonAPI().catch(console.error);
