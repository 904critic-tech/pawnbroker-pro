// Pawnshop API Health Check
// Monitors the status of the pawnshop API services

module.exports = async function handler(req, res) {
  // Enable CORS (following your existing pattern)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🏥 Pawnshop health check requested');

    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        scraper: 'operational',
        cache: 'operational'
      },
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Test eBay scraping capability (optional)
    try {
      const testUrl = 'https://www.ebay.com/sch/i.html?_nkw=test&_sacat=0&LH_Sold=1&LH_Complete=1&_ipg=1';
      const response = await fetch(testUrl, {
        method: 'HEAD',
        timeout: 5000
      });
      
      if (response.ok) {
        healthStatus.services.scraper = 'operational';
      } else {
        healthStatus.services.scraper = 'degraded';
      }
    } catch (error) {
      healthStatus.services.scraper = 'unavailable';
      console.warn('⚠️ eBay scraper test failed:', error.message);
    }

    console.log('✅ Health check completed successfully');
    
    res.status(200).json(healthStatus);

  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
