-- Music Platform Database Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
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

-- Create artists table
CREATE TABLE IF NOT EXISTS public.artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    artist_name VARCHAR(100) NOT NULL,
    bio TEXT,
    social_links JSONB,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create streams table
CREATE TABLE IF NOT EXISTS public.streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tips table
CREATE TABLE IF NOT EXISTS public.tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    to_artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    bonus_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON public.tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON public.tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON public.tracks(status);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON public.tracks(created_at);
CREATE INDEX IF NOT EXISTS idx_streams_track_id ON public.streams(track_id);
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON public.streams(user_id);
CREATE INDEX IF NOT EXISTS idx_tips_to_artist_id ON public.tips(to_artist_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Anyone can read tracks
CREATE POLICY "Anyone can view tracks" ON public.tracks
    FOR SELECT USING (true);

-- Artists can insert their own tracks
CREATE POLICY "Artists can insert tracks" ON public.tracks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.artists 
            WHERE id = artist_id AND user_id = auth.uid()
        )
    );

-- Artists can update their own tracks
CREATE POLICY "Artists can update own tracks" ON public.tracks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.artists 
            WHERE id = artist_id AND user_id = auth.uid()
        )
    );

-- Anyone can read artists
CREATE POLICY "Anyone can view artists" ON public.artists
    FOR SELECT USING (true);

-- Users can insert streams
CREATE POLICY "Users can insert streams" ON public.streams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can read streams (for analytics)
CREATE POLICY "Anyone can view streams" ON public.streams
    FOR SELECT USING (true);

-- Users can insert tips
CREATE POLICY "Users can insert tips" ON public.tips
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Anyone can read tips
CREATE POLICY "Anyone can view tips" ON public.tips
    FOR SELECT USING (true);

-- Users can view their own wallet transactions
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own wallet transactions
CREATE POLICY "Users can insert own wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own referrals
CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Users can insert referrals
CREATE POLICY "Users can insert referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON public.artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON public.tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.users (id, username, email, is_artist, referral_code) VALUES
    ('00000000-0000-0000-0000-000000000001', 'demo_user', 'demo@example.com', false, 'DEMO123'),
    ('00000000-0000-0000-0000-000000000002', 'chillwave', 'chillwave@example.com', true, 'CHILL1'),
    ('00000000-0000-0000-0000-000000000003', 'synthmaster', 'synthmaster@example.com', true, 'SYNTH1'),
    ('00000000-0000-0000-0000-000000000004', 'guitarhero', 'guitarhero@example.com', true, 'GUITAR1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.artists (id, user_id, artist_name, bio) VALUES
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'ChillWave', 'Lo-fi beats for your chill vibes'),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 'SynthMaster', 'Electronic music producer'),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000004', 'GuitarHero', 'Acoustic and electric guitar compositions')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tracks (id, artist_id, title, genre, mood, duration, audio_url, thumbnail_url, plays, downloads) VALUES
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Summer Vibes', 'Lo-Fi', 'Chill', 180, 'https://example.com/audio/summer-vibes.mp3', 'https://via.placeholder.com/300x300/667eea/ffffff?text=Summer+Vibes', 1250, 89),
    ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Night Drive', 'Electronic', 'Energetic', 240, 'https://example.com/audio/night-drive.mp3', 'https://via.placeholder.com/300x300/f093fb/ffffff?text=Night+Drive', 890, 67),
    ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'Acoustic Dreams', 'Acoustic', 'Peaceful', 200, 'https://example.com/audio/acoustic-dreams.mp3', 'https://via.placeholder.com/300x300/4facfe/ffffff?text=Acoustic+Dreams', 2100, 145)
ON CONFLICT (id) DO NOTHING;
