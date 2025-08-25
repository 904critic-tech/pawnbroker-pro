const axios = require('axios');

class LambdaService {
  constructor() {
    this.lambdaUrl = 'https://5opd4n4a4yk4t2hs7efwcmplbm0cmidw.lambda-url.us-east-2.on.aws/';
    this.timeout = 30000; // 30 seconds
  }

  async getPricingEstimate(itemName) {
    try {
      console.log(`🔍 Calling Lambda for pricing estimate: ${itemName}`);
      
      const response = await axios.post(this.lambdaUrl, {
        itemName: itemName
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      if (response.data && response.data.success) {
        console.log(`✅ Lambda pricing estimate successful for: ${itemName}`);
        return response.data.data;
      } else {
        console.log(`⚠️ Lambda returned no data for: ${itemName}`);
        throw new Error(response.data?.error || 'Lambda returned no data');
      }

    } catch (error) {
      console.error(`❌ Lambda pricing estimate failed for ${itemName}:`, error.message);
      
      // If Lambda fails, we'll fall back to local eBay scraper
      console.log(`🔄 Falling back to local eBay scraper for: ${itemName}`);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await axios.post(this.lambdaUrl, {
        itemName: 'test'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }
}

module.exports = new LambdaService();
