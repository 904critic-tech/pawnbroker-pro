// Test API Connection for PawnBroker Pro Web App
const fetch = require('node-fetch');

async function testAPI() {
  const API_BASE_URL = 'https://pawnbroker-l7okx8ar7-904critic-techs-projects.vercel.app/api';
  const testQuery = 'iPhone 13 Pro';
  
  console.log('🧪 Testing API Connection...');
  console.log(`📡 API URL: ${API_BASE_URL}/marketplace/quick/${testQuery}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/marketplace/quick/${encodeURIComponent(testQuery)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ API Error Response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testAPI();
