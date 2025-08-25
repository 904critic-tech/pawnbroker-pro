import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MusicPlatform() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await fetch('/api/tracks');
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (err) {
      setError('Failed to load tracks');
      console.error('Error fetching tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Music Platform - Royalty-Free Music for Content Creators</title>
        <meta name="description" content="Discover royalty-free music for your content. Support independent artists directly through tipping." />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Navigation */}
        <nav className="bg-black bg-opacity-20 backdrop-blur-lg border-b border-white border-opacity-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-white text-xl font-bold">Music Platform</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/music/browse" className="text-white hover:text-purple-300 transition-colors">Browse</a>
                <a href="/music/upload" className="text-white hover:text-purple-300 transition-colors">Upload</a>
                <a href="/music/dashboard" className="text-white hover:text-purple-300 transition-colors">Dashboard</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Royalty-Free Music for
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> Content Creators</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Discover high-quality music from independent artists. Support creators directly through our unique tipping system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/music/browse" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105">
                  Start Browsing
                </a>
                <a href="/music/upload" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-900 transition-all">
                  Upload Your Music
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Tracks */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Featured Tracks</h2>
          
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.slice(0, 6).map((track) => (
                <div key={track.id} className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 hover:bg-opacity-20 transition-all">
                  <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl">🎵</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{track.title}</h3>
                  <p className="text-gray-300 mb-2">{track.artist}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{track.genre}</span>
                    <span>{track.formattedDuration || '3:00'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div className="text-center text-white">
              <p>No tracks available yet. Be the first to upload!</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="bg-black bg-opacity-20 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="animate-pulse-slow">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">Growing</div>
                <div className="text-gray-200">Content Creator Community</div>
              </div>
              <div className="animate-pulse-slow" style={{animationDelay: '-1s'}}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">Direct</div>
                <div className="text-gray-200">Artist Support</div>
              </div>
              <div className="animate-pulse-slow" style={{animationDelay: '-1.5s'}}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">100%</div>
                <div className="text-gray-200">Royalty-Free</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
