# 🚀 SUPABASE SETUP GUIDE
## Free Firebase Alternative for PawnBroker Pro

### **Why Supabase?**
- ✅ **Completely Free** for our needs
- ✅ **50,000 monthly active users** free
- ✅ **500MB database** free
- ✅ **1GB file storage** free
- ✅ **Built-in authentication** (email, Google, Apple)
- ✅ **Real-time database** with PostgreSQL
- ✅ **File storage** with CDN
- ✅ **Easy setup** and migration from Firebase

---

## 📋 **STEP 1: Create Supabase Project**

### 1.1 Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Click "New Project"

### 1.2 Project Setup
- **Organization**: Create new or use existing
- **Name**: `pawnbroker-pro`
- **Database Password**: Generate a strong password (save it!)
- **Region**: Choose closest to your users
- **Pricing Plan**: **Free Tier**

### 1.3 Wait for Setup
- Project creation takes 2-3 minutes
- You'll get a notification when ready

---

## 🔑 **STEP 2: Get API Keys**

### 2.1 Go to Project Settings
- In your Supabase dashboard
- Click "Settings" → "API"

### 2.2 Copy Credentials
You'll see:
```
Project URL: https://your-project-id.supabase.co
anon public: your-anon-key
service_role secret: your-service-role-key
```

### 2.3 Update Environment Configuration
Update `mobile-app/src/config/environment.ts`:

```typescript
SUPABASE: {
  URL: __DEV__ 
    ? "https://your-project-id.supabase.co" // Your actual URL
    : "https://your-project-id.supabase.co", // Same for production
  ANON_KEY: __DEV__ 
    ? "your-anon-key" // Your actual anon key
    : "your-anon-key" // Same for production
},
```

---

## 🔐 **STEP 3: Configure Authentication**

### 3.1 Enable Auth Providers
- Go to "Authentication" → "Providers"
- Enable:
  - ✅ **Email** (default)
  - ✅ **Google**
  - ✅ **Apple** (for iOS)

### 3.2 Configure Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or use existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret to Supabase

### 3.3 Configure Apple OAuth (iOS only)
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create App ID with Sign In with Apple capability
3. Create Service ID
4. Add redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
5. Copy credentials to Supabase

### 3.4 Configure Email Templates
- Go to "Authentication" → "Email Templates"
- Customize:
  - **Confirm signup**
  - **Reset password**
  - **Magic link**

---

## 💾 **STEP 4: Set Up Storage**

### 4.1 Create Storage Bucket
- Go to "Storage" → "Buckets"
- Click "New Bucket"
- Name: `images`
- Public bucket: ✅ **Yes** (for public image access)
- File size limit: `10MB`
- Allowed MIME types: `image/*`

### 4.2 Set Storage Policies
Go to "Storage" → "Policies" and add:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access to images
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🗄️ **STEP 5: Create Database Tables**

### 5.1 Go to SQL Editor
- Click "SQL Editor" in Supabase dashboard

### 5.2 Create Users Table
```sql
-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  business_name TEXT,
  phone TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);
```

### 5.3 Create Items Table
```sql
-- Create items table
CREATE TABLE public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  condition TEXT,
  market_value DECIMAL(10,2),
  pawn_value DECIMAL(10,2),
  confidence DECIMAL(3,2),
  image_url TEXT,
  search_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own items" ON public.items
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON public.items
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON public.items
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON public.items
FOR DELETE USING (auth.uid() = user_id);
```

---

## 📱 **STEP 6: Install Supabase in Mobile App**

### 6.1 Install Dependencies
```bash
cd mobile-app
npm install @supabase/supabase-js
```

### 6.2 Update Package.json
Add to dependencies:
```json
{
  "@supabase/supabase-js": "^2.39.0"
}
```

### 6.3 Replace Firebase Service
- The `SupabaseService.ts` is already created
- Update imports in your components to use `SupabaseService` instead of `FirebaseService`

---

## 🔄 **STEP 7: Migration from Firebase**

### 7.1 Update Service Imports
Replace in your components:
```typescript
// OLD
import FirebaseService from '../services/FirebaseService';

// NEW
import SupabaseService from '../services/SupabaseService';
```

### 7.2 Update Service Usage
```typescript
// OLD
const firebaseService = FirebaseService.getInstance();

// NEW
const supabaseService = SupabaseService.getInstance();
```

### 7.3 Update Method Calls
Most methods have the same interface, but some may need minor adjustments.

---

## ✅ **STEP 8: Test Everything**

### 8.1 Test Authentication
- [ ] Email signup/signin
- [ ] Google OAuth
- [ ] Apple OAuth (iOS)
- [ ] Password reset
- [ ] Email verification

### 8.2 Test Storage
- [ ] Image upload
- [ ] Image retrieval
- [ ] Image deletion

### 8.3 Test Database
- [ ] User profile creation
- [ ] Item creation
- [ ] Data retrieval

---

## 🎯 **BENEFITS OF THIS SETUP**

### **Cost Savings**
- **Firebase**: $25/month after free tier
- **Supabase**: **$0/month** for our needs

### **Features**
- ✅ Authentication (email, Google, Apple)
- ✅ File storage with CDN
- ✅ Real-time database
- ✅ Row-level security
- ✅ Auto-generated APIs
- ✅ Dashboard for data management

### **Scalability**
- Free tier: 50,000 users
- Paid plans start at $25/month
- No vendor lock-in (PostgreSQL)

---

## 🚨 **IMPORTANT NOTES**

### **Security**
- Never commit API keys to git
- Use environment variables
- Enable Row Level Security (RLS)
- Set up proper storage policies

### **Backup**
- Supabase provides automatic backups
- Export data regularly
- Keep local backups of important data

### **Monitoring**
- Use Supabase dashboard for monitoring
- Set up alerts for usage limits
- Monitor authentication logs

---

## 📞 **Support**

- **Supabase Docs**: https://supabase.com/docs
- **Community**: https://github.com/supabase/supabase/discussions
- **Discord**: https://discord.supabase.com

---

**🎉 You're now using a completely free, production-ready backend!**
