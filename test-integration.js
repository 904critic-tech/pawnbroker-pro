// Using built-in fetch (Node.js 18+)

const API_BASE_URL = 'http://localhost:5001/api';

async function testAPI() {
  console.log('🧪 Testing PawnBroker Pro API Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.message);
    console.log('   Status:', healthData.status);
    console.log('   Version:', healthData.version);
    console.log('');

    // Test 2: Register User
    console.log('2. Testing User Registration...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@pawnbroker.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        businessName: 'Test Pawn Shop'
      }),
    });
    
    const registerData = await registerResponse.json();
    if (registerData.success) {
      console.log('✅ User Registration Successful');
      console.log('   User ID:', registerData.user._id);
      console.log('   Email:', registerData.user.email);
      console.log('   Token received:', !!registerData.token);
      
      const token = registerData.token;
      
      // Test 3: Get Current User
      console.log('\n3. Testing Get Current User...');
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const userData = await userResponse.json();
      if (userData.success) {
        console.log('✅ Get Current User Successful');
        console.log('   User:', userData.user.firstName, userData.user.lastName);
      } else {
        console.log('❌ Get Current User Failed:', userData.message);
      }

      // Test 4: Create Item
      console.log('\n4. Testing Create Item...');
      const itemResponse = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'iPhone 14 Pro Max',
          category: 'Electronics',
          brand: 'Apple',
          model: '14 Pro Max',
          condition: 'excellent',
          notes: 'Test item for API integration'
        }),
      });
      
      const itemData = await itemResponse.json();
      if (itemData.success) {
        console.log('✅ Create Item Successful');
        console.log('   Item ID:', itemData.item._id);
        console.log('   Name:', itemData.item.name);
        console.log('   Market Value:', itemData.item.marketValue);
        console.log('   Pawn Value:', itemData.item.pawnValue);
      } else {
        console.log('❌ Create Item Failed:', itemData.message);
      }

      // Test 5: Get Items
      console.log('\n5. Testing Get Items...');
      const itemsResponse = await fetch(`${API_BASE_URL}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const itemsData = await itemsResponse.json();
      if (itemsData.success) {
        console.log('✅ Get Items Successful');
        console.log('   Total Items:', itemsData.pagination.total);
        console.log('   Items Retrieved:', itemsData.items.length);
      } else {
        console.log('❌ Get Items Failed:', itemsData.message);
      }

      // Test 6: Get Item Stats
      console.log('\n6. Testing Get Item Stats...');
      const statsResponse = await fetch(`${API_BASE_URL}/items/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const statsData = await statsResponse.json();
      if (statsData.success) {
        console.log('✅ Get Item Stats Successful');
        console.log('   Total Items:', statsData.stats.totalItems);
        console.log('   Total Market Value:', statsData.stats.totalMarketValue);
        console.log('   Total Pawn Value:', statsData.stats.totalPawnValue);
      } else {
        console.log('❌ Get Item Stats Failed:', statsData.message);
      }

      // Test 7: Market Data Search
      console.log('\n7. Testing Market Data Search...');
      const marketResponse = await fetch(`${API_BASE_URL}/market/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'iPhone 14 Pro Max'
        }),
      });
      
      const marketData = await marketResponse.json();
      if (marketData.success) {
        console.log('✅ Market Data Search Successful');
        console.log('   Estimated Value:', marketData.data.estimatedValue);
        console.log('   Confidence:', marketData.data.confidence);
      } else {
        console.log('❌ Market Data Search Failed:', marketData.message);
      }

    } else {
      console.log('❌ User Registration Failed:', registerData.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎉 API Integration Test Complete!');
}

// Run the test
testAPI();
