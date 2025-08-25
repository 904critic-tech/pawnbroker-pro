const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { MongoClient } = require('mongodb');

class DatasetCollectionService {
  constructor() {
    this.db = null;
    this.collection = null;
    this.ebayApiKey = process.env.EBAY_API_KEY;
    this.ebayAppId = process.env.EBAY_APP_ID;
    this.ebayCertId = process.env.EBAY_CERT_ID;
    this.ebayDevId = process.env.EBAY_DEV_ID;
    this.baseUrl = 'https://api.ebay.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async initialize() {
    try {
      // Initialize MongoDB connection
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      this.db = client.db('ebay_dataset');
      this.collection = this.db.collection('product_data');
      
      // Create indexes for efficient querying
      await this.collection.createIndex({ categoryId: 1 });
      await this.collection.createIndex({ brand: 1 });
      await this.collection.createIndex({ model: 1 });
      await this.collection.createIndex({ timestamp: 1 });
      await this.collection.createIndex({ price: 1 });
      
      console.log('✅ DatasetCollectionService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize DatasetCollectionService:', error);
      throw error;
    }
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const authString = Buffer.from(`${this.ebayAppId}:${this.ebayCertId}`).toString('base64');
      const response = await axios.post(`${this.baseUrl}/identity/v1/oauth2/token`, 
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get eBay access token:', error);
      throw error;
    }
  }

  // eBay category structure for comprehensive data collection
  async getCategoryHierarchy() {
    const categories = {
      'Electronics & Accessories': {
        id: '293',
        subcategories: {
          'Smartphones & Accessories': '15032',
          'Laptops & Computers': '175672',
          'Tablets & eReaders': '171485',
          'Cameras & Photo': '625',
          'Video Games & Consoles': '139973',
          'Audio & Home Theater': '293',
          'TV & Video': '293',
          'GPS & Navigation': '31388',
          'Security & Surveillance': '159912',
          'Networking & Servers': '11176',
          'Components & Parts': '175673',
          'Virtual Reality': '183067',
          'Drones & RC Vehicles': '159043'
        }
      },
      'Fashion & Apparel': {
        id: '11450',
        subcategories: {
          'Men\'s Clothing': '1059',
          'Women\'s Clothing': '15724',
          'Kids\' Clothing': '171146',
          'Shoes & Sneakers': '3034',
          'Handbags & Accessories': '169291',
          'Jewelry & Watches': '281',
          'Sunglasses & Eyewear': '180959',
          'Hats & Caps': '180959',
          'Scarves & Gloves': '180959',
          'Belts & Suspenders': '180959',
          'Ties & Bow Ties': '180959',
          'Socks & Hosiery': '180959',
          'Underwear & Lingerie': '180959',
          'Swimwear': '180959',
          'Formal Wear': '180959',
          'Costumes & Cosplay': '180959'
        }
      },
      'Home & Garden': {
        id: '11700',
        subcategories: {
          'Furniture': '11700',
          'Home Decor': '20667',
          'Kitchen & Dining': '20667',
          'Bedding & Bath': '20416',
          'Lighting & Ceiling Fans': '20667',
          'Storage & Organization': '20667',
          'Yard, Garden & Outdoor': '159912',
          'Tools & Workshop Equipment': '631',
          'Home Improvement': '159912',
          'Pet Supplies': '1281',
          'Baby & Kids': '2984',
          'Health & Beauty': '26395',
          'Office & Business': '252'
        }
      },
      'Sports & Hobbies': {
        id: '888',
        subcategories: {
          'Sporting Goods': '888',
          'Exercise & Fitness': '15273',
          'Hunting & Fishing': '159043',
          'Camping & Hiking': '159043',
          'Cycling': '7294',
          'Golf': '1513',
          'Tennis': '888',
          'Basketball': '888',
          'Football': '888',
          'Baseball': '888',
          'Soccer': '888',
          'Swimming': '888',
          'Martial Arts': '888',
          'Yoga & Pilates': '15273',
          'Dance & Gymnastics': '888',
          'Model Trains & RC': '19119',
          'Arts & Crafts': '14339',
          'Collecting': '1',
          'Photography': '625',
          'Music': '619'
        }
      },
      'Toys & Games': {
        id: '220',
        subcategories: {
          'Action Figures & Dolls': '237',
          'Building Sets & Blocks': '220',
          'Board Games & Puzzles': '233',
          'Video Games': '139973',
          'Educational Toys': '220',
          'Outdoor Toys': '220',
          'Arts & Crafts for Kids': '14339',
          'Stuffed Animals': '237',
          'Diecast & Toy Vehicles': '222',
          'Trading Cards': '2536',
          'Magic & Collectible Card Games': '2536',
          'Model Kits': '1188',
          'Science & Discovery': '220',
          'Musical Instruments for Kids': '619'
        }
      },
      'Collectibles & Art': {
        id: '1',
        subcategories: {
          'Trading Cards': '2536',
          'Coins & Paper Money': '11116',
          'Stamps': '260',
          'Comics': '63',
          'Art': '550',
          'Antiques': '20081',
          'Vintage Items': '1',
          'Memorabilia': '1',
          'Sports Memorabilia': '64482',
          'Entertainment Memorabilia': '1',
          'Historical Items': '1',
          'Military Items': '13956',
          'Religious Items': '1',
          'Cultural Items': '1'
        }
      },
      'Books & Media': {
        id: '267',
        subcategories: {
          'Books': '267',
          'Movies & TV': '11232',
          'Music': '176985',
          'Magazines': '280',
          'Newspapers': '280',
          'Maps & Atlases': '267',
          'Sheet Music': '619',
          'Audio Books': '267',
          'Educational Materials': '267',
          'Manuals & Guides': '267'
        }
      },
      'Automotive': {
        id: '6000',
        subcategories: {
          'Cars & Trucks': '6001',
          'Motorcycles': '6024',
          'Boats': '26429',
          'RVs & Campers': '50073',
          'ATVs & UTVs': '6724',
          'Snowmobiles': '159043',
          'Auto Parts & Accessories': '6000',
          'Tools & Equipment': '631',
          'Manuals & Literature': '6000',
          'Apparel & Collectibles': '6000'
        }
      },
      'Health & Beauty': {
        id: '26395',
        subcategories: {
          'Health Care': '180959',
          'Beauty & Personal Care': '26395',
          'Fragrances': '180959',
          'Skin Care': '180959',
          'Hair Care': '180959',
          'Makeup': '180959',
          'Dental Care': '180959',
          'Vision Care': '180959',
          'Medical & Mobility': '180959',
          'Fitness & Nutrition': '15273',
          'Vitamins & Supplements': '180959'
        }
      },
      'Jewelry & Watches': {
        id: '281',
        subcategories: {
          'Fine Jewelry': '281',
          'Fashion Jewelry': '281',
          'Watches': '31387',
          'Loose Diamonds & Gemstones': '281',
          'Jewelry Making & Beading': '281',
          'Jewelry Boxes & Organizers': '281',
          'Watch Accessories': '31387',
          'Jewelry Tools & Equipment': '281'
        }
      },
      'Tools & Workshop': {
        id: '631',
        subcategories: {
          'Hand Tools': '631',
          'Power Tools': '631',
          'Measuring & Layout Tools': '631',
          'Fasteners & Hardware': '631',
          'Safety Equipment': '631',
          'Storage & Organization': '631',
          'Welding & Soldering': '631',
          'Woodworking': '631',
          'Metalworking': '631',
          'Automotive Tools': '6000',
          'Garden Tools': '159912',
          'Cleaning Tools': '631'
        }
      },
      'Musical Instruments': {
        id: '619',
        subcategories: {
          'Guitars & Basses': '619',
          'Keyboards & Pianos': '619',
          'Drums & Percussion': '619',
          'Wind Instruments': '619',
          'String Instruments': '619',
          'Brass Instruments': '619',
          'Recording Equipment': '619',
          'DJ Equipment': '619',
          'Karaoke': '619',
          'Accessories & Parts': '619',
          'Sheet Music & Books': '619'
        }
      }
    };

    return categories;
  }

  // Collect data from eBay API for a specific category
  async collectCategoryData(categoryId, limit = 1000) {
    try {
      const token = await this.getAccessToken();
      const items = [];
      let offset = 0;
      const batchSize = 200; // eBay API limit

      while (items.length < limit) {
        const response = await axios.get(`${this.baseUrl}/buy/browse/v1/item_summary/search`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY-US'
          },
          params: {
            category_ids: categoryId,
            limit: Math.min(batchSize, limit - items.length),
            offset: offset,
            filter: 'conditions:{NEW|USED_EXCELLENT|USED_VERY_GOOD|USED_GOOD}'
          }
        });

        const batchItems = response.data.itemSummaries || [];
        if (batchItems.length === 0) break;

        // Process and enrich each item
        const enrichedItems = await Promise.all(
          batchItems.map(item => this.enrichItemData(item))
        );

        items.push(...enrichedItems);
        offset += batchSize;

        // Rate limiting
        await this.delay(100);
      }

      console.log(`✅ Collected ${items.length} items for category ${categoryId}`);
      return items;
    } catch (error) {
      console.error(`❌ Failed to collect data for category ${categoryId}:`, error);
      throw error;
    }
  }

  // Enrich item data with additional information
  async enrichItemData(item) {
    const enrichedItem = {
      itemId: item.itemId,
      title: item.title,
      price: item.price?.value || 0,
      currency: item.price?.currency || 'USD',
      condition: item.condition || 'Unknown',
      brand: this.extractBrand(item.title),
      model: this.extractModel(item.title),
      categoryId: item.categoryId,
      categoryPath: item.categoryPath,
      imageUrl: item.image?.imageUrl,
      additionalImages: item.additionalImages?.map(img => img.imageUrl) || [],
      description: item.shortDescription || '',
      seller: {
        username: item.seller?.username,
        feedbackScore: item.seller?.feedbackScore
      },
      shipping: {
        cost: item.shippingOptions?.[0]?.shippingCost?.value || 0,
        service: item.shippingOptions?.[0]?.shippingServiceCode || 'Unknown'
      },
      location: {
        country: item.itemLocation?.country || 'Unknown',
        postalCode: item.itemLocation?.postalCode
      },
      timestamp: new Date(),
      metadata: {
        viewCount: item.viewCount || 0,
        watchCount: item.watchCount || 0,
        bidCount: item.bidCount || 0,
        timeLeft: item.timeLeft || '',
        listingType: item.listingType || 'Unknown'
      }
    };

    return enrichedItem;
  }

  // Extract brand from title using enhanced pattern matching
  extractBrand(title) {
    const lowerTitle = title.toLowerCase();
    
    // Enhanced brand recognition patterns
    const brandPatterns = [
      // Electronics
      { patterns: ['iphone', 'ipad', 'macbook', 'imac', 'mac', 'apple watch'], brand: 'Apple' },
      { patterns: ['galaxy', 'samsung'], brand: 'Samsung' },
      { patterns: ['pixel', 'google'], brand: 'Google' },
      { patterns: ['oneplus'], brand: 'OnePlus' },
      { patterns: ['mate', 'huawei', 'p series'], brand: 'Huawei' },
      { patterns: ['xiaomi', 'mi'], brand: 'Xiaomi' },
      { patterns: ['oppo'], brand: 'Oppo' },
      { patterns: ['vivo'], brand: 'Vivo' },
      { patterns: ['realme'], brand: 'Realme' },
      { patterns: ['nokia'], brand: 'Nokia' },
      { patterns: ['motorola', 'moto'], brand: 'Motorola' },
      { patterns: ['blackberry'], brand: 'BlackBerry' },
      { patterns: ['htc'], brand: 'HTC' },
      { patterns: ['alcatel'], brand: 'Alcatel' },
      { patterns: ['zte'], brand: 'ZTE' },
      
      // Computers
      { patterns: ['dell', 'latitude', 'inspiron', 'precision', 'xps'], brand: 'Dell' },
      { patterns: ['hp', 'hewlett', 'pavilion', 'elitebook', 'probook', 'spectre'], brand: 'HP' },
      { patterns: ['lenovo', 'thinkpad', 'ideapad', 'yoga', 'legion'], brand: 'Lenovo' },
      { patterns: ['asus', 'rog', 'zenbook', 'vivobook', 'tuf'], brand: 'ASUS' },
      { patterns: ['acer', 'aspire', 'predator', 'swift', 'spin'], brand: 'Acer' },
      { patterns: ['msi'], brand: 'MSI' },
      { patterns: ['sony', 'vaio'], brand: 'Sony' },
      { patterns: ['lg', 'gram'], brand: 'LG' },
      { patterns: ['toshiba', 'satellite'], brand: 'Toshiba' },
      { patterns: ['fujitsu', 'lifebook'], brand: 'Fujitsu' },
      { patterns: ['microsoft', 'surface'], brand: 'Microsoft' },
      
      // Cameras
      { patterns: ['canon'], brand: 'Canon' },
      { patterns: ['nikon'], brand: 'Nikon' },
      { patterns: ['fujifilm'], brand: 'Fujifilm' },
      { patterns: ['panasonic'], brand: 'Panasonic' },
      { patterns: ['olympus'], brand: 'Olympus' },
      { patterns: ['gopro'], brand: 'GoPro' },
      { patterns: ['dji'], brand: 'DJI' },
      
      // Watches
      { patterns: ['garmin'], brand: 'Garmin' },
      { patterns: ['fitbit'], brand: 'Fitbit' },
      { patterns: ['amazfit'], brand: 'Amazfit' },
      { patterns: ['fossil'], brand: 'Fossil' },
      { patterns: ['casio'], brand: 'Casio' },
      { patterns: ['seiko'], brand: 'Seiko' },
      { patterns: ['citizen'], brand: 'Citizen' },
      { patterns: ['rolex'], brand: 'Rolex' },
      { patterns: ['omega'], brand: 'Omega' },
      { patterns: ['tag heuer'], brand: 'Tag Heuer' },
      { patterns: ['breitling'], brand: 'Breitling' },
      { patterns: ['cartier'], brand: 'Cartier' },
      { patterns: ['tissot'], brand: 'Tissot' },
      { patterns: ['swatch'], brand: 'Swatch' },
      { patterns: ['timex'], brand: 'Timex' },
      { patterns: ['nixon'], brand: 'Nixon' },
      
      // Fashion
      { patterns: ['nike'], brand: 'Nike' },
      { patterns: ['adidas'], brand: 'Adidas' },
      { patterns: ['puma'], brand: 'Puma' },
      { patterns: ['reebok'], brand: 'Reebok' },
      { patterns: ['under armour'], brand: 'Under Armour' },
      { patterns: ['new balance'], brand: 'New Balance' },
      { patterns: ['converse'], brand: 'Converse' },
      { patterns: ['vans'], brand: 'Vans' },
      { patterns: ['jordan'], brand: 'Jordan' },
      { patterns: ['yeezy'], brand: 'Yeezy' },
      
      // Luxury Fashion
      { patterns: ['louis vuitton', 'lv'], brand: 'Louis Vuitton' },
      { patterns: ['gucci'], brand: 'Gucci' },
      { patterns: ['chanel'], brand: 'Chanel' },
      { patterns: ['hermes'], brand: 'Hermes' },
      { patterns: ['prada'], brand: 'Prada' },
      { patterns: ['fendi'], brand: 'Fendi' },
      { patterns: ['balenciaga'], brand: 'Balenciaga' },
      { patterns: ['saint laurent'], brand: 'Saint Laurent' },
      { patterns: ['givenchy'], brand: 'Givenchy' },
      { patterns: ['celine'], brand: 'Celine' },
      
      // Gaming
      { patterns: ['playstation', 'ps4', 'ps5'], brand: 'Sony PlayStation' },
      { patterns: ['xbox'], brand: 'Microsoft Xbox' },
      { patterns: ['nintendo', 'switch', 'wii', '3ds'], brand: 'Nintendo' },
      { patterns: ['steam'], brand: 'Steam' },
      { patterns: ['oculus', 'meta quest'], brand: 'Meta' },
      { patterns: ['htc vive'], brand: 'HTC Vive' },
      
      // Audio
      { patterns: ['bose'], brand: 'Bose' },
      { patterns: ['beats'], brand: 'Beats' },
      { patterns: ['sony'], brand: 'Sony' },
      { patterns: ['sennheiser'], brand: 'Sennheiser' },
      { patterns: ['audio technica'], brand: 'Audio-Technica' },
      { patterns: ['shure'], brand: 'Shure' },
      { patterns: ['jbl'], brand: 'JBL' },
      { patterns: ['harman kardon'], brand: 'Harman Kardon' },
      { patterns: ['klipsch'], brand: 'Klipsch' },
      { patterns: ['bowers & wilkins'], brand: 'Bowers & Wilkins' },
      
      // Tools
      { patterns: ['dewalt'], brand: 'DeWalt' },
      { patterns: ['milwaukee'], brand: 'Milwaukee' },
      { patterns: ['makita'], brand: 'Makita' },
      { patterns: ['ryobi'], brand: 'Ryobi' },
      { patterns: ['black & decker'], brand: 'Black & Decker' },
      { patterns: ['craftsman'], brand: 'Craftsman' },
      { patterns: ['snap on'], brand: 'Snap-on' },
      { patterns: ['matco'], brand: 'Matco' },
      { patterns: ['mac tools'], brand: 'MAC Tools' },
      { patterns: ['kobalt'], brand: 'Kobalt' },
      { patterns: ['harbor freight'], brand: 'Harbor Freight' },
      
      // Musical Instruments
      { patterns: ['fender'], brand: 'Fender' },
      { patterns: ['gibson'], brand: 'Gibson' },
      { patterns: ['martin'], brand: 'Martin' },
      { patterns: ['taylor'], brand: 'Taylor' },
      { patterns: ['yamaha'], brand: 'Yamaha' },
      { patterns: ['roland'], brand: 'Roland' },
      { patterns: ['korg'], brand: 'Korg' },
      { patterns: ['alesis'], brand: 'Alesis' },
      { patterns: ['m-audio'], brand: 'M-Audio' },
      { patterns: ['shure'], brand: 'Shure' },
      { patterns: ['sennheiser'], brand: 'Sennheiser' },
      { patterns: ['audio technica'], brand: 'Audio-Technica' }
    ];

    for (const brandPattern of brandPatterns) {
      for (const pattern of brandPattern.patterns) {
        if (lowerTitle.includes(pattern)) {
          return brandPattern.brand;
        }
      }
    }

    return null;
  }

  // Extract model from title
  extractModel(title) {
    const lowerTitle = title.toLowerCase();
    
    // Enhanced model recognition patterns
    const modelPatterns = [
      // iPhone patterns
      { pattern: /iphone\s+(\d+)\s*(pro|max|mini|plus)?/i, extract: (match) => `iPhone ${match[1]}${match[2] ? ' ' + match[2] : ''}` },
      { pattern: /iphone\s+(se|xs|xr)/i, extract: (match) => `iPhone ${match[1].toUpperCase()}` },
      
      // Samsung patterns
      { pattern: /galaxy\s+(s\d+|note\d+|a\d+|tab\s*\w*)/i, extract: (match) => `Galaxy ${match[1]}` },
      
      // Google patterns
      { pattern: /pixel\s+(\d+)/i, extract: (match) => `Pixel ${match[1]}` },
      
      // OnePlus patterns
      { pattern: /oneplus\s+(\d+)/i, extract: (match) => `OnePlus ${match[1]}` },
      
      // Huawei patterns
      { pattern: /mate\s+(\d+)/i, extract: (match) => `Mate ${match[1]}` },
      { pattern: /p(\d+)/i, extract: (match) => `P${match[1]}` },
      
      // Laptop patterns
      { pattern: /macbook\s+(pro|air)/i, extract: (match) => `MacBook ${match[1]}` },
      { pattern: /latitude\s+(\w+)/i, extract: (match) => `Latitude ${match[1]}` },
      { pattern: /inspiron\s+(\w+)/i, extract: (match) => `Inspiron ${match[1]}` },
      { pattern: /precision\s+(\w+)/i, extract: (match) => `Precision ${match[1]}` },
      { pattern: /xps\s+(\w+)/i, extract: (match) => `XPS ${match[1]}` },
      { pattern: /pavilion\s+(\w+)/i, extract: (match) => `Pavilion ${match[1]}` },
      { pattern: /elitebook\s+(\w+)/i, extract: (match) => `EliteBook ${match[1]}` },
      { pattern: /probook\s+(\w+)/i, extract: (match) => `ProBook ${match[1]}` },
      { pattern: /spectre\s+(\w+)/i, extract: (match) => `Spectre ${match[1]}` },
      { pattern: /thinkpad\s+(\w+)/i, extract: (match) => `ThinkPad ${match[1]}` },
      { pattern: /ideapad\s+(\w+)/i, extract: (match) => `IdeaPad ${match[1]}` },
      { pattern: /yoga\s+(\w+)/i, extract: (match) => `Yoga ${match[1]}` },
      { pattern: /legion\s+(\w+)/i, extract: (match) => `Legion ${match[1]}` },
      { pattern: /rog\s+(\w+)/i, extract: (match) => `ROG ${match[1]}` },
      { pattern: /zenbook\s+(\w+)/i, extract: (match) => `ZenBook ${match[1]}` },
      { pattern: /vivobook\s+(\w+)/i, extract: (match) => `VivoBook ${match[1]}` },
      { pattern: /tuf\s+(\w+)/i, extract: (match) => `TUF ${match[1]}` },
      { pattern: /aspire\s+(\w+)/i, extract: (match) => `Aspire ${match[1]}` },
      { pattern: /predator\s+(\w+)/i, extract: (match) => `Predator ${match[1]}` },
      { pattern: /swift\s+(\w+)/i, extract: (match) => `Swift ${match[1]}` },
      { pattern: /spin\s+(\w+)/i, extract: (match) => `Spin ${match[1]}` },
      
      // Tablet patterns
      { pattern: /ipad\s+(pro|air|mini)/i, extract: (match) => `iPad ${match[1]}` },
      { pattern: /surface\s+(pro|go|laptop)/i, extract: (match) => `Surface ${match[1]}` },
      
      // Watch patterns
      { pattern: /apple\s+watch/i, extract: () => 'Apple Watch' },
      { pattern: /galaxy\s+watch/i, extract: () => 'Galaxy Watch' },
      { pattern: /fitbit\s+(\w+)/i, extract: (match) => `Fitbit ${match[1]}` },
      { pattern: /garmin\s+(\w+)/i, extract: (match) => `Garmin ${match[1]}` },
      
      // Gaming console patterns
      { pattern: /playstation\s*(\d+)/i, extract: (match) => `PlayStation ${match[1]}` },
      { pattern: /xbox\s+(one|series\s*[xs])/i, extract: (match) => `Xbox ${match[1]}` },
      { pattern: /nintendo\s+(switch|wii|3ds)/i, extract: (match) => `Nintendo ${match[1]}` },
      
      // Camera patterns
      { pattern: /canon\s+(eos\s*)?(\w+)/i, extract: (match) => `Canon ${match[2]}` },
      { pattern: /nikon\s+(d\d+|z\d+)/i, extract: (match) => `Nikon ${match[1]}` },
      { pattern: /sony\s+(alpha|a\d+)/i, extract: (match) => `Sony ${match[1]}` },
      
      // Guitar patterns
      { pattern: /fender\s+(stratocaster|telecaster|jazzmaster|jaguar)/i, extract: (match) => `Fender ${match[1]}` },
      { pattern: /gibson\s+(les\s*paul|sg|es|flying\s*v)/i, extract: (match) => `Gibson ${match[1]}` },
      { pattern: /martin\s+(d\d+|om\d+|000\d+)/i, extract: (match) => `Martin ${match[1]}` },
      { pattern: /taylor\s+(\d+)/i, extract: (match) => `Taylor ${match[1]}` }
    ];

    for (const modelPattern of modelPatterns) {
      const match = title.match(modelPattern.pattern);
      if (match) {
        return modelPattern.extract(match);
      }
    }

    return null;
  }

  // Store collected data in MongoDB
  async storeData(items) {
    try {
      if (items.length === 0) return;

      // Insert items in batches
      const batchSize = 100;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await this.collection.insertMany(batch);
      }

      console.log(`✅ Stored ${items.length} items in database`);
    } catch (error) {
      console.error('❌ Failed to store data:', error);
      throw error;
    }
  }

  // Collect comprehensive dataset across all categories
  async collectComprehensiveDataset() {
    try {
      console.log('🚀 Starting comprehensive dataset collection...');
      
      const categories = await this.getCategoryHierarchy();
      let totalItems = 0;

      for (const [categoryName, categoryData] of Object.entries(categories)) {
        console.log(`📦 Collecting data for ${categoryName}...`);
        
        // Collect from main category
        const mainCategoryItems = await this.collectCategoryData(categoryData.id, 500);
        await this.storeData(mainCategoryItems);
        totalItems += mainCategoryItems.length;

        // Collect from subcategories
        for (const [subcategoryName, subcategoryId] of Object.entries(categoryData.subcategories)) {
          console.log(`  📦 Collecting data for ${subcategoryName}...`);
          const subcategoryItems = await this.collectCategoryData(subcategoryId, 300);
          await this.storeData(subcategoryItems);
          totalItems += subcategoryItems.length;
        }

        // Rate limiting between categories
        await this.delay(1000);
      }

      console.log(`✅ Comprehensive dataset collection completed! Total items: ${totalItems}`);
      return totalItems;
    } catch (error) {
      console.error('❌ Failed to collect comprehensive dataset:', error);
      throw error;
    }
  }

  // Get dataset statistics
  async getDatasetStats() {
    try {
      const stats = await this.collection.aggregate([
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            categories: { $addToSet: '$categoryId' },
            brands: { $addToSet: '$brand' }
          }
        }
      ]).toArray();

      const categoryStats = await this.collection.aggregate([
        {
          $group: {
            _id: '$categoryId',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();

      const brandStats = await this.collection.aggregate([
        {
          $match: { brand: { $ne: null } }
        },
        {
          $group: {
            _id: '$brand',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray();

      return {
        overall: stats[0] || {},
        categories: categoryStats,
        topBrands: brandStats
      };
    } catch (error) {
      console.error('❌ Failed to get dataset stats:', error);
      throw error;
    }
  }

  // Export dataset to JSON file
  async exportDataset(outputPath = './dataset_export.json') {
    try {
      console.log('📤 Exporting dataset...');
      
      const items = await this.collection.find({}).toArray();
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalItems: items.length,
          version: '1.0'
        },
        items: items
      };

      await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
      console.log(`✅ Dataset exported to ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error('❌ Failed to export dataset:', error);
      throw error;
    }
  }

  // Utility function for rate limiting
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DatasetCollectionService;
