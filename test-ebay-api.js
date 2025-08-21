const eBayAPIService = require('./backend/services/eBayAPIService');

async function testEBayAPI() {
  console.log('🧪 Testing eBay API Integration...\n');
  
  try {
    // Test health check
    console.log('1. Testing health check...');
    const health = await eBayAPIService.healthCheck();
    console.log('Health Status:', health);
    console.log('');
    
    // Test search for sold items
    console.log('2. Testing search for sold items...');
    const searchQuery = 'iPhone 13 Pro';
    console.log(`Searching for: "${searchQuery}"`);
    
    const soldItems = await eBayAPIService.searchSoldItems(searchQuery, 5);
    console.log(`Found ${soldItems.length} sold items:`);
    soldItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} - $${item.price} (${item.condition})`);
    });
    console.log('');
    
    // Test pricing estimate
    console.log('3. Testing pricing estimate...');
    const estimate = await eBayAPIService.getPricingEstimate(searchQuery);
    console.log('Pricing Estimate:', {
      marketValue: `$${estimate.marketValue}`,
      pawnValue: `$${estimate.pawnValue}`,
      confidence: `${Math.round(estimate.confidence * 100)}%`,
      dataPoints: estimate.dataPoints,
      priceRange: estimate.priceRange
    });
    console.log('');
    
    console.log('✅ eBay API integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ eBay API test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testEBayAPI();
