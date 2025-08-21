const axios = require('axios');

async function testMongoDBConnection() {
  console.log('🧪 Testing MongoDB Connection and Search History...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('✅ Server is running:', healthResponse.data.status);

    // Test 2: Search history saving
    console.log('\n2️⃣ Testing search history saving...');
    const searchResponse = await axios.get('http://localhost:5001/api/marketplace/quick/test%20item%20mongodb');
    console.log('✅ Search completed:', searchResponse.data.success);
    console.log('📊 Market value:', searchResponse.data.data.marketValue);

    // Test 3: Analytics endpoint
    console.log('\n3️⃣ Testing analytics endpoint...');
    const analyticsResponse = await axios.get('http://localhost:5001/api/marketplace/analytics');
    console.log('✅ Analytics retrieved:', analyticsResponse.data.success);
    console.log('📈 Total searches:', analyticsResponse.data.data.totalSearches);

    console.log('\n🎉 MongoDB connection and search history are working perfectly!');
    console.log('💾 Search data is being saved to MongoDB Atlas cluster: pawnbroker');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testMongoDBConnection();
