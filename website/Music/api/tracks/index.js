import { supabase, formatDuration, formatNumber } from '../lib/supabase.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 20, genre, search, sort = 'latest' } = req.query;

      // Build query
      let query = supabase
        .from('tracks')
        .select(`
          *,
          artists!inner (
            artist_name,
            users!inner (
              username
            )
          )
        `)
        .eq('status', 'active');

      // Apply filters
      if (genre) {
        query = query.eq('genre', genre);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,artists.artist_name.ilike.%${search}%`);
      }

      // Apply sorting
      switch (sort) {
        case 'popular':
          query = query.order('plays', { ascending: false });
          break;
        case 'downloads':
          query = query.order('downloads', { ascending: false });
          break;
        case 'duration':
          query = query.order('duration', { ascending: true });
          break;
        case 'artist':
          query = query.order('artists.artist_name', { ascending: true });
          break;
        default: // latest
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + parseInt(limit) - 1;
      query = query.range(from, to);

      const { data: tracks, error, count } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Transform data for frontend
      const transformedTracks = tracks.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artists.artist_name,
        genre: track.genre,
        duration: track.duration,
        plays: track.plays,
        downloads: track.downloads,
        thumbnailUrl: track.thumbnail_url,
        audioUrl: track.audio_url,
        createdAt: track.created_at,
        formattedDuration: formatDuration(track.duration),
        formattedPlays: formatNumber(track.plays),
        formattedDownloads: formatNumber(track.downloads)
      }));

      res.status(200).json({
        tracks: transformedTracks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || tracks.length,
          totalPages: Math.ceil((count || tracks.length) / limit)
        }
      });

    } catch (error) {
      console.error('Get tracks error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch tracks',
        message: 'An error occurred while fetching tracks'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
