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
    const { query, page = 1, limit = 10 } = req.query;

    try {
      // Sample external music data (in production, this would come from Openverse API)
      const externalTracks = [
        {
          id: 'ext_001',
          title: 'Ambient Space Journey',
          artist: 'Cosmic Waves',
          source: 'Openverse',
          sourceUrl: 'https://openverse.org/music/ambient-space-journey',
          license: 'CC BY 4.0',
          licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
          duration: '3:45',
          genre: 'Ambient',
          tags: ['space', 'ambient', 'relaxing'],
          thumbnail: 'https://via.placeholder.com/300x300/667eea/ffffff?text=Space+Journey',
          downloadUrl: 'https://openverse.org/download/ambient-space-journey',
          attribution: 'Ambient Space Journey by Cosmic Waves is licensed under CC BY 4.0',
          external: true
        },
        {
          id: 'ext_002',
          title: 'Upbeat Electronic Beat',
          artist: 'Digital Pulse',
          source: 'Free Music Archive',
          sourceUrl: 'https://freemusicarchive.org/music/upbeat-electronic-beat',
          license: 'CC BY-SA 3.0',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
          duration: '2:30',
          genre: 'Electronic',
          tags: ['electronic', 'upbeat', 'dance'],
          thumbnail: 'https://via.placeholder.com/300x300/764ba2/ffffff?text=Electronic+Beat',
          downloadUrl: 'https://freemusicarchive.org/download/upbeat-electronic-beat',
          attribution: 'Upbeat Electronic Beat by Digital Pulse is licensed under CC BY-SA 3.0',
          external: true
        },
        {
          id: 'ext_003',
          title: 'Acoustic Folk Melody',
          artist: 'Mountain Echo',
          source: 'Openverse',
          sourceUrl: 'https://openverse.org/music/acoustic-folk-melody',
          license: 'CC0',
          licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
          duration: '4:15',
          genre: 'Folk',
          tags: ['acoustic', 'folk', 'melody'],
          thumbnail: 'https://via.placeholder.com/300x300/f093fb/ffffff?text=Folk+Melody',
          downloadUrl: 'https://openverse.org/download/acoustic-folk-melody',
          attribution: 'Acoustic Folk Melody by Mountain Echo is in the public domain (CC0)',
          external: true
        }
      ];

      // Filter by query if provided
      let filteredTracks = externalTracks;
      if (query) {
        const searchTerm = query.toLowerCase();
        filteredTracks = externalTracks.filter(track => 
          track.title.toLowerCase().includes(searchTerm) ||
          track.artist.toLowerCase().includes(searchTerm) ||
          track.genre.toLowerCase().includes(searchTerm) ||
          track.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedTracks = filteredTracks.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        tracks: paginatedTracks,
        total: filteredTracks.length,
        page: parseInt(page),
        limit: parseInt(limit),
        source: 'external',
        message: `Found ${filteredTracks.length} external tracks`
      });

    } catch (error) {
      console.error('Error fetching external tracks:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch external tracks',
        message: 'Unable to load external music sources at this time'
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
