// Test script for CamelCamelCamel integration
const API_BASE_URL = 'http://localhost:5001/api';

async function testCamelCamelCamel() {
  console.log('🐪 Testing CamelCamelCamel Integration...\n');

  try {
    // Test 1: Search products
    console.log('1. Testing CamelCamelCamel Search...');
    const searchResponse = await fetch(`${API_BASE_URL}/camelcamelcamel/search/iPhone%2014%20Pro`);
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ CamelCamelCamel Search Successful');
      console.log(`   Found ${searchData.data.totalFound} products`);
      console.log(`   Source: ${searchData.data.source}`);
      
      if (searchData.data.products.length > 0) {
        const firstProduct = searchData.data.products[0];
        console.log(`   First Product: ${firstProduct.title}`);
        console.log(`   Current Price: $${firstProduct.currentPrice}`);
      }
    } else {
      console.log('❌ CamelCamelCamel Search Failed:', searchData.message);
    }

    // Test 2: Price History
    console.log('\n2. Testing CamelCamelCamel Price History...');
    const historyResponse = await fetch(`${API_BASE_URL}/camelcamelcamel/price-history/iPhone%2014%20Pro`);
    const historyData = await historyResponse.json();
    
    if (historyData.success) {
      console.log('✅ CamelCamelCamel Price History Successful');
      console.log(`   Product: ${historyData.data.product.title}`);
      console.log(`   Current Price: $${historyData.data.priceHistory.currentPrice}`);
      console.log(`   Price History Points: ${historyData.data.priceHistory.priceHistory.length}`);
      console.log(`   Source: ${historyData.data.source}`);
    } else {
      console.log('❌ CamelCamelCamel Price History Failed:', historyData.message);
    }

    // Test 3: Price Analysis
    console.log('\n3. Testing CamelCamelCamel Price Analysis...');
    const analysisResponse = await fetch(`${API_BASE_URL}/camelcamelcamel/analyze/iPhone%2014%20Pro`);
    const analysisData = await analysisResponse.json();
    
    if (analysisData.success) {
      console.log('✅ CamelCamelCamel Price Analysis Successful');
      console.log(`   Product: ${analysisData.data.product.title}`);
      console.log(`   Current Price: $${analysisData.data.currentPrice}`);
      console.log(`   Price Trend: ${analysisData.data.insights.priceTrend}`);
      console.log(`   Best Time to Buy: ${analysisData.data.insights.bestTimeToBuy}`);
      console.log(`   Price Volatility: ${analysisData.data.insights.priceVolatility}`);
      console.log(`   Average Price: $${analysisData.data.insights.averagePrice}`);
    } else {
      console.log('❌ CamelCamelCamel Price Analysis Failed:', analysisData.message);
    }

    // Test 4: Health Check
    console.log('\n4. Testing CamelCamelCamel Health Check...');
    const healthResponse = await fetch(`${API_BASE_URL}/camelcamelcamel/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.success) {
      console.log('✅ CamelCamelCamel Health Check Successful');
      console.log(`   Status: ${healthData.message}`);
      console.log(`   Timestamp: ${healthData.timestamp}`);
    } else {
      console.log('❌ CamelCamelCamel Health Check Failed:', healthData.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎉 CamelCamelCamel Integration Test Complete!');
  console.log('📊 This provides Amazon price history and trends');
  console.log('💰 Combined with eBay sold data for comprehensive pricing');
}

// Run the test
testCamelCamelCamel();
