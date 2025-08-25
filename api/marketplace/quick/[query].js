const { MarketDataAggregatorService } = require('../../../services/MarketDataAggregator');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`Getting quick market estimate for: ${query}`);
    const result = await MarketDataAggregatorService.getQuickMarketEstimate(query);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Quick market estimate error:', error);
    res.status(500).json({ 
      error: 'Failed to get quick market estimate',
      message: error.message 
    });
  }
};
