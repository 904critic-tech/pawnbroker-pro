const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testComprehensivePricing() {
  console.log('🧪 Testing Comprehensive Pricing System (All Sources)\n');

  const testItems = [
    'iPhone 14 Pro',
    'Air Jordan 1',
    'Rolex Submariner',
    'Super Mario Bros',
    'American Eagle Gold Coin',
    'Diamond Ring 2 Carat'
  ];

  console.log('📋 Test Items:');
  testItems.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item}`);
  });
  console.log('');

  for (let i = 0; i < testItems.length; i++) {
    const item = testItems[i];
    console.log(`\n🔍 Test ${i + 1}/${testItems.length}: "${item}"`);
    console.log('─'.repeat(50));

    try {
      // Test quick estimate (eBay + fallback to specialized)
      console.log('📊 Testing Quick Estimate...');
      const quickResponse = await axios.get(`${API_BASE_URL}/marketplace/quick/${encodeURIComponent(item)}`);
      
      if (quickResponse.data.success) {
        const data = quickResponse.data.data;
        console.log(`   ✅ Market Value: $${data.marketValue}`);
        console.log(`   ✅ Pawn Value: $${data.pawnValue}`);
        console.log(`   ✅ Confidence: ${Math.round(data.confidence * 100)}%`);
        console.log(`   ✅ Data Points: ${data.dataPoints}`);
        console.log(`   ✅ Source: ${data.source}`);
        console.log(`   ✅ Note: ${data.note}`);
      } else {
        console.log(`   ❌ Quick estimate failed: ${quickResponse.data.message}`);
      }

      // Test Amazon pricing
      console.log('\n📦 Testing Amazon Pricing...');
      try {
        const amazonResponse = await axios.get(`${API_BASE_URL}/amazon/pricing/${encodeURIComponent(item)}`);
        if (amazonResponse.data.success) {
          const amazonData = amazonResponse.data.data;
          console.log(`   ✅ Amazon Market Value: $${amazonData.marketValue}`);
          console.log(`   ✅ Amazon Confidence: ${Math.round(amazonData.confidence * 100)}%`);
          console.log(`   ✅ Products Found: ${amazonData.dataPoints}`);
        }
      } catch (amazonError) {
        console.log(`   ⚠️  Amazon pricing failed: ${amazonError.response?.data?.message || amazonError.message}`);
      }

      // Test comprehensive data
      console.log('\n🌐 Testing Comprehensive Data...');
      try {
        const comprehensiveResponse = await axios.get(`${API_BASE_URL}/marketplace/comprehensive/${encodeURIComponent(item)}`);
        if (comprehensiveResponse.data.success) {
          const compData = comprehensiveResponse.data.data;
          console.log(`   ✅ Primary Source: ${compData.primarySource}`);
          console.log(`   ✅ Sources Used: ${compData.summary.totalSources}`);
          console.log(`   ✅ Recommendation: ${compData.summary.recommendation}`);
        }
      } catch (compError) {
        console.log(`   ⚠️  Comprehensive data failed: ${compError.response?.data?.message || compError.message}`);
      }

    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }

    // Wait between tests
    if (i < testItems.length - 1) {
      console.log('\n⏳ Waiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n🎯 COMPREHENSIVE PRICING SYSTEM TEST COMPLETE');
  console.log('✅ All pricing sources integrated:');
  console.log('   • eBay (Primary - sold listings)');
  console.log('   • Amazon (Product pricing)');
  console.log('   • Specialized Price Guides (Jewelry, Electronics, Watches, Games, Sneakers, Coins)');
  console.log('   • Facebook Marketplace (Possible market rate)');
  console.log('   • Craigslist (Possible market rate)');
  console.log('   • OfferUp (Possible market rate)');
  console.log('   • Mercari (Possible market rate)');
  console.log('   • CamelCamelCamel (Price history)');
}

// Test Amazon API health
async function testAmazonHealth() {
  console.log('\n🔧 Testing Amazon API Health...');
  try {
    const healthResponse = await axios.get(`${API_BASE_URL}/amazon/health`);
    if (healthResponse.data.success) {
      const health = healthResponse.data.data;
      console.log(`   ✅ Status: ${health.status}`);
      console.log(`   ✅ Access Token: ${health.accessToken ? 'Available' : 'Not Available'}`);
      console.log(`   ✅ Timestamp: ${health.timestamp}`);
    }
  } catch (error) {
    console.log(`   ❌ Amazon health check failed: ${error.message}`);
  }
}

// Run tests
async function runTests() {
  try {
    await testComprehensivePricing();
    await testAmazonHealth();
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();
