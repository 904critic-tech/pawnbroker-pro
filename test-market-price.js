// Test script to verify market price search functionality
const API_BASE_URL = 'http://localhost:5001/api';

async function testMarketPriceSearch() {
  console.log('🧪 Testing Market Price Search Functionality...\n');

  try {
    // Test 1: eBay Search
    console.log('1. Testing eBay Search...');
    const searchResponse = await fetch(`${API_BASE_URL}/ebay/search/iPhone%2014%20Pro`);
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ eBay Search Successful');
      console.log(`   Found ${searchData.data.totalFound} items`);
      console.log(`   Average Price: $${searchData.data.averagePrice}`);
      console.log(`   Price Range: $${searchData.data.minPrice} - $${searchData.data.maxPrice}`);
    } else {
      console.log('❌ eBay Search Failed:', searchData.message);
    }

    // Test 2: Pricing Estimate
    console.log('\n2. Testing Pricing Estimate...');
    const estimateResponse = await fetch(`${API_BASE_URL}/ebay/estimate/iPhone%2014%20Pro`);
    const estimateData = await estimateResponse.json();
    
    if (estimateData.success) {
      console.log('✅ Pricing Estimate Successful');
      console.log(`   Market Value: $${estimateData.data.marketValue}`);
      console.log(`   Pawn Value: $${estimateData.data.pawnValue}`);
      console.log(`   Confidence: ${(estimateData.data.confidence * 100).toFixed(1)}%`);
      console.log(`   Data Points: ${estimateData.data.dataPoints}`);
      console.log(`   Price Range: $${estimateData.data.priceRange.min} - $${estimateData.data.priceRange.max}`);
      
      // Show some recent sales
      console.log('\n   Recent Sales:');
      estimateData.data.recentSales.slice(0, 3).forEach((sale, index) => {
        console.log(`   ${index + 1}. ${sale.title.substring(0, 50)}... - $${sale.price}`);
      });
    } else {
      console.log('❌ Pricing Estimate Failed:', estimateData.message);
    }

    // Test 3: Different Item Category
    console.log('\n3. Testing Different Item (Gold Ring)...');
    const ringResponse = await fetch(`${API_BASE_URL}/ebay/estimate/Gold%20Ring`);
    const ringData = await ringResponse.json();
    
    if (ringData.success) {
      console.log('✅ Gold Ring Estimate Successful');
      console.log(`   Market Value: $${ringData.data.marketValue}`);
      console.log(`   Pawn Value: $${ringData.data.pawnValue}`);
      console.log(`   Confidence: ${(ringData.data.confidence * 100).toFixed(1)}%`);
    } else {
      console.log('❌ Gold Ring Estimate Failed:', ringData.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎉 Market Price Search Test Complete!');
}

// Run the test
testMarketPriceSearch();
