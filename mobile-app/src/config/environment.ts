// Environment Configuration
// ⚠️ IMPORTANT: Replace placeholder values with actual production credentials
// ⚠️ In production, these should be loaded from secure environment variables

export const ENVIRONMENT = {
  // App Configuration
  APP_ENVIRONMENT: __DEV__ ? 'development' : 'production',
  
  // eBay API Configuration
  EBAY_APP_ID: __DEV__ 
    ? 'WilliamS-PawnBrok-PRD-181203948-0c731637' // Development key
    : 'WilliamS-PawnBrok-PRD-181203948-0c731637', // Production key (same for now)
  
  // Supabase Configuration (Free Firebase Alternative)
  SUPABASE: {
    URL: __DEV__ 
      ? "https://mneqgkcdrjrwwetedxzj.supabase.co" // Development URL
      : "https://mneqgkcdrjrwwetedxzj.supabase.co", // Production URL
    ANON_KEY: __DEV__ 
      ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZXFna2Nkcmpyd3dldGVkeHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTU0NTgsImV4cCI6MjA3MTQzMTQ1OH0.Q9CzO4BCsu2GQOUiTHY0H2RdEOZxrxP5p2XD7AJsumI" // Development anon key
      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZXFna2Nkcmpyd3dldGVkeHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTU0NTgsImV4cCI6MjA3MTQzMTQ1OH0.Q9CzO4BCsu2GQOUiTHY0H2RdEOZxrxP5p2XD7AJsumI" // Production anon key
  },
  
  // AdMob Configuration
  ADMOB: {
    appId: __DEV__ 
      ? 'ca-app-pub-3940256099942544~3347511713' // Test App ID
      : 'ca-app-pub-7869206132163225~6227378217', // Production App ID
    bannerAdUnitId: __DEV__ 
      ? 'ca-app-pub-3940256099942544/6300978111' // Test ID
      : 'ca-app-pub-7869206132163225/2632598195', // Production Banner Ad Unit ID
    interstitialAdUnitId: __DEV__ 
      ? 'ca-app-pub-3940256099942544/1033173712' // Test ID
      : 'ca-app-pub-7869206132163225/8777272510', // Production Interstitial Ad Unit ID
    rewardedAdUnitId: __DEV__ 
      ? 'ca-app-pub-3940256099942544/5224354917' // Test ID
      : 'ca-app-pub-7869206132163225/2496866821' // Production Rewarded Ad Unit ID
  },
  
  // API Configuration
  API_BASE_URL: __DEV__ 
    ? 'https://pawnbroker-l7okx8ar7-904critic-techs-projects.vercel.app/api' 
    : 'https://pawnbroker-l7okx8ar7-904critic-techs-projects.vercel.app/api',
  
  // Feature Flags
  FEATURES: {
    DEBUG_MODE: false,
    TEST_SCREENS: false,
    CLEAR_LEARNING_DATA: false,
    MARKETPLACE_TEST: false,
    OFFLINE_MODE: true,
    IMAGE_RECOGNITION: true,
    ADVANCED_ANALYTICS: true
  }
};

// Helper function to get environment variable
export const getEnvVar = (key: string): string => {
  return ENVIRONMENT[key as keyof typeof ENVIRONMENT] as string || '';
};

// Helper function to check if feature is enabled
export const isFeatureEnabled = (feature: keyof typeof ENVIRONMENT.FEATURES): boolean => {
  return ENVIRONMENT.FEATURES[feature];
};
