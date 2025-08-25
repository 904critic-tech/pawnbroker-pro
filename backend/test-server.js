const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/marketplace/quick/:query', (req, res) => {
  const { query } = req.params;
  console.log(`🔍 Test API called with query: ${query}`);
  
  // Return mock data for testing
  res.json({
    searchQuery: query,
    marketValue: 500,
    offerValue: 150,
    confidence: 85,
    dataPoints: 25,
    priceRange: {
      min: 400,
      max: 600
    },
    recentSales: [
      {
        id: '1',
        title: `${query} - Test Item 1`,
        price: 480,
        imageUrl: 'https://via.placeholder.com/150',
        soldDate: new Date().toISOString(),
        condition: 'Used',
        source: 'eBay'
      },
      {
        id: '2',
        title: `${query} - Test Item 2`,
        price: 520,
        imageUrl: 'https://via.placeholder.com/150',
        soldDate: new Date().toISOString(),
        condition: 'New',
        source: 'eBay'
      }
    ],
    source: 'eBay',
    message: 'Test data from simple server',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Server address:`, server.address());
});

server.on('error', (error) => {
  console.error('❌ Test server error:', error);
});
