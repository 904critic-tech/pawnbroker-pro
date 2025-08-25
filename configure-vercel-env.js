// Configure Vercel Environment Variables for PawnBroker Pro Backend
const { execSync } = require('child_process');

// Essential environment variables for basic functionality
const envVars = {
  'NODE_ENV': 'production',
  'PORT': '5000',
  'CORS_ORIGIN': 'https://streamautoclipper-qcqxgtj2o-904critic-techs-projects.vercel.app',
  'JWT_SECRET': 'pawnbroker-pro-jwt-secret-32-chars-minimum-2024',
  'ENCRYPTION_KEY': 'pawnbroker-pro-encryption-key-32-chars-2024',
  'LOG_ENCRYPTION_KEY': 'pawnbroker-pro-log-encryption-key-32-chars-2024'
};

console.log('🔧 Configuring Vercel Environment Variables...');
console.log('📋 Project: pawnbroker-pro');
console.log('🌐 Environment: Production');
console.log('');

// Function to add environment variable
function addEnvVar(key, value) {
  try {
    console.log(`➕ Adding ${key}...`);
    const command = `vercel env add ${key} production`;
    
    // Use execSync to run the command and provide input
    const result = execSync(command, { 
      input: value,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log(`✅ ${key} added successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add ${key}:`, error.message);
    return false;
  }
}

// Add all environment variables
let successCount = 0;
let totalCount = Object.keys(envVars).length;

console.log('🚀 Starting environment variable configuration...');
console.log('');

for (const [key, value] of Object.entries(envVars)) {
  if (addEnvVar(key, value)) {
    successCount++;
  }
  console.log('');
}

console.log('📊 Configuration Summary:');
console.log(`✅ Successfully added: ${successCount}/${totalCount} variables`);
console.log('');

if (successCount === totalCount) {
  console.log('🎉 All environment variables configured successfully!');
  console.log('');
  console.log('🔄 Next Steps:');
  console.log('1. Redeploy the backend: vercel --prod');
  console.log('2. Test the web app functionality');
  console.log('3. Verify API connectivity');
} else {
  console.log('⚠️  Some variables failed to configure.');
  console.log('💡 You may need to configure them manually in the Vercel dashboard.');
  console.log('');
  console.log('🔗 Manual Configuration:');
  console.log('1. Go to https://vercel.com/dashboard');
  console.log('2. Select the pawnbroker-pro project');
  console.log('3. Go to Settings → Environment Variables');
  console.log('4. Add the missing variables manually');
}

console.log('');
console.log('📋 Required Variables:');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});
