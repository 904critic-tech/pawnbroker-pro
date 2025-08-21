// Test script for comprehensive marketplace data aggregation
const API_BASE_URL = 'http://localhost:5001/api';

async function testComprehensiveMarketplace() {
  console.log('🔍 Testing Comprehensive Marketplace Data Aggregation...\n');

  try {
    // Test 1: Quick Market Estimate (eBay only)
    console.log('1. Testing Quick Market Estimate (eBay only)...');
    const quickResponse = await fetch(`${API_BASE_URL}/marketplace/quick/iPhone%2014%20Pro`);
    const quickData = await quickResponse.json();
    
    if (quickData.success) {
      console.log('✅ Quick Market Estimate Successful');
      console.log(`   Market Value: $${quickData.data.marketValue}`);
      console.log(`   Pawn Value: $${quickData.data.pawnValue}`);
      console.log(`   Confidence: ${quickData.data.confidence * 100}%`);
      console.log(`   Source: ${quickData.data.source}`);
      console.log(`   Note: ${quickData.data.note}`);
    } else {
      console.log('❌ Quick Market Estimate Failed:', quickData.message);
    }

    // Test 2: Comprehensive Market Data (All Sources)
    console.log('\n2. Testing Comprehensive Market Data (All Sources)...');
    const comprehensiveResponse = await fetch(`${API_BASE_URL}/marketplace/comprehensive/iPhone%2014%20Pro`);
    const comprehensiveData = await comprehensiveResponse.json();
    
    if (comprehensiveData.success) {
      console.log('✅ Comprehensive Market Data Successful');
      
      const data = comprehensiveData.data;
      console.log(`   Query: ${data.query}`);
      console.log(`   Primary Source: ${data.primarySource}`);
      
      // Primary market data
      const primary = data.aggregatedData.primaryMarketData;
      console.log(`   Primary Market Value: $${primary.marketValue}`);
      console.log(`   Primary Pawn Value: $${primary.pawnValue}`);
      console.log(`   Primary Confidence: ${primary.confidence * 100}%`);
      console.log(`   Primary Data Points: ${primary.dataPoints}`);
      
      // Aggregated data
      const aggregated = data.aggregatedData.aggregatedData;
      console.log(`   Aggregated Market Value: $${aggregated.marketValue}`);
      console.log(`   Aggregated Pawn Value: $${aggregated.pawnValue}`);
      console.log(`   Overall Confidence: ${aggregated.confidence * 100}%`);
      console.log(`   Total Data Points: ${aggregated.totalDataPoints}`);
      console.log(`   Sources Used: ${aggregated.sourcesUsed}`);
      
      // Possible market rates
      const possibleRates = data.aggregatedData.possibleMarketRates;
      console.log(`   Possible Market Rate Sources: ${possibleRates.length}`);
      possibleRates.forEach(rate => {
        console.log(`     ${rate.source}: $${rate.marketValue} (${rate.confidence * 100}% confidence, ${rate.dataPoints} data points)`);
      });
      
      // Summary
      const summary = data.aggregatedData.summary;
      console.log(`   Recommendation: ${summary.recommendation}`);
      console.log(`   Total Sources: ${summary.totalSources}`);
    } else {
      console.log('❌ Comprehensive Market Data Failed:', comprehensiveData.message);
    }

    // Test 3: Market Data Breakdown
    console.log('\n3. Testing Market Data Breakdown...');
    const breakdownResponse = await fetch(`${API_BASE_URL}/marketplace/breakdown/iPhone%2014%20Pro`);
    const breakdownData = await breakdownResponse.json();
    
    if (breakdownData.success) {
      console.log('✅ Market Data Breakdown Successful');
      
      const data = breakdownData.data;
      console.log(`   Query: ${data.query}`);
      
      // Source status
      console.log('   Source Status:');
      data.sourceStatus.forEach(source => {
        const status = source.status === 'success' ? '✅' : '❌';
        console.log(`     ${status} ${source.source}: ${source.status}${source.error ? ` (${source.error})` : ''}`);
      });
      
      // Summary
      console.log(`   Primary Source: ${data.summary.primarySource}`);
      console.log(`   Possible Market Rate Sources: ${data.summary.possibleMarketRateSources.join(', ')}`);
      console.log(`   Total Sources: ${data.summary.totalSources}`);
      console.log(`   Recommendation: ${data.summary.recommendation}`);
    } else {
      console.log('❌ Market Data Breakdown Failed:', breakdownData.message);
    }

    // Test 4: Health Check
    console.log('\n4. Testing Marketplace Health Check...');
    const healthResponse = await fetch(`${API_BASE_URL}/marketplace/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.success) {
      console.log('✅ Marketplace Health Check Successful');
      console.log(`   Status: ${healthData.message}`);
      console.log(`   Primary Source: ${healthData.primarySource}`);
      console.log(`   Available Sources: ${healthData.availableSources.join(', ')}`);
      console.log(`   Timestamp: ${healthData.timestamp}`);
    } else {
      console.log('❌ Marketplace Health Check Failed:', healthData.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎉 Comprehensive Marketplace Integration Test Complete!');
  console.log('📊 This provides:');
  console.log('   • Primary market data from eBay (sold listings)');
  console.log('   • Possible market rates from Facebook, Craigslist, OfferUp, Mercari');
  console.log('   • Price history from CamelCamelCamel');
  console.log('   • Aggregated confidence scores and recommendations');
}

// Run the test
testComprehensiveMarketplace();
