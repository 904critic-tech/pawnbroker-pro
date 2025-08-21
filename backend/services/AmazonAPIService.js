const axios = require('axios');

class AmazonAPIService {
  constructor() {
    // AWS Credentials for Product Advertising API (from environment variables)
    this.accessKeyId = process.env.AMAZON_ACCESS_KEY_ID || 'your-access-key-id';
    this.secretAccessKey = process.env.AMAZON_SECRET_ACCESS_KEY || 'your-secret-access-key';
    this.region = process.env.AMAZON_REGION || 'us-east-1';
    
    // Amazon App Store API credentials (from environment variables)
    this.clientId = process.env.AMAZON_CLIENT_ID || 'your-client-id';
    this.clientSecret = process.env.AMAZON_CLIENT_SECRET || 'your-client-secret';
    this.securityProfileId = process.env.AMAZON_SECURITY_PROFILE_ID || 'your-security-profile-id';
    this.apiKey = process.env.AMAZON_API_KEY || 'your-api-key';
    
    // Product Advertising API endpoints
    this.paapiEndpoint = 'https://webservices.amazon.com/paapi5/searchitems';
    this.paapiHost = 'webservices.amazon.com';
    
    // AWS SDK for signing requests
    this.aws4 = require('aws4');
  }

  /**
   * Get access token for Amazon API
   */
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const tokenResponse = await axios.post('https://api.amazon.com/auth/o2/token', {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'appstore::apps:readwrite'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = tokenResponse.data.access_token;
      this.tokenExpiry = Date.now() + (tokenResponse.data.expires_in * 1000);
      
      console.log('✅ Amazon API access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get Amazon API access token:', error.message);
      return null;
    }
  }

  /**
   * Search Amazon products using Product Advertising API
   */
  async searchProducts(query, limit = 10) {
    try {
      console.log(`🔍 Searching Amazon for: ${query}`);
      
      const searchPayload = {
        Keywords: query,
        SearchIndex: 'All',
        ItemCount: Math.min(limit, 10),
        Resources: [
          'ItemInfo.Title',
          'Offers.Listings.Price',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating',
          'Images.Primary.Medium'
        ]
      };

      // Sign the request with AWS credentials
      const signedRequest = this.aws4.sign({
        hostname: this.paapiHost,
        path: '/paapi5/searchitems',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
        },
        body: JSON.stringify(searchPayload)
      }, {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
        region: this.region
      });

      const response = await axios({
        method: 'POST',
        url: this.paapiEndpoint,
        headers: signedRequest.headers,
        data: searchPayload
      });

      if (response.data && response.data.SearchResult && response.data.SearchResult.Items) {
        const items = response.data.SearchResult.Items.map(item => ({
          asin: item.ASIN,
          title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
          price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'Price not available',
          image: item.Images?.Primary?.Medium?.URL,
          rating: item.CustomerReviews?.StarRating?.Value || 0,
          reviewCount: item.CustomerReviews?.Count || 0,
          url: `https://www.amazon.com/dp/${item.ASIN}`,
          source: 'amazon'
        }));

        console.log(`✅ Found ${items.length} Amazon products for "${query}"`);
        return {
          success: true,
          data: items,
          total: items.length
        };
      }

      return { success: false, error: 'No products found' };

    } catch (error) {
      console.error(`❌ Amazon API search failed for "${query}":`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get product details by ASIN
   */
  async getProductDetails(asin) {
    try {
      console.log(`📊 Getting Amazon product details for ASIN: ${asin}`);
      
      const detailsPayload = {
        ItemIds: [asin],
        Resources: [
          'ItemInfo.Title',
          'Offers.Listings.Price',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating',
          'Images.Primary.Large',
          'ItemInfo.Features',
          'ItemInfo.ByLineInfo'
        ]
      };

      const signedRequest = this.aws4.sign({
        hostname: this.paapiHost,
        path: '/paapi5/getitems',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
        },
        body: JSON.stringify(detailsPayload)
      }, {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
        region: this.region
      });

      const response = await axios({
        method: 'POST',
        url: 'https://webservices.amazon.com/paapi5/getitems',
        headers: signedRequest.headers,
        data: detailsPayload
      });

      if (response.data && response.data.ItemsResult && response.data.ItemsResult.Items) {
        const item = response.data.ItemsResult.Items[0];
        const productDetails = {
          asin: item.ASIN,
          title: item.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
          price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'Price not available',
          image: item.Images?.Primary?.Large?.URL,
          rating: item.CustomerReviews?.StarRating?.Value || 0,
          reviewCount: item.CustomerReviews?.Count || 0,
          features: item.ItemInfo?.Features?.DisplayValues || [],
          brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
          manufacturer: item.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue,
          url: `https://www.amazon.com/dp/${item.ASIN}`,
          source: 'amazon'
        };

        console.log(`✅ Retrieved Amazon product details for ASIN: ${asin}`);
        return {
          success: true,
          data: productDetails
        };
      }

      return { success: false, error: 'Product not found' };

    } catch (error) {
      console.error(`❌ Failed to get Amazon product details for ASIN ${asin}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    try {
      const hasCredentials = !!(this.accessKeyId && this.secretAccessKey && 
                               this.accessKeyId !== 'your-access-key-id' && 
                               this.secretAccessKey !== 'your-secret-access-key');
      
      return {
        status: hasCredentials ? 'configured' : 'not-configured',
        timestamp: new Date().toISOString(),
        hasCredentials: hasCredentials,
        region: this.region
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new AmazonAPIService();
