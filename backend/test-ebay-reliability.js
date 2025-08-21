const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test items that should have good eBay data
const testItems = [
  'iPhone 14 Pro',
  'iPhone 13 Pro', 
  'Gold Ring',
  'Gaming Console',
  'Rolex Watch',
  'Diamond Necklace',
  'Guitar',
  'Power Tools',
  'Samsung Galaxy',
  'MacBook Pro'
];

async function testEBayReliability() {
  console.log('🧪 Testing eBay Scraper Reliability (10/10 success rate required)\n');
  
  let successCount = 0;
  let totalTests = testItems.length;
  
  for (let i = 0; i < testItems.length; i++) {
    const item = testItems[i];
    console.log(`Test ${i + 1}/${totalTests}: "${item}"`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${API_BASE_URL}/marketplace/quick/${encodeURIComponent(item)}`);
      const endTime = Date.now();
      
      if (response.data.success && response.data.data.marketValue > 0) {
        successCount++;
        console.log(`✅ SUCCESS: $${response.data.data.marketValue} (${response.data.data.dataPoints} data points, ${Math.round(response.data.data.confidence * 100)}% confidence)`);
        console.log(`   ⏱️  Response time: ${endTime - startTime}ms`);
      } else {
        console.log(`❌ FAILED: No valid data returned`);
      }
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
    
    console.log('');
    
    // Rate limiting between tests
    if (i < testItems.length - 1) {
      console.log('⏳ Waiting 3 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('📊 RESULTS SUMMARY:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${totalTests - successCount}`);
  console.log(`   Success Rate: ${Math.round((successCount / totalTests) * 100)}%`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 PERFECT! eBay scraper is 100% reliable!');
    console.log('✅ All tests passed - system ready for production');
  } else {
    console.log('\n⚠️  WARNING: eBay scraper needs improvement');
    console.log(`❌ ${totalTests - successCount} tests failed - system not ready`);
  }
  
  return successCount === totalTests;
}

// Run the test
testEBayReliability()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
