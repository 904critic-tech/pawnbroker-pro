const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test items that should have abundant eBay data
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

async function testEBayQuality() {
  console.log('🧪 Testing eBay Scraper Quality (High confidence & data points required)\n');
  
  let highQualityCount = 0;
  let totalTests = testItems.length;
  
  for (let i = 0; i < testItems.length; i++) {
    const item = testItems[i];
    console.log(`Test ${i + 1}/${totalTests}: "${item}"`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${API_BASE_URL}/marketplace/quick/${encodeURIComponent(item)}`);
      const endTime = Date.now();
      
      const data = response.data.data;
      
      if (response.data.success && data.marketValue > 0) {
        // Quality criteria: at least 10 data points and 50% confidence
        const hasGoodDataPoints = data.dataPoints >= 10;
        const hasGoodConfidence = data.confidence >= 0.5;
        const hasReasonablePrice = data.marketValue > 10 && data.marketValue < 100000;
        
        if (hasGoodDataPoints && hasGoodConfidence && hasReasonablePrice) {
          highQualityCount++;
          console.log(`✅ HIGH QUALITY: $${data.marketValue} (${data.dataPoints} data points, ${Math.round(data.confidence * 100)}% confidence)`);
        } else {
          console.log(`⚠️  LOW QUALITY: $${data.marketValue} (${data.dataPoints} data points, ${Math.round(data.confidence * 100)}% confidence)`);
          console.log(`   ❌ Data points: ${data.dataPoints}/10, Confidence: ${Math.round(data.confidence * 100)}%/50%`);
        }
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
  
  console.log('📊 QUALITY RESULTS SUMMARY:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   High Quality: ${highQualityCount}`);
  console.log(`   Low Quality: ${totalTests - highQualityCount}`);
  console.log(`   Quality Rate: ${Math.round((highQualityCount / totalTests) * 100)}%`);
  
  if (highQualityCount === totalTests) {
    console.log('\n🎉 PERFECT! eBay scraper delivers high-quality data consistently!');
    console.log('✅ All tests passed quality standards - system ready for production');
  } else {
    console.log('\n⚠️  WARNING: eBay scraper needs improvement for consistent quality');
    console.log(`❌ ${totalTests - highQualityCount} tests failed quality standards`);
    console.log('🔧 Need to improve data extraction or handle edge cases better');
  }
  
  return highQualityCount === totalTests;
}

// Run the test
testEBayQuality()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
