const axios = require('axios');
const cheerio = require('cheerio');

class eBayScraperService {
  constructor() {
    this.baseUrl = 'https://www.ebay.com/sch/i.html';
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  async searchSoldItems(query, limit = 25) {
    // Rate limiting to avoid being blocked
    await this.rateLimit();
    
    const strategies = [
      () => this.strategy1(query, limit),
      () => this.strategy2(query, limit),
      () => this.strategy3(query, limit),
      () => this.strategy4(query, limit)
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Trying eBay scraping strategy ${i + 1} for: ${query}`);
        const result = await Promise.race([
          strategies[i](),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]);
        
        if (result && result.items && result.items.length > 0) {
          console.log(`Strategy ${i + 1} successful - found ${result.items.length} items`);
          return result;
        }
      } catch (error) {
        console.log(`Strategy ${i + 1} failed: ${error.message}`);
        continue;
      }
    }

    throw new Error('All eBay scraping strategies failed');
  }

  // Strategy 1: Standard search with comprehensive headers
  async strategy1(query, limit) {
    const searchParams = new URLSearchParams({
      '_nkw': query,
      '_sacat': '0',
      'LH_Sold': '1',
      'LH_Complete': '1',
      '_sop': '13',
      '_ipg': limit.toString()
    });

    const url = `${this.baseUrl}?${searchParams}`;
    
    const response = await axios.get(url, {
      headers: this.getHeaders(),
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400
    });

    return this.parseSearchResults(response.data, query);
  }

  // Strategy 2: Alternative URL format with different parameters
  async strategy2(query, limit) {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1&_sop=13&_ipg=${limit}&_dmd=2`;
    
    const response = await axios.get(url, {
      headers: this.getHeaders(),
      timeout: 15000,
      maxRedirects: 5
    });

    return this.parseSearchResults(response.data, query);
  }

  // Strategy 3: Mobile user agent with simplified headers
  async strategy3(query, limit) {
    const searchParams = new URLSearchParams({
      '_nkw': query,
      'LH_Sold': '1',
      'LH_Complete': '1',
      '_sop': '13',
      '_ipg': limit.toString()
    });

    const url = `${this.baseUrl}?${searchParams}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    return this.parseSearchResults(response.data, query);
  }

  // Strategy 4: Direct search with minimal parameters
  async strategy4(query, limit) {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&_ipg=${limit}`;
    
    const response = await axios.get(url, {
      headers: this.getHeaders(),
      timeout: 15000,
      maxRedirects: 5
    });

    return this.parseSearchResults(response.data, query);
  }

  getHeaders() {
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    
    return {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'DNT': '1',
      'Referer': 'https://www.ebay.com/',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    };
  }

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Ensure at least 2 seconds between requests
    if (timeSinceLastRequest < 2000) {
      const waitTime = 2000 - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  parseSearchResults(html, query) {
    const $ = cheerio.load(html);
    const items = [];

    console.log('Parsing eBay search results...');

    // Multiple selectors to handle different eBay layouts
    const selectors = [
      '.s-item',
      '[data-testid="s-item"]',
      '.srp-results .s-item',
      '.srp-results [data-testid="s-item"]',
      '.sresult',
      '.srp-results .sresult',
      '.item',
      '.srp-results .item'
    ];

    let foundItems = false;
    
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`Trying selector "${selector}": found ${elements.length} elements`);
      
      if (elements.length > 0) {
        elements.each((index, element) => {
          try {
            const item = this.extractItemData($, element, selector);
            if (item && item.price > 0) {
              items.push(item);
            }
          } catch (error) {
            console.log(`Failed to extract item ${index}: ${error.message}`);
          }
        });
        
        if (items.length > 0) {
          foundItems = true;
          break;
        }
      }
    }

    if (!foundItems) {
      console.log('No items found with any selector. HTML structure might have changed.');
      console.log('First 500 characters of HTML:', html.substring(0, 500));
      
      // Try alternative parsing methods
      const alternativeItems = this.parseAlternativeStructure($);
      if (alternativeItems.length > 0) {
        console.log(`Found ${alternativeItems.length} items using alternative parsing`);
        items.push(...alternativeItems);
        foundItems = true;
      }
    }

    // Filter out placeholder items and low-quality results
    const filteredItems = items.filter(item => {
      // Remove "Shop on eBay" placeholder items
      if (item.title === 'Shop on eBay' || item.title?.includes('Shop on eBay')) {
        return false;
      }
      
      // Remove items with very low prices that might be placeholders
      if (item.price < 5) {
        return false;
      }
      
      // Remove items with generic titles
      if (item.title && (
        item.title.toLowerCase().includes('click here') ||
        item.title.toLowerCase().includes('see details') ||
        item.title.toLowerCase().includes('view item')
      )) {
        return false;
      }
      
      return true;
    });

    console.log(`Successfully parsed ${filteredItems.length} items for query: ${query} (filtered from ${items.length} total)`);

    if (filteredItems.length === 0) {
      throw new Error('No valid sold items found after filtering');
    }

    // Calculate statistics using filtered items
    const prices = filteredItems.map(item => item.price).filter(price => price > 0);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      items: filteredItems,
      totalFound: filteredItems.length,
      averagePrice: avgPrice,
      minPrice,
      maxPrice
    };
  }

  extractItemData($, element, selector) {
    const $el = $(element);
    
    // Multiple price selectors
    const priceSelectors = [
      '.s-item__price',
      '.s-item__price span',
      '[data-testid="s-item__price"]',
      '.price',
      '.sresult .price',
      '.item .price'
    ];

    let price = 0;
    for (const priceSelector of priceSelectors) {
      const priceText = $el.find(priceSelector).first().text().trim();
      if (priceText) {
        price = this.extractPrice(priceText);
        if (price > 0) break;
      }
    }

    // Multiple title selectors
    const titleSelectors = [
      '.s-item__title',
      '[data-testid="s-item__title"]',
      '.sresult .title',
      '.item .title',
      'h3',
      'h2'
    ];

    let title = '';
    for (const titleSelector of titleSelectors) {
      title = $el.find(titleSelector).first().text().trim();
      if (title) break;
    }

    // Multiple image selectors
    const imageSelectors = [
      '.s-item__image img',
      '[data-testid="s-item__image"] img',
      '.sresult img',
      '.item img',
      'img'
    ];

    let imageUrl = '';
    for (const imageSelector of imageSelectors) {
      imageUrl = $el.find(imageSelector).first().attr('src') || '';
      if (imageUrl) break;
    }

    // Multiple link selectors
    const linkSelectors = [
      '.s-item__link',
      '[data-testid="s-item__link"]',
      '.sresult a',
      '.item a',
      'a'
    ];

    let url = '';
    for (const linkSelector of linkSelectors) {
      url = $el.find(linkSelector).first().attr('href') || '';
      if (url && url.includes('ebay.com')) break;
    }

    // Extract sold date
    const dateSelectors = [
      '.s-item__title--tagblock .POSITIVE',
      '.s-item__title--tagblock span',
      '.sresult .date',
      '.item .date'
    ];

    let soldDate = new Date().toISOString();
    for (const dateSelector of dateSelectors) {
      const dateText = $el.find(dateSelector).first().text().trim();
      if (dateText) {
        soldDate = this.parseSoldDate(dateText);
        break;
      }
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      title: title || 'Unknown Item',
      price: price,
      imageUrl: imageUrl,
      url: url,
      soldDate: soldDate,
      condition: this.estimateCondition(title),
      source: 'ebay'
    };
  }

  parseAlternativeStructure($) {
    const items = [];
    
    // Look for any elements that might contain item data
    $('div, article, li').each((index, element) => {
      const $el = $(element);
      const text = $el.text();
      
      // Check if this element looks like an item (contains price-like text)
      if (text.match(/\$\d+/) && text.length > 20 && text.length < 500) {
        try {
          const priceMatch = text.match(/\$([\d,]+\.?\d*)/);
          if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (price > 0 && price < 100000) { // Reasonable price range
              items.push({
                id: Math.random().toString(36).substr(2, 9),
                title: text.substring(0, 100).trim(),
                price: price,
                imageUrl: '',
                url: '',
                soldDate: new Date().toISOString(),
                condition: 'Used',
                source: 'ebay'
              });
            }
          }
        } catch (error) {
          // Skip this element
        }
      }
    });

    return items;
  }

  extractPrice(priceText) {
    // Remove currency symbols and commas, extract numeric value
    const match = priceText.match(/[\$£€]?([\d,]+\.?\d*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  }

  parseSoldDate(dateText) {
    const now = new Date();
    
    if (dateText.includes('Today')) {
      return now.toISOString();
    }
    
    if (dateText.includes('Yesterday')) {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return yesterday.toISOString();
    }
    
    // Try to parse other date formats
    const match = dateText.match(/(\d+)\s+(day|week|month)s?\s+ago/);
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2];
      
      let milliseconds;
      switch (unit) {
        case 'day':
          milliseconds = amount * 24 * 60 * 60 * 1000;
          break;
        case 'week':
          milliseconds = amount * 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          milliseconds = amount * 30 * 24 * 60 * 60 * 1000;
          break;
        default:
          milliseconds = 0;
      }
      
      const date = new Date(now.getTime() - milliseconds);
      return date.toISOString();
    }
    
    return now.toISOString();
  }

  estimateCondition(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('new') || titleLower.includes('brand new')) {
      return 'New';
    } else if (titleLower.includes('excellent') || titleLower.includes('mint')) {
      return 'Excellent';
    } else if (titleLower.includes('good') || titleLower.includes('like new')) {
      return 'Good';
    } else if (titleLower.includes('fair') || titleLower.includes('acceptable')) {
      return 'Fair';
    } else if (titleLower.includes('poor') || titleLower.includes('damaged')) {
      return 'Poor';
    }
    
    return 'Used';
  }

  calculateAveragePrice(items) {
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + item.price, 0);
    return Math.round(total / items.length);
  }

  async getPricingEstimate(query) {
    try {
      const searchResults = await this.searchSoldItems(query, 25);
      
      if (searchResults.items.length === 0) {
        throw new Error('No sold items found');
      }

      const prices = searchResults.items.map(item => item.price);
      const avgPrice = searchResults.averagePrice;
      const minPrice = searchResults.minPrice;
      const maxPrice = searchResults.maxPrice;

      // Calculate confidence based on data quality
      const dataPointsScore = Math.min(searchResults.totalFound / 50, 1);
      const priceConsistency = this.calculatePriceConsistency(prices);
      const confidence = (dataPointsScore * 0.7 + priceConsistency * 0.3);

      // Calculate pawn value (30% of market value)
      const marketValue = avgPrice;
      const pawnValue = Math.round(marketValue * 0.3);

      return {
        marketValue,
        pawnValue,
        confidence: Math.min(confidence, 0.95),
        dataPoints: searchResults.totalFound,
        priceRange: {
          min: minPrice,
          max: maxPrice,
          avg: avgPrice
        },
        recentSales: searchResults.items.slice(0, 10)
      };

    } catch (error) {
      console.error('Pricing estimate error:', error);
      throw new Error(`Failed to get pricing estimate for "${query}": ${error.message}`);
    }
  }

  calculatePriceConsistency(prices) {
    if (prices.length < 2) return 0.5;
    
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Calculate coefficient of variation (lower = more consistent)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgPrice;
    
    // Convert to consistency score (0-1, higher = more consistent)
    return Math.max(0, 1 - coefficientOfVariation);
  }
}

module.exports = new eBayScraperService();
