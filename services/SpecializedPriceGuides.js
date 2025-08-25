const axios = require('axios');
const cheerio = require('cheerio');

class SpecializedPriceGuidesService {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  getHeaders() {
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    return {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  // Jewelry: GIA and Rapaport for diamonds
  async getJewelryPricing(itemName) {
    try {
      const jewelryData = {
        source: 'specialized_jewelry',
        confidence: 0.8,
        dataPoints: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        note: 'Industry-standard jewelry valuation'
      };

      // Check if it's a diamond item
      if (itemName.toLowerCase().includes('diamond')) {
        const diamondData = await this.getDiamondPricing(itemName);
        if (diamondData) {
          return { ...jewelryData, ...diamondData };
        }
      }

      // Check if it's a gold item
      if (itemName.toLowerCase().includes('gold')) {
        const goldData = await this.getGoldPricing(itemName);
        if (goldData) {
          return { ...jewelryData, ...goldData };
        }
      }

      return null;
    } catch (error) {
      console.log(`Jewelry pricing failed: ${error.message}`);
      return null;
    }
  }

  async getDiamondPricing(itemName) {
    try {
      // Extract carat weight from item name
      const caratMatch = itemName.match(/(\d+(?:\.\d+)?)\s*carat/i);
      const carat = caratMatch ? parseFloat(caratMatch[1]) : 1.0;

      // TODO: Integrate Rapaport or other diamond price API
      // Example: Fetch Rapaport price per carat (pseudo-code)
      // const rapaportPrice = await fetchRapaportPrice(carat);
      // For now, return null and note missing integration
      return {
        marketValue: null,
        pawnValue: null,
        confidence: 0,
        dataPoints: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        note: `Diamond valuation requires real-time Rapaport API integration.`
      };
    } catch (error) {
      console.log(`Diamond pricing failed: ${error.message}`);
      return null;
    }
  }

  async getGoldPricing(itemName) {
    try {
      // Extract gold weight from item name
      const weightMatch = itemName.match(/(\d+(?:\.\d+)?)\s*(?:gram|g|ounce|oz)/i);
      const weight = weightMatch ? parseFloat(weightMatch[1]) : 10; // Default 10g

      // Fetch real-time gold price per gram from Metals-API
      const apiKey = process.env.METALS_API_KEY;
      const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XAU`;
      const response = await axios.get(url);
      // XAU price per troy ounce, convert to grams
      const pricePerOunce = response.data.rates.XAU;
      const gramsPerOunce = 31.1035;
      const goldPricePerGram = pricePerOunce / gramsPerOunce;
      const marketValue = Math.round(weight * goldPricePerGram);

      return {
        marketValue,
        pawnValue: Math.round(marketValue * 0.4),
        confidence: 0.95,
        dataPoints: 1,
        priceRange: { min: marketValue * 0.98, max: marketValue * 1.02, avg: marketValue },
        note: `Gold valuation based on ${weight}g weight and live market price.`
      };
    } catch (error) {
      console.log(`Gold pricing failed: ${error.message}`);
      return null;
    }
  }

  // Electronics: GSMArena for phones
  async getElectronicsPricing(itemName) {
    try {
      const electronicsData = {
        source: 'specialized_electronics',
        confidence: 0.75,
        dataPoints: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        note: 'Industry-standard electronics valuation'
      };

      // Check if it's a phone
      if (this.isPhone(itemName)) {
        const phoneData = await this.getPhonePricing(itemName);
        if (phoneData) {
          return { ...electronicsData, ...phoneData };
        }
      }

      // Check if it's a laptop
      if (this.isLaptop(itemName)) {
        const laptopData = await this.getLaptopPricing(itemName);
        if (laptopData) {
          return { ...electronicsData, ...laptopData };
        }
      }

      return null;
    } catch (error) {
      console.log(`Electronics pricing failed: ${error.message}`);
      return null;
    }
  }

  isPhone(itemName) {
    const phoneKeywords = ['iphone', 'samsung', 'galaxy', 'phone', 'smartphone', 'mobile'];
    return phoneKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
  }

  isLaptop(itemName) {
    const laptopKeywords = ['macbook', 'laptop', 'notebook', 'computer', 'pc'];
    return laptopKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
  }

  async getPhonePricing(itemName) {
    try {
      // Fetch live used price from eBay for the given phone model
      const eBayAPIService = require('./eBayAPIService');
      const result = await eBayAPIService.getAverageUsedPrice(itemName);
      if (result && result.marketValue) {
        return {
          marketValue: result.marketValue,
          pawnValue: Math.round(result.marketValue * 0.3),
          confidence: result.confidence || 0.9,
          dataPoints: result.dataPoints || 1,
          priceRange: result.priceRange || { min: result.marketValue * 0.8, max: result.marketValue * 1.2, avg: result.marketValue },
          note: `Phone valuation based on live eBay data for ${itemName}`
        };
      }
      return null;
    } catch (error) {
      console.log(`Phone pricing failed: ${error.message}`);
      return null;
    }
  }

  async getLaptopPricing(itemName) {
    try {
      // Fetch live used price from eBay for the given laptop model
      const eBayAPIService = require('./eBayAPIService');
      const result = await eBayAPIService.getAverageUsedPrice(itemName);
      if (result && result.marketValue) {
        return {
          marketValue: result.marketValue,
          pawnValue: Math.round(result.marketValue * 0.25),
          confidence: result.confidence || 0.9,
          dataPoints: result.dataPoints || 1,
          priceRange: result.priceRange || { min: result.marketValue * 0.8, max: result.marketValue * 1.2, avg: result.marketValue },
          note: `Laptop valuation based on live eBay data for ${itemName}`
        };
      }
      return null;
    } catch (error) {
      console.log(`Laptop pricing failed: ${error.message}`);
      return null;
    }
  }

  // Watches: Chrono24 for luxury watches
  async getWatchPricing(itemName) {
    try {
      const watchData = {
        source: 'specialized_watches',
        confidence: 0.8,
        dataPoints: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        note: 'Industry-standard watch valuation'
      };

      // Check if it's a luxury watch
      if (this.isLuxuryWatch(itemName)) {
        const luxuryWatchData = await this.getLuxuryWatchPricing(itemName);
        if (luxuryWatchData) {
          return { ...watchData, ...luxuryWatchData };
        }
      }

      return null;
    } catch (error) {
      console.log(`Watch pricing failed: ${error.message}`);
      return null;
    }
  }

  isLuxuryWatch(itemName) {
    const luxuryBrands = ['rolex', 'omega', 'cartier', 'breitling', 'tag heuer', 'patek philippe', 'audemars piguet'];
    return luxuryBrands.some(brand => itemName.toLowerCase().includes(brand));
  }

  async getLuxuryWatchPricing(itemName) {
    try {
      // Fetch live used price from eBay for the given luxury watch model
      const eBayAPIService = require('./eBayAPIService');
      const result = await eBayAPIService.getAverageUsedPrice(itemName);
      if (result && result.marketValue) {
        return {
          marketValue: result.marketValue,
          pawnValue: Math.round(result.marketValue * 0.3),
          confidence: result.confidence || 0.9,
          dataPoints: result.dataPoints || 1,
          priceRange: result.priceRange || { min: result.marketValue * 0.8, max: result.marketValue * 1.2, avg: result.marketValue },
          note: `Luxury watch valuation based on live eBay data for ${itemName}`
        };
      }
      return null;
    } catch (error) {
      console.log(`Luxury watch pricing failed: ${error.message}`);
      return null;
    }
  }

  isVideoGame(itemName) {
    const gameKeywords = ['game', 'nintendo', 'playstation', 'xbox', 'sega', 'atari', 'mario', 'zelda', 'pokemon', 'sonic', 'final fantasy', 'call of duty', 'fifa', 'madden'];
    return gameKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
  }

  async getGamePricing(itemName) {
    try {
      // Video game pricing database (simplified - would use PriceCharting API)
      const gamePrices = {
        // Retro Nintendo
        'super mario bros': { new: 0, used: 25, confidence: 0.95 },
        'legend of zelda': { new: 0, used: 35, confidence: 0.95 },
        'pokemon red': { new: 0, used: 45, confidence: 0.9 },
        'pokemon blue': { new: 0, used: 45, confidence: 0.9 },
        'super mario 64': { new: 0, used: 40, confidence: 0.9 },
        'ocarina of time': { new: 0, used: 50, confidence: 0.9 },
        
        // Modern Games
        'call of duty': { new: 60, used: 25, confidence: 0.8 },
        'fifa': { new: 60, used: 30, confidence: 0.8 },
        'madden': { new: 60, used: 30, confidence: 0.8 },
        'grand theft auto': { new: 60, used: 35, confidence: 0.85 },
        
        // Consoles
        'nintendo switch': { new: 300, used: 200, confidence: 0.9 },
        'playstation 5': { new: 500, used: 400, confidence: 0.9 },
        'xbox series x': { new: 500, used: 400, confidence: 0.9 },
        'nintendo 64': { new: 0, used: 80, confidence: 0.85 },
        'gamecube': { new: 0, used: 60, confidence: 0.85 },
        'playstation 2': { new: 0, used: 40, confidence: 0.85 }
      };

      const itemLower = itemName.toLowerCase();
      let bestMatch = null;
      let bestScore = 0;

      for (const [game, data] of Object.entries(gamePrices)) {
        const score = this.calculateSimilarity(itemLower, game);
        if (score > bestScore && score > 0.6) {
          bestScore = score;
          bestMatch = { game, ...data };
        }
      }

      if (bestMatch) {
        const marketValue = bestMatch.used || bestMatch.new;
        return {
          marketValue,
          pawnValue: Math.round(marketValue * 0.2), // Lower pawn value for games
          confidence: bestMatch.confidence,
          dataPoints: 1,
          priceRange: { min: marketValue * 0.8, max: marketValue * 1.2, avg: marketValue },
          note: `Video game valuation based on ${bestMatch.game}`
        };
      }

      return null;
    } catch (error) {
      console.log(`Game pricing failed: ${error.message}`);
      return null;
    }
  }

  // Sneakers: StockX for limited edition and popular sneakers
  async getSneakerPricing(itemName) {
    try {
      const sneakerData = {
        source: 'stockx_sneakers',
        confidence: 0.9,
        dataPoints: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        note: 'StockX market data for sneakers'
      };

      // Check if it's a sneaker
      if (this.isSneaker(itemName)) {
        const sneakerPricing = await this.getSneakerPricingData(itemName);
        if (sneakerPricing) {
          return { ...sneakerData, ...sneakerPricing };
        }
      }

      return null;
    } catch (error) {
      console.log(`Sneaker pricing failed: ${error.message}`);
      return null;
    }
  }

  isSneaker(itemName) {
    const sneakerKeywords = ['jordan', 'nike', 'adidas', 'yeezy', 'air force', 'dunk', 'converse', 'vans', 'sneaker', 'shoe', 'jordans'];
    return sneakerKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
  }

  async getSneakerPricingData(itemName) {
    try {
      // Fetch live used price from eBay for the given sneaker model
      const eBayAPIService = require('./eBayAPIService');
      const result = await eBayAPIService.getAverageUsedPrice(itemName);
      if (result && result.marketValue) {
        return {
          marketValue: result.marketValue,
          pawnValue: Math.round(result.marketValue * 0.25),
          confidence: result.confidence || 0.9,
          dataPoints: result.dataPoints || 1,
          priceRange: result.priceRange || { min: result.marketValue * 0.8, max: result.marketValue * 1.3, avg: result.marketValue },
          note: `Sneaker valuation based on live eBay data for ${itemName}`
        };
      }
      return null;
    } catch (error) {
      console.log(`Sneaker pricing data failed: ${error.message}`);
      return null;
    }
  }

  // Coins: CoinTrackers for numismatic and bullion coins
  async getCoinPricing(itemName) {
    try {
      const coinData = {
        source: 'cointrackers_coins',
        confidence: 0.9,
        dataPoints: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        note: 'CoinTrackers market data for coins'
      };

      // Check if it's a coin
      if (this.isCoin(itemName)) {
        const coinPricing = await this.getCoinPricingData(itemName);
        if (coinPricing) {
          return { ...coinData, ...coinPricing };
        }
      }

      return null;
    } catch (error) {
      console.log(`Coin pricing failed: ${error.message}`);
      return null;
    }
  }

  isCoin(itemName) {
    const coinKeywords = ['coin', 'silver', 'gold', 'platinum', 'palladium', 'eagle', 'buffalo', 'liberty', 'morgan', 'peace', 'quarter', 'dime', 'nickel', 'penny'];
    return coinKeywords.some(keyword => itemName.toLowerCase().includes(keyword));
  }

  async getCoinPricingData(itemName) {
    try {
      // Bullion coins: fetch live price from Metals-API
      const apiKey = process.env.METALS_API_KEY;
      const itemLower = itemName.toLowerCase();
      let marketValue = null;
      let note = '';
      let confidence = 0.95;
      let pawnValue = null;
      let priceRange = null;

      if (itemLower.includes('gold')) {
        // Gold coin: get XAU price per troy ounce
        const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XAU`;
        const response = await require('axios').get(url);
        const pricePerOunce = response.data.rates.XAU;
        // Most gold coins are 1 troy ounce
        marketValue = pricePerOunce;
        pawnValue = Math.round(marketValue * 0.6);
        priceRange = { min: marketValue * 0.98, max: marketValue * 1.02, avg: marketValue };
        note = 'Live gold price from Metals-API';
      } else if (itemLower.includes('silver')) {
        // Silver coin: get XAG price per troy ounce
        const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XAG`;
        const response = await require('axios').get(url);
        const pricePerOunce = response.data.rates.XAG;
        marketValue = pricePerOunce;
        pawnValue = Math.round(marketValue * 0.6);
        priceRange = { min: marketValue * 0.98, max: marketValue * 1.02, avg: marketValue };
        note = 'Live silver price from Metals-API';
      } else {
        // Numismatic/modern coins: TODO integrate CoinTrackers or other API
        note = 'Numismatic coin pricing requires CoinTrackers or similar API integration.';
        confidence = 0.5;
      }

      if (marketValue) {
        return {
          marketValue,
          pawnValue,
          confidence,
          dataPoints: 1,
          priceRange,
          note
        };
      }
      return {
        marketValue: null,
        pawnValue: null,
        confidence,
        dataPoints: 0,
        priceRange: { min: 0, max: 0, avg: 0 },
        note
      };
    } catch (error) {
      console.log(`Coin pricing data failed: ${error.message}`);
      return null;
    }
  }

  // Calculate similarity between two strings
  calculateSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches++;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  // Main method to get specialized pricing
  async getSpecializedPricing(itemName) {
    try {
      console.log(`Getting specialized pricing for: ${itemName}`);

      // Try jewelry pricing first
      const jewelryPricing = await this.getJewelryPricing(itemName);
      if (jewelryPricing) {
        console.log(`Found jewelry pricing: $${jewelryPricing.marketValue}`);
        return jewelryPricing;
      }

      // Try watch pricing
      const watchPricing = await this.getWatchPricing(itemName);
      if (watchPricing) {
        console.log(`Found watch pricing: $${watchPricing.marketValue}`);
        return watchPricing;
      }

      // Try video game pricing
      const gamePricing = await this.getVideoGamePricing(itemName);
      if (gamePricing) {
        console.log(`Found video game pricing: $${gamePricing.marketValue}`);
        return gamePricing;
      }

      // Try sneaker pricing
      const sneakerPricing = await this.getSneakerPricing(itemName);
      if (sneakerPricing) {
        console.log(`Found sneaker pricing: $${sneakerPricing.marketValue}`);
        return sneakerPricing;
      }

      // Try coin pricing
      const coinPricing = await this.getCoinPricing(itemName);
      if (coinPricing) {
        console.log(`Found coin pricing: $${coinPricing.marketValue}`);
        return coinPricing;
      }

      // Try electronics pricing last
      const electronicsPricing = await this.getElectronicsPricing(itemName);
      if (electronicsPricing) {
        console.log(`Found electronics pricing: $${electronicsPricing.marketValue}`);
        return electronicsPricing;
      }

      console.log(`No specialized pricing found for: ${itemName}`);
      return null;

    } catch (error) {
      console.error('Specialized pricing error:', error);
      return null;
    }
  }
}

module.exports = new SpecializedPriceGuidesService();
