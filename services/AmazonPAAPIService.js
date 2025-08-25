const axios = require('axios');
const crypto = require('crypto');

class AmazonPAAPIService {
  constructor() {
    this.baseUrl = 'https://webservices.amazon.com';
    this.associateTag = process.env.AMAZON_ASSOCIATE_TAG || 'streamautocli-20';
    this.accessKeyId = process.env.AMAZON_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.AMAZON_SECRET_ACCESS_KEY;
    this.region = process.env.AMAZON_REGION || 'us-east-1';
    
    this.session = axios.create({
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Generate AWS Signature Version 4 signature
   */
  generateSignature(stringToSign, dateStamp, region, service) {
    const kDate = crypto.createHmac('sha256', 'AWS4' + this.secretAccessKey).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    
    return crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  }

  /**
   * Create signed request headers
   */
  createSignedHeaders(method, path, body, service = 'ProductAdvertisingAPI') {
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = timestamp.substring(0, 8);
    
    const headers = {
      'Host': 'webservices.amazon.com',
      'Content-Type': 'application/json',
      'X-Amz-Date': timestamp,
      'X-Amz-Target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${method}`
    };

    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase() + ':' + headers[key])
      .join('\n') + '\n';

    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');

    const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex');
    
    const canonicalRequest = [
      'POST',
      path,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      timestamp,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    const signature = this.generateSignature(stringToSign, dateStamp, this.region, service);

    headers['Authorization'] = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return headers;
  }

  /**
   * Search for products
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  async searchProducts(query, options = {}) {
    try {
      console.log(`🔍 Amazon PAAPI: Searching for "${query}"`);
      
      if (!this.accessKeyId || !this.secretAccessKey) {
        throw new Error('Amazon PAAPI credentials not configured');
      }

      const searchIndex = options.searchIndex || 'All';
      const itemCount = options.itemCount || 10;
      const resources = options.resources || [
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'Images.Primary.Medium',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ExternalIds',
        'ItemInfo.ContentInfo',
        'ItemInfo.ManufactureInfo',
        'ItemInfo.TechnicalInfo'
      ];

      const requestBody = {
        Keywords: query,
        SearchIndex: searchIndex,
        ItemCount: itemCount,
        Resources: resources,
        PartnerTag: this.associateTag,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.com'
      };

      const headers = this.createSignedHeaders('SearchItems', '/paapi5/searchitems', JSON.stringify(requestBody));
      
      const response = await this.session.post('/paapi5/searchitems', requestBody, { headers });
      
      if (response.status === 200 && response.data) {
        const items = response.data.SearchResult?.Items || [];
        console.log(`✅ Amazon PAAPI: Found ${items.length} products for "${query}"`);
        
        return {
          success: true,
          data: items.map(item => this.parseProduct(item)),
          total: items.length
        };
      }
      
      return { success: false, error: 'No products found' };
      
    } catch (error) {
      console.error(`❌ Amazon PAAPI search failed for "${query}":`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get product details by ASIN
   * @param {string} asin - Amazon ASIN
   * @returns {Object} Product details
   */
  async getProductDetails(asin) {
    try {
      console.log(`📊 Amazon PAAPI: Getting details for ASIN ${asin}`);
      
      if (!this.accessKeyId || !this.secretAccessKey) {
        throw new Error('Amazon PAAPI credentials not configured');
      }

      const resources = [
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'Images.Primary.Large',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ExternalIds',
        'ItemInfo.ContentInfo',
        'ItemInfo.ManufactureInfo',
        'ItemInfo.TechnicalInfo',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating'
      ];

      const requestBody = {
        ItemIds: [asin],
        Resources: resources,
        PartnerTag: this.associateTag,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.com'
      };

      const headers = this.createSignedHeaders('GetItems', '/paapi5/getitems', JSON.stringify(requestBody));
      
      const response = await this.session.post('/paapi5/getitems', requestBody, { headers });
      
      if (response.status === 200 && response.data) {
        const items = response.data.ItemsResult?.Items || [];
        if (items.length > 0) {
          console.log(`✅ Amazon PAAPI: Retrieved details for ASIN ${asin}`);
          return {
            success: true,
            data: this.parseProduct(items[0])
          };
        }
      }
      
      return { success: false, error: 'Product not found' };
      
    } catch (error) {
      console.error(`❌ Amazon PAAPI product details failed for ASIN ${asin}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Amazon product data
   * @param {Object} item - Amazon product item
   * @returns {Object} Parsed product data
   */
  parseProduct(item) {
    const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown Product';
    const price = item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'Price not available';
    const image = item.Images?.Primary?.Large?.URL || item.Images?.Primary?.Medium?.URL;
    const features = item.ItemInfo?.Features?.DisplayValues || [];
    const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue;
    const manufacturer = item.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue;
    const reviewCount = item.CustomerReviews?.Count || 0;
    const starRating = item.CustomerReviews?.StarRating?.Value || 0;
    
    return {
      asin: item.ASIN,
      title: title,
      price: price,
      image: image,
      features: features,
      brand: brand,
      manufacturer: manufacturer,
      reviewCount: reviewCount,
      starRating: starRating,
      url: `https://www.amazon.com/dp/${item.ASIN}?tag=${this.associateTag}`,
      source: 'amazon-paapi'
    };
  }

  /**
   * Get browse nodes (categories)
   * @param {Array} browseNodeIds - Browse node IDs
   * @returns {Object} Browse node data
   */
  async getBrowseNodes(browseNodeIds) {
    try {
      console.log(`📂 Amazon PAAPI: Getting browse nodes for ${browseNodeIds.length} nodes`);
      
      if (!this.accessKeyId || !this.secretAccessKey) {
        throw new Error('Amazon PAAPI credentials not configured');
      }

      const resources = [
        'BrowseNodes.Ancestor',
        'BrowseNodes.Children'
      ];

      const requestBody = {
        BrowseNodeIds: browseNodeIds,
        Resources: resources,
        PartnerTag: this.associateTag,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.com'
      };

      const headers = this.createSignedHeaders('GetBrowseNodes', '/paapi5/getbrowsenodes', JSON.stringify(requestBody));
      
      const response = await this.session.post('/paapi5/getbrowsenodes', requestBody, { headers });
      
      if (response.status === 200 && response.data) {
        const browseNodes = response.data.BrowseNodesResult?.BrowseNodes || [];
        console.log(`✅ Amazon PAAPI: Retrieved ${browseNodes.length} browse nodes`);
        return {
          success: true,
          data: browseNodes
        };
      }
      
      return { success: false, error: 'Browse nodes not found' };
      
    } catch (error) {
      console.error(`❌ Amazon PAAPI browse nodes failed:`, error.message);
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
      const hasCredentials = !!(this.accessKeyId && this.secretAccessKey);
      return {
        status: hasCredentials ? 'configured' : 'not-configured',
        timestamp: new Date().toISOString(),
        associateTag: this.associateTag,
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

module.exports = new AmazonPAAPIService();
