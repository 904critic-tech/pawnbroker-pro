const axios = require('axios');

async function testMobileConnection() {
  console.log('📱 Testing Mobile App Connection...\n');

  try {
    // Test 1: Backend health
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('✅ Backend is running:', healthResponse.data.status);

    // Test 2: Mobile app should be able to reach this endpoint
    console.log('\n2️⃣ Testing marketplace API (what mobile app uses)...');
    const searchResponse = await axios.get('http://localhost:5001/api/marketplace/quick/iphone%2014');
    console.log('✅ Marketplace API working:', searchResponse.data.success);
    console.log('📊 Market value:', searchResponse.data.data.marketValue);
    console.log('💰 Pawn value:', searchResponse.data.data.pawnValue);
    console.log('🎯 Confidence:', searchResponse.data.data.confidence);

    // Test 3: Test the exact URL the mobile app uses
    console.log('\n3️⃣ Testing mobile app API endpoint...');
    const mobileResponse = await axios.get('http://10.0.0.214:5001/api/marketplace/quick/iphone%2014');
    console.log('✅ Mobile app can reach backend:', mobileResponse.data.success);

    console.log('\n🎉 Mobile app should be able to connect to backend!');
    console.log('📱 Try searching for "iPhone 14" in the mobile app now.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testMobileConnection();
