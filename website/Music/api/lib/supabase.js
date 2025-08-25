import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables. Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.');
}

// Create Supabase client for public operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client for admin operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database schema setup
export const setupDatabase = async () => {
  try {
    // Create users table (extends Supabase auth.users)
    const { error: usersError } = await supabaseAdmin.rpc('create_users_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          is_artist BOOLEAN DEFAULT FALSE,
          referral_code VARCHAR(10) UNIQUE,
          wallet_balance DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create artists table
    const { error: artistsError } = await supabaseAdmin.rpc('create_artists_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.artists (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          artist_name VARCHAR(100) NOT NULL,
          bio TEXT,
          social_links JSONB,
          total_earnings DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create tracks table
    const { error: tracksError } = await supabaseAdmin.rpc('create_tracks_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tracks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          genre VARCHAR(50) NOT NULL,
          mood VARCHAR(50),
          tags TEXT[],
          description TEXT,
          duration INTEGER NOT NULL,
          audio_url TEXT NOT NULL,
          thumbnail_url TEXT,
          plays INTEGER DEFAULT 0,
          downloads INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create streams table
    const { error: streamsError } = await supabaseAdmin.rpc('create_streams_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.streams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
          user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create tips table
    const { error: tipsError } = await supabaseAdmin.rpc('create_tips_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tips (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
          to_artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create wallet_transactions table
    const { error: walletError } = await supabaseAdmin.rpc('create_wallet_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.wallet_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          description TEXT,
          reference_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create referrals table
    const { error: referralsError } = await supabaseAdmin.rpc('create_referrals_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.referrals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          referee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          bonus_paid BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usersError || artistsError || tracksError || streamsError || tipsError || walletError || referralsError) {
      console.error('Database setup errors:', { usersError, artistsError, tracksError, streamsError, tipsError, walletError, referralsError });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Database setup failed:', error);
    return false;
  }
};

// Helper functions
export const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};
