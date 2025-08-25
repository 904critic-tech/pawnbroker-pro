const fs = require('fs');
const path = require('path');

// Google Play Store Requirements
const REQUIREMENTS = {
  phone: { width: 1080, height: 1920, name: 'phone' },
  'tablet-7inch': { width: 1200, height: 1920, name: 'tablet-7inch' },
  'tablet-10inch': { width: 1920, height: 1200, name: 'tablet-10inch' },
  'feature-graphic': { width: 1024, height: 500, name: 'feature-graphic' }
};

// Create directory structure
const createDirectories = () => {
  const dirs = [
    'store-assets/phone',
    'store-assets/tablet-7inch', 
    'store-assets/tablet-10inch',
    'store-assets/feature-graphic'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Generate asset specifications
const generateAssetSpecs = () => {
  const specs = {
  phone: [
    { name: 'home-screen', description: 'Main home screen with search and camera options' },
    { name: 'search-results', description: 'Search results showing item pricing' },
    { name: 'camera-scanner', description: 'Camera interface for scanning items' },
    { name: 'settings', description: 'Settings and preferences screen' }
  ],
  'tablet-7inch': [
    { name: 'home-screen-tablet', description: 'Tablet-optimized home screen' },
    { name: 'search-results-tablet', description: 'Tablet-optimized search results' }
  ],
  'tablet-10inch': [
    { name: 'home-screen-tablet-large', description: 'Large tablet home screen' },
    { name: 'search-results-tablet-large', description: 'Large tablet search results' }
  ],
  'feature-graphic': [
    { name: 'feature-graphic', description: '1024x500 banner for Play Store listing' }
  ]
};
  
  return specs;
};

// Create placeholder files with instructions
const createPlaceholderFiles = () => {
  const specs = generateAssetSpecs();
  
  Object.entries(specs).forEach(([deviceType, assets]) => {
    assets.forEach(asset => {
      const dir = `store-assets/${deviceType}`;
      const filePath = path.join(dir, `${asset.name}.png`);
      
      if (!fs.existsSync(filePath)) {
        // Create a simple text file with instructions
        const instructions = `# ${asset.name.toUpperCase()}
        
Required Size: ${REQUIREMENTS[deviceType]?.width || 1024}x${REQUIREMENTS[deviceType]?.height || 500} pixels
Format: PNG or JPEG
Description: ${asset.description}

INSTRUCTIONS:
1. Take a screenshot of your app in this state
2. Resize to the required dimensions
3. Save as PNG or JPEG
4. Replace this file with the actual screenshot

Current assets available:
- assets/HomeScreen.jpg
- assets/Search Results.jpg  
- assets/CameraScanner.jpg
- assets/Settings.jpg
- assets/logo.jpg
`;
        
        fs.writeFileSync(filePath.replace('.png', '.txt'), instructions);
      }
    });
  });
};

// Create feature graphic template
const createFeatureGraphicTemplate = () => {
  const template = `# FEATURE GRAPHIC TEMPLATE

Required Size: 1024x500 pixels
Format: PNG or JPEG

DESIGN GUIDELINES:
- Include app name "PawnBroker Pro"
- Show key features: pricing intelligence, camera scanning, market analysis
- Use professional business/financial theme
- Include app icon or logo
- Keep text readable at small sizes
- Use brand colors: #1a1a2e, #16213e, #0f3460, #e94560

SUGGESTED LAYOUT:
- Left side: App icon/logo
- Center: App name and tagline
- Right side: Feature highlights or screenshots
- Background: Gradient using brand colors

Current assets to use:
- assets/icon.png (app icon)
- assets/logo.jpg (logo)
- assets/Feature.png (feature image)
`;
  
  fs.writeFileSync('store-assets/feature-graphic/feature-graphic-template.txt', template);
};

// Main execution
const main = () => {
  console.log('🚀 Generating Google Play Store Asset Specifications...');
  
  createDirectories();
  createPlaceholderFiles();
  createFeatureGraphicTemplate();
  
  console.log('✅ Asset specifications created in store-assets/ directory');
  console.log('');
  console.log('📱 REQUIRED ASSETS:');
  console.log('Phone Screenshots (1080x1920):');
  console.log('  - store-assets/phone/home-screen.png');
  console.log('  - store-assets/phone/search-results.png');
  console.log('  - store-assets/phone/camera-scanner.png');
  console.log('  - store-assets/phone/settings.png');
  console.log('');
  console.log('Tablet Screenshots:');
  console.log('  - store-assets/tablet-7inch/ (1200x1920)');
  console.log('  - store-assets/tablet-10inch/ (1920x1200)');
  console.log('');
  console.log('Feature Graphic:');
  console.log('  - store-assets/feature-graphic/feature-graphic.png (1024x500)');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Take screenshots of your app on different screen sizes');
  console.log('2. Resize them to the required dimensions');
  console.log('3. Create a feature graphic banner');
  console.log('4. Replace the .txt files with actual images');
};

main();
