const SpecializedPriceGuides = require('./services/SpecializedPriceGuides');

async function testSpecializedPricing() {
  console.log('🧪 Testing Specialized Price Guides Service\n');

  const testItems = [
    'iPhone 14 Pro',
    'Air Jordan 1',
    'Rolex Submariner',
    'Super Mario Bros',
    'American Eagle Gold Coin',
    'Diamond Ring 2 Carat'
  ];

  for (const item of testItems) {
    console.log(`\n🔍 Testing: "${item}"`);
    console.log('─'.repeat(40));
    
    try {
      const result = await SpecializedPriceGuides.getSpecializedPricing(item);
      
      if (result) {
        console.log(`✅ Found pricing: $${result.marketValue}`);
        console.log(`   Pawn Value: $${result.pawnValue}`);
        console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
        console.log(`   Source: ${result.source}`);
        console.log(`   Note: ${result.note}`);
      } else {
        console.log(`❌ No specialized pricing found`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n🎯 Specialized Pricing Test Complete!');
}

testSpecializedPricing().catch(console.error);
