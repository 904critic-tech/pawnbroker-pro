const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testGlobalLearning() {
  console.log('🧪 Testing Global Learning System...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/global-learning/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Get global stats
    console.log('2. Testing global stats...');
    const statsResponse = await axios.get(`${API_BASE_URL}/global-learning/stats`);
    console.log('✅ Global stats:', statsResponse.data);
    console.log('');

    // Test 3: Get global learning data
    console.log('3. Testing global learning data...');
    const dataResponse = await axios.get(`${API_BASE_URL}/global-learning/data`);
    console.log('✅ Global learning data retrieved');
    console.log(`   - Brands: ${Object.keys(dataResponse.data.data.brandPatterns).length}`);
    console.log(`   - Models: ${Object.keys(dataResponse.data.data.modelPatterns).length}`);
    console.log(`   - Patterns: ${Object.keys(dataResponse.data.data.titlePatterns).length}`);
    console.log('');

    // Test 4: Sync user learning data
    console.log('4. Testing user learning sync...');
    const testUserData = {
      userId: 'test-user-123',
      learningData: {
        brandPatterns: {
          'Apple': {
            count: 5,
            examples: ['iPhone 12', 'iPhone 13', 'MacBook Pro'],
            confidence: 0.8
          },
          'Samsung': {
            count: 3,
            examples: ['Galaxy S21', 'Galaxy Note 20'],
            confidence: 0.6
          }
        },
        modelPatterns: {
          'iPhone 12': {
            count: 2,
            examples: ['Apple iPhone 12 128GB'],
            confidence: 0.7,
            brand: 'Apple'
          },
          'Galaxy S21': {
            count: 1,
            examples: ['Samsung Galaxy S21 Ultra'],
            confidence: 0.5,
            brand: 'Samsung'
          }
        },
        searchHistory: [
          {
            query: 'iPhone 12',
            brands: ['Apple'],
            models: ['iPhone 12'],
            timestamp: Date.now()
          }
        ],
        titlePatterns: {
          'iphone 12': {
            count: 2,
            brand: 'Apple',
            model: 'iPhone 12'
          }
        }
      }
    };

    const syncResponse = await axios.post(`${API_BASE_URL}/global-learning/sync`, testUserData);
    console.log('✅ User learning data synced:', syncResponse.data);
    console.log('');

    // Test 5: Get search suggestions
    console.log('5. Testing search suggestions...');
    const suggestionsResponse = await axios.get(`${API_BASE_URL}/global-learning/suggestions?query=iphone&limit=5`);
    console.log('✅ Search suggestions:', suggestionsResponse.data);
    console.log('');

    // Test 6: Get trending items
    console.log('6. Testing trending items...');
    const trendingResponse = await axios.get(`${API_BASE_URL}/global-learning/trending?limit=10`);
    console.log('✅ Trending items:', trendingResponse.data);
    console.log('');

    // Test 7: Updated stats after sync
    console.log('7. Testing updated stats...');
    const updatedStatsResponse = await axios.get(`${API_BASE_URL}/global-learning/stats`);
    console.log('✅ Updated global stats:', updatedStatsResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Global Learning System is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 503) {
      console.log('\n💡 The Global Learning Service might not be initialized yet.');
      console.log('   Make sure MongoDB is running and the service has started properly.');
    }
  }
}

// Run the test
testGlobalLearning();
