# 🚀 VERCEL ENVIRONMENT SETUP GUIDE
## Complete Environment Variables Configuration for PawnBroker Pro

### **Why Vercel Environment Variables?**
- ✅ **Secure**: Credentials are encrypted and never exposed in code
- ✅ **Environment-specific**: Different values for development, preview, and production
- ✅ **Easy Management**: Centralized configuration through Vercel dashboard
- ✅ **Automatic Deployment**: Changes apply immediately to deployments

---

## 📋 **STEP 1: Access Vercel Dashboard**

### 1.1 Navigate to Your Project
- Go to: https://vercel.com/dashboard
- Select your **PawnBroker Pro** project
- Click on **Settings** tab
- Click on **Environment Variables** in the left sidebar

### 1.2 Environment Variables Section
You'll see three environments:
- **Production** (live app)
- **Preview** (staging/testing)
- **Development** (local development)

---

## 🔐 **STEP 2: Add Supabase Environment Variables**

### 2.1 Supabase Configuration
Add these variables to **ALL THREE** environments:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `SUPABASE_URL` | `https://mneqgkcdrjrwwetedxzj.supabase.co` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZXFna2Nkcmpyd3dldGVkeHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NTU0NTgsImV4cCI6MjA3MTQzMTQ1OH0.Q9CzO4BCsu2GQOUiTHY0H2RdEOZxrxP5p2XD7AJsumI` | Public anon key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZXFna2Nkcmpyd3dldGVkeHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg1NTQ1OCwiZXhwIjoyMDcxNDMxNDU4fQ.m9E2sYaSwoxmZGqG0bct8vbxSsl-5tjCqdMJ_D3jUA0` | Service role key (server-side only) |
| `SUPABASE_JWT_SECRET` | `5Vrv0AgU/B/HGo3MqxYQFzAAKaIEEP3r/+Ly8H0W5VmBu26dvOoeIwIcWh7DqdcdSCvdDPpNwhQPeQfVXGtt4A==` | JWT secret for token verification |

### 2.2 How to Add Each Variable
1. Click **Add New**
2. Enter the **Variable Name** (e.g., `SUPABASE_URL`)
3. Enter the **Value** (e.g., `https://mneqgkcdrjrwwetedxzj.supabase.co`)
4. Select **Environment**: Check all three boxes (Production, Preview, Development)
5. Click **Save**

---

## 🔑 **STEP 3: Add Existing Backend Environment Variables**

### 3.1 Database Configuration
| Variable Name | Value | Description |
|---------------|-------|-------------|
| `MONGODB_URI` | `your-mongodb-connection-string` | MongoDB connection string |
| `JWT_SECRET` | `your-super-secure-jwt-secret` | JWT signing secret |

### 3.2 API Keys
| Variable Name | Value | Description |
|---------------|-------|-------------|
| `EBAY_APP_ID` | `WilliamS-PawnBrok-PRD-181203948-0c731637` | eBay API application ID |
| `EBAY_WEBHOOK_TOKEN` | `your-ebay-webhook-verification-token` | eBay webhook verification token |
| `CLOUDINARY_CLOUD_NAME` | `ddbbqoz7m` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `347494445896686` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `5F4VZfsYkfHCG1c11zJr9Qs9IE` | Cloudinary API secret |

### 3.3 Amazon API Configuration
| Variable Name | Value | Description |
|---------------|-------|-------------|
| `AMAZON_ACCESS_KEY_ID` | `your-amazon-access-key` | Amazon API access key |
| `AMAZON_SECRET_ACCESS_KEY` | `your-amazon-secret-key` | Amazon API secret key |
| `AMAZON_CLIENT_ID` | `your-amazon-client-id` | Amazon client ID |
| `AMAZON_CLIENT_SECRET` | `your-amazon-client-secret` | Amazon client secret |
| `AMAZON_SECURITY_PROFILE_ID` | `your-amazon-security-profile` | Amazon security profile |
| `AMAZON_API_KEY` | `your-amazon-api-key` | Amazon API key |

### 3.4 Security & Encryption
| Variable Name | Value | Description |
|---------------|-------|-------------|
| `ENCRYPTION_KEY` | `your-32-character-encryption-key` | 32-character encryption key |
| `WEBHOOK_VERIFICATION_TOKEN` | `your-webhook-verification-token` | Webhook verification token |

---

## 📱 **STEP 4: Add Mobile App Environment Variables**

### 4.1 AdMob Configuration
| Variable Name | Value | Description |
|---------------|-------|-------------|
| `ADMOB_APP_ID` | `ca-app-pub-7869206132163225~6227378217` | Production AdMob App ID |
| `ADMOB_BANNER_AD_UNIT_ID` | `ca-app-pub-7869206132163225/2632598195` | Production Banner Ad Unit ID |
| `ADMOB_INTERSTITIAL_AD_UNIT_ID` | `ca-app-pub-7869206132163225/8777272510` | Production Interstitial Ad Unit ID |
| `ADMOB_REWARDED_AD_UNIT_ID` | `ca-app-pub-7869206132163225/2496866821` | Production Rewarded Ad Unit ID |

### 4.2 API Configuration
| Variable Name | Value | Description |
|---------------|-------|-------------|
| `API_BASE_URL` | `https://your-production-api-domain.com/api` | Production API base URL |

---

## 🔄 **STEP 5: Environment-Specific Values**

### 5.1 Development Environment
For **Development** environment, you can use:
- Test/development API keys
- Local database URLs
- Test ad unit IDs

### 5.2 Preview Environment
For **Preview** environment, use:
- Staging API keys
- Test database
- Test ad unit IDs

### 5.3 Production Environment
For **Production** environment, use:
- **REAL** production API keys
- **REAL** production database
- **REAL** production ad unit IDs

---

## ✅ **STEP 6: Verification Checklist**

After adding all variables, verify:

- [ ] All Supabase variables added to all environments
- [ ] All backend API keys added to all environments
- [ ] All security variables added to all environments
- [ ] All AdMob variables added to all environments
- [ ] Environment-specific values configured correctly
- [ ] No sensitive keys exposed in code
- [ ] Production environment has real production keys

---

## 🚨 **SECURITY REMINDERS**

### ⚠️ **CRITICAL SECURITY NOTES:**
1. **Never commit environment variables to Git**
2. **Use different keys for different environments**
3. **Rotate keys regularly**
4. **Monitor for unauthorized access**
5. **Use strong, unique secrets**

### 🔒 **Production Security:**
- Use **real production API keys** only in production environment
- Use **strong JWT secrets** (32+ characters)
- Use **unique webhook tokens**
- Use **production ad unit IDs**

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check Vercel documentation: https://vercel.com/docs/environment-variables
2. Verify all variables are added to correct environments
3. Ensure no typos in variable names or values
4. Redeploy your application after adding variables

---

## 🎯 **Next Steps**

After setting up environment variables:
1. **Test the application** in development
2. **Deploy to preview** environment
3. **Test in preview** environment
4. **Deploy to production** when ready
5. **Monitor logs** for any environment-related errors

---

**✅ Environment variables are now securely configured in Vercel!**
