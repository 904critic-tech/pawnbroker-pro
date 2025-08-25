import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function BrowseMusic() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchTracks();
  }, [searchTerm, selectedGenre, sortBy]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (sortBy) params.append('sort', sortBy);
      
      const response = await fetch(`/api/tracks?${params}`);
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (err) {
      setError('Failed to load tracks');
      console.error('Error fetching tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const genres = ['All', 'Lo-Fi', 'Electronic', 'Acoustic', 'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical'];

  return (
    <>
      <Head>
        <title>Browse Music - Music Platform</title>
        <meta name="description" content="Browse and discover royalty-free music from independent artists." />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Navigation */}
        <nav className="bg-black bg-opacity-20 backdrop-blur-lg border-b border-white border-opacity-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/music" className="text-white text-xl font-bold">Music Platform</a>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/music/browse" className="text-purple-300 font-semibold">Browse</a>
                <a href="/music/upload" className="text-white hover:text-purple-300 transition-colors">Upload</a>
                <a href="/music/dashboard" className="text-white hover:text-purple-300 transition-colors">Dashboard</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-8">Browse Music</h1>
          
          {/* Filters */}
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search tracks or artists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Genre Filter */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Genre</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Genres</option>
                  {genres.slice(1).map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                  <option value="downloads">Most Downloads</option>
                  <option value="artist">Artist Name</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tracks Grid */}
          {loading && (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
              <p className="mt-4">Loading tracks...</p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400">
              <p>{error}</p>
              <button onClick={fetchTracks} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tracks.map((track) => (
                  <div key={track.id} className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 hover:bg-opacity-20 transition-all group">
                    <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                      <span className="text-white text-3xl">🎵</span>
                      <button className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-2xl">▶️</span>
                      </button>
                    </div>
                    
                    <h3 className="text-white font-semibold text-lg mb-2 truncate">{track.title}</h3>
                    <p className="text-gray-300 mb-3 truncate">{track.artist}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span className="bg-purple-600 bg-opacity-50 px-2 py-1 rounded">{track.genre}</span>
                      <span>{track.formattedDuration || '3:00'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>👁️ {track.formattedPlays || '0'}</span>
                      <span>⬇️ {track.formattedDownloads || '0'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {tracks.length === 0 && (
                <div className="text-center text-white py-12">
                  <p className="text-xl mb-4">No tracks found</p>
                  <p className="text-gray-300">Try adjusting your search or filters</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
