const axios = require('axios');

class CanopyAPIService {
  constructor() {
    this.baseUrl = 'https://graphql.canopyapi.co';
    this.apiKey = process.env.CANOPY_API_KEY;
    
    this.session = axios.create({
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add API key to headers if available
    if (this.apiKey) {
      this.session.defaults.headers.common['Authorization'] = `Bearer ${this.apiKey}`;
    }
  }

  /**
   * Search for Amazon products by query
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  async searchProducts(query, options = {}) {
    try {
      console.log(`🔍 Canopy API: Searching for "${query}"`);
      
      const graphqlQuery = `
        query searchAmazonProducts($query: String!, $limit: Int) {
          searchAmazonProducts(input: { 
            query: $query, 
            limit: $limit 
          }) {
            products {
              asin
              title
              brand
              mainImageUrl
              ratingsTotal
              rating
              price {
                display
                amount
                currency
              }
              features
              description
              category
              availability
            }
            totalCount
          }
        }
      `;

      const variables = {
        query: query,
        limit: options.limit || 10
      };

      const response = await this.session.post(this.baseUrl, {
        query: graphqlQuery,
        variables: variables
      });

      if (response.status === 200 && response.data?.data?.searchAmazonProducts) {
        const result = response.data.data.searchAmazonProducts;
        const products = result.products || [];
        
        console.log(`✅ Canopy API: Found ${products.length} products for "${query}"`);
        
        return {
          success: true,
          data: products.map(product => this.parseProduct(product)),
          total: result.totalCount || products.length
        };
      }
      
      return { success: false, error: 'No products found' };
      
    } catch (error) {
      console.error(`❌ Canopy API search failed for "${query}":`, error.message);
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
      console.log(`📊 Canopy API: Getting details for ASIN ${asin}`);
      
      const graphqlQuery = `
        query amazonProduct($asin: String!) {
          amazonProduct(input: { 
            asinLookup: { 
              asin: $asin 
            } 
          }) {
            asin
            title
            brand
            mainImageUrl
            ratingsTotal
            rating
            price {
              display
              amount
              currency
            }
            features
            description
            category
            availability
            specifications
            reviews {
              rating
              title
              content
              date
            }
          }
        }
      `;

      const variables = {
        asin: asin
      };

      const response = await this.session.post(this.baseUrl, {
        query: graphqlQuery,
        variables: variables
      });

      if (response.status === 200 && response.data?.data?.amazonProduct) {
        const product = response.data.data.amazonProduct;
        
        console.log(`✅ Canopy API: Retrieved details for ASIN ${asin}`);
        
        return {
          success: true,
          data: this.parseProduct(product)
        };
      }
      
      return { success: false, error: 'Product not found' };
      
    } catch (error) {
      console.error(`❌ Canopy API product details failed for ASIN ${asin}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get product price history
   * @param {string} asin - Amazon ASIN
   * @returns {Object} Price history data
   */
  async getPriceHistory(asin) {
    try {
      console.log(`📈 Canopy API: Getting price history for ASIN ${asin}`);
      
      const graphqlQuery = `
        query amazonProductPriceHistory($asin: String!) {
          amazonProductPriceHistory(input: { 
            asinLookup: { 
              asin: $asin 
            } 
          }) {
            asin
            priceHistory {
              date
              price {
                display
                amount
                currency
              }
              availability
            }
            currentPrice {
              display
              amount
              currency
            }
            lowestPrice {
              display
              amount
              currency
              date
            }
            highestPrice {
              display
              amount
              currency
              date
            }
          }
        }
      `;

      const variables = {
        asin: asin
      };

      const response = await this.session.post(this.baseUrl, {
        query: graphqlQuery,
        variables: variables
      });

      if (response.status === 200 && response.data?.data?.amazonProductPriceHistory) {
        const priceHistory = response.data.data.amazonProductPriceHistory;
        
        console.log(`✅ Canopy API: Retrieved price history for ASIN ${asin}`);
        
        return {
          success: true,
          data: this.parsePriceHistory(priceHistory)
        };
      }
      
      return { success: false, error: 'Price history not found' };
      
    } catch (error) {
      console.error(`❌ Canopy API price history failed for ASIN ${asin}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get product reviews
   * @param {string} asin - Amazon ASIN
   * @param {Object} options - Review options
   * @returns {Object} Review data
   */
  async getProductReviews(asin, options = {}) {
    try {
      console.log(`📝 Canopy API: Getting reviews for ASIN ${asin}`);
      
      const graphqlQuery = `
        query amazonProductReviews($asin: String!, $limit: Int, $rating: Int) {
          amazonProductReviews(input: { 
            asinLookup: { 
              asin: $asin 
            },
            limit: $limit,
            rating: $rating
          }) {
            asin
            reviews {
              rating
              title
              content
              date
              verified
              helpful
              reviewer
            }
            totalReviews
            averageRating
            ratingDistribution {
              rating
              count
            }
          }
        }
      `;

      const variables = {
        asin: asin,
        limit: options.limit || 10,
        rating: options.rating
      };

      const response = await this.session.post(this.baseUrl, {
        query: graphqlQuery,
        variables: variables
      });

      if (response.status === 200 && response.data?.data?.amazonProductReviews) {
        const reviews = response.data.data.amazonProductReviews;
        
        console.log(`✅ Canopy API: Retrieved ${reviews.reviews?.length || 0} reviews for ASIN ${asin}`);
        
        return {
          success: true,
          data: reviews
        };
      }
      
      return { success: false, error: 'Reviews not found' };
      
    } catch (error) {
      console.error(`❌ Canopy API reviews failed for ASIN ${asin}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse product data from Canopy API response
   * @param {Object} product - Raw product data
   * @returns {Object} Parsed product data
   */
  parseProduct(product) {
    return {
      asin: product.asin,
      title: product.title || 'Unknown Product',
      brand: product.brand,
      image: product.mainImageUrl,
      price: product.price?.display || 'Price not available',
      priceAmount: product.price?.amount,
      priceCurrency: product.price?.currency,
      rating: product.rating,
      reviewCount: product.ratingsTotal,
      features: product.features || [],
      description: product.description,
      category: product.category,
      availability: product.availability,
      specifications: product.specifications,
      url: `https://www.amazon.com/dp/${product.asin}`,
      source: 'canopy-api'
    };
  }

  /**
   * Parse price history data from Canopy API response
   * @param {Object} priceHistory - Raw price history data
   * @returns {Object} Parsed price history data
   */
  parsePriceHistory(priceHistory) {
    return {
      asin: priceHistory.asin,
      currentPrice: priceHistory.currentPrice,
      lowestPrice: priceHistory.lowestPrice,
      highestPrice: priceHistory.highestPrice,
      priceHistory: priceHistory.priceHistory?.map(entry => ({
        date: entry.date,
        price: entry.price,
        availability: entry.availability
      })) || [],
      source: 'canopy-api'
    };
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    try {
      // Test with a simple query
      const testQuery = `
        query testQuery {
          __typename
        }
      `;

      const response = await this.session.post(this.baseUrl, {
        query: testQuery
      });

      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        hasApiKey: !!this.apiKey,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        hasApiKey: !!this.apiKey
      };
    }
  }

  /**
   * Test the API with a sample ASIN
   */
  async testAPI() {
    try {
      console.log('🧪 Testing Canopy API with sample ASIN...');
      
      // Test with the ASIN from your example
      const testResult = await this.getProductDetails('B0D1XD1ZV3');
      
      if (testResult.success) {
        console.log('✅ Canopy API test successful');
        return {
          success: true,
          data: testResult.data
        };
      } else {
        console.log('❌ Canopy API test failed');
        return {
          success: false,
          error: testResult.error
        };
      }
    } catch (error) {
      console.error('❌ Canopy API test error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CanopyAPIService();
