// Music API for the Music Platform
// Provides track data, playback functionality, and random track selection

const express = require('express');
const router = express.Router();

// Sample music tracks database
const musicTracks = [
    {
        id: '1',
        title: 'Ambient Dreams',
        artist: 'Sarah Chen',
        genre: 'ambient',
        mood: 'calm',
        duration: '3:45',
        bpm: 85,
        key: 'C',
        tags: ['ambient', 'calm', 'meditation', 'relaxing'],
        license: 'royalty-free',
        price: 0,
        external: false,
        audioUrl: '/audio/ambient-dreams.mp3',
        waveform: [0.1, 0.3, 0.5, 0.7, 0.9, 0.7, 0.5, 0.3, 0.1],
        description: 'Peaceful ambient music perfect for meditation and relaxation content.',
        uploadDate: '2024-01-15',
        plays: 1247,
        downloads: 89,
        rating: 4.8
    },
    {
        id: '2',
        title: 'Urban Beat',
        artist: 'Marcus Johnson',
        genre: 'hip-hop',
        mood: 'energetic',
        duration: '2:58',
        bpm: 140,
        key: 'F',
        tags: ['hip-hop', 'energetic', 'urban', 'beats'],
        license: 'royalty-free',
        price: 0,
        external: false,
        audioUrl: '/audio/urban-beat.mp3',
        waveform: [0.8, 0.9, 0.7, 0.8, 0.9, 0.8, 0.7, 0.8, 0.9],
        description: 'High-energy hip-hop beat for urban content and vlogs.',
        uploadDate: '2024-01-20',
        plays: 2156,
        downloads: 156,
        rating: 4.6
    },
    {
        id: '3',
        title: 'Ocean Waves',
        artist: 'Elena Rodriguez',
        genre: 'ambient',
        mood: 'peaceful',
        duration: '4:12',
        bpm: 70,
        key: 'G',
        tags: ['ambient', 'peaceful', 'nature', 'ocean'],
        license: 'royalty-free',
        price: 0,
        external: false,
        audioUrl: '/audio/ocean-waves.mp3',
        waveform: [0.2, 0.4, 0.6, 0.8, 0.6, 0.4, 0.2, 0.4, 0.6],
        description: 'Soothing ocean sounds with gentle ambient music.',
        uploadDate: '2024-01-25',
        plays: 892,
        downloads: 67,
        rating: 4.9
    },
    {
        id: '4',
        title: 'Tech Startup',
        artist: 'Alex Chen',
        genre: 'electronic',
        mood: 'upbeat',
        duration: '3:20',
        bpm: 120,
        key: 'D',
        tags: ['electronic', 'upbeat', 'tech', 'startup'],
        license: 'royalty-free',
        price: 0,
        external: false,
        audioUrl: '/audio/tech-startup.mp3',
        waveform: [0.6, 0.8, 0.7, 0.9, 0.8, 0.7, 0.8, 0.9, 0.7],
        description: 'Modern electronic track perfect for tech and startup content.',
        uploadDate: '2024-02-01',
        plays: 1876,
        downloads: 134,
        rating: 4.7
    },
    {
        id: '5',
        title: 'Mountain Sunrise',
        artist: 'Sarah Chen',
        genre: 'cinematic',
        mood: 'inspiring',
        duration: '5:15',
        bpm: 90,
        key: 'A',
        tags: ['cinematic', 'inspiring', 'nature', 'adventure'],
        license: 'royalty-free',
        price: 0,
        external: false,
        audioUrl: '/audio/mountain-sunrise.mp3',
        waveform: [0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.5, 0.7],
        description: 'Epic cinematic music for adventure and nature content.',
        uploadDate: '2024-02-05',
        plays: 1567,
        downloads: 98,
        rating: 4.8
    },
    {
        id: '6',
        title: 'Coffee Shop Vibes',
        artist: 'Marcus Johnson',
        genre: 'jazz',
        mood: 'chill',
        duration: '3:55',
        bpm: 95,
        key: 'E',
        tags: ['jazz', 'chill', 'coffee', 'lifestyle'],
        license: 'royalty-free',
        price: 0,
        external: false,
        audioUrl: '/audio/coffee-shop-vibes.mp3',
        waveform: [0.4, 0.6, 0.5, 0.7, 0.6, 0.5, 0.6, 0.7, 0.5],
        description: 'Smooth jazz perfect for lifestyle and coffee content.',
        uploadDate: '2024-02-10',
        plays: 2341,
        downloads: 178,
        rating: 4.5
    },
    {
        id: '7',
        title: 'Night Drive',
        artist: 'Elena Rodriguez',
        genre: 'synthwave',
        mood: 'mysterious',
        duration: '4:30',
        bpm: 110,
        key: 'B',
        tags: ['synthwave', 'mysterious', 'night', 'drive'],
        license: 'royalty-free',
        price: 0,
        external: false,
        audioUrl: '/audio/night-drive.mp3',
        waveform: [0.5, 0.7, 0.6, 0.8, 0.7, 0.6, 0.7, 0.8, 0.6],
        description: 'Atmospheric synthwave for night driving and urban content.',
        uploadDate: '2024-02-15',
        plays: 1123,
        downloads: 76,
        rating: 4.6
    },
    {
        id: '8',
        title: 'Workout Energy',
        artist: 'Alex Chen',
        genre: 'electronic',
        mood: 'energetic',
        duration: '3:15',
        bpm: 150,
        key: 'C',
        tags: ['electronic', 'energetic', 'workout', 'fitness'],
        license: 'royalty-free',
        price: 0,
        external: false,
        audioUrl: '/audio/workout-energy.mp3',
        waveform: [0.9, 0.8, 0.9, 0.8, 0.9, 0.8, 0.9, 0.8, 0.9],
        description: 'High-energy electronic track for workout and fitness content.',
        uploadDate: '2024-02-20',
        plays: 2987,
        downloads: 245,
        rating: 4.7
    }
];

// External tracks from various sources
const externalTracks = [
    {
        id: 'ext-1',
        title: 'Creative Commons Beat',
        artist: 'CC Artist',
        genre: 'hip-hop',
        mood: 'upbeat',
        duration: '3:30',
        bpm: 130,
        key: 'G',
        tags: ['hip-hop', 'upbeat', 'creative-commons'],
        license: 'CC BY 4.0',
        price: 0,
        external: true,
        source: 'Free Music Archive',
        sourceUrl: 'https://freemusicarchive.org/track/creative-commons-beat',
        audioUrl: 'https://freemusicarchive.org/audio/creative-commons-beat.mp3',
        waveform: [0.7, 0.8, 0.7, 0.9, 0.8, 0.7, 0.8, 0.9, 0.7],
        description: 'Upbeat hip-hop track available under Creative Commons license.',
        uploadDate: '2024-01-10',
        plays: 567,
        downloads: 34,
        rating: 4.3
    },
    {
        id: 'ext-2',
        title: 'Ambient Space',
        artist: 'Space Composer',
        genre: 'ambient',
        mood: 'ethereal',
        duration: '4:45',
        bpm: 75,
        key: 'D',
        tags: ['ambient', 'ethereal', 'space', 'atmospheric'],
        license: 'CC BY-SA 3.0',
        price: 0,
        external: true,
        source: 'Incompetech',
        sourceUrl: 'https://incompetech.com/music/ambient-space',
        audioUrl: 'https://incompetech.com/audio/ambient-space.mp3',
        waveform: [0.2, 0.4, 0.6, 0.8, 0.6, 0.4, 0.2, 0.4, 0.6],
        description: 'Ethereal ambient music perfect for space and sci-fi content.',
        uploadDate: '2024-01-12',
        plays: 789,
        downloads: 45,
        rating: 4.4
    }
];

// Get all tracks (platform + external)
router.get('/tracks', (req, res) => {
    try {
        const { genre, mood, search, sort = 'latest', limit = 20, offset = 0 } = req.query;
        
        let tracks = [...musicTracks, ...externalTracks];
        
        // Apply filters
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                track.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        // Apply sorting
        switch (sort) {
            case 'latest':
                tracks.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
                break;
            case 'popular':
                tracks.sort((a, b) => b.plays - a.plays);
                break;
            case 'rating':
                tracks.sort((a, b) => b.rating - a.rating);
                break;
            case 'duration':
                tracks.sort((a, b) => parseFloat(a.duration) - parseFloat(b.duration));
                break;
            case 'bpm':
                tracks.sort((a, b) => a.bpm - b.bpm);
                break;
        }
        
        // Apply pagination
        const paginatedTracks = tracks.slice(offset, offset + parseInt(limit));
        
        res.json({
            success: true,
            tracks: paginatedTracks,
            total: tracks.length,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(tracks.length / limit)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tracks',
            message: error.message
        });
    }
});

// Get platform tracks only
router.get('/platform', (req, res) => {
    try {
        const { genre, mood, search, sort = 'latest', limit = 20, offset = 0 } = req.query;
        
        let tracks = [...musicTracks];
        
        // Apply filters
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                track.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        // Apply sorting
        switch (sort) {
            case 'latest':
                tracks.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
                break;
            case 'popular':
                tracks.sort((a, b) => b.plays - a.plays);
                break;
            case 'rating':
                tracks.sort((a, b) => b.rating - a.rating);
                break;
        }
        
        // Apply pagination
        const paginatedTracks = tracks.slice(offset, offset + parseInt(limit));
        
        res.json({
            success: true,
            tracks: paginatedTracks,
            total: tracks.length,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(tracks.length / limit)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch platform tracks',
            message: error.message
        });
    }
});

// Get external tracks only
router.get('/external', (req, res) => {
    try {
        const { genre, mood, search, sort = 'latest', limit = 20, offset = 0 } = req.query;
        
        let tracks = [...externalTracks];
        
        // Apply filters
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                track.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        // Apply sorting
        switch (sort) {
            case 'latest':
                tracks.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
                break;
            case 'popular':
                tracks.sort((a, b) => b.plays - a.plays);
                break;
            case 'rating':
                tracks.sort((a, b) => b.rating - a.rating);
                break;
        }
        
        // Apply pagination
        const paginatedTracks = tracks.slice(offset, offset + parseInt(limit));
        
        res.json({
            success: true,
            tracks: paginatedTracks,
            total: tracks.length,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(tracks.length / limit)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch external tracks',
            message: error.message
        });
    }
});

// Get a specific track by ID
router.get('/track/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        // Search in both platform and external tracks
        const track = [...musicTracks, ...externalTracks].find(t => t.id === id);
        
        if (!track) {
            return res.status(404).json({
                success: false,
                error: 'Track not found'
            });
        }
        
        res.json({
            success: true,
            track
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch track',
            message: error.message
        });
    }
});

// Get random track (for video editing program)
router.get('/random', (req, res) => {
    try {
        const { genre, mood, duration, bpm, key, excludeIds } = req.query;
        
        let tracks = [...musicTracks, ...externalTracks];
        
        // Apply filters
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        if (duration) {
            const targetDuration = parseFloat(duration);
            tracks = tracks.filter(track => {
                const trackDuration = parseFloat(track.duration);
                return Math.abs(trackDuration - targetDuration) <= 30; // Within 30 seconds
            });
        }
        
        if (bpm) {
            const targetBpm = parseInt(bpm);
            tracks = tracks.filter(track => {
                return Math.abs(track.bpm - targetBpm) <= 10; // Within 10 BPM
            });
        }
        
        if (key) {
            tracks = tracks.filter(track => track.key === key);
        }
        
        if (excludeIds) {
            const excludeArray = excludeIds.split(',');
            tracks = tracks.filter(track => !excludeArray.includes(track.id));
        }
        
        if (tracks.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No tracks found matching criteria'
            });
        }
        
        // Select random track
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        
        res.json({
            success: true,
            track: randomTrack,
            totalAvailable: tracks.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get random track',
            message: error.message
        });
    }
});

// Get multiple random tracks
router.get('/random/:count', (req, res) => {
    try {
        const { count } = req.params;
        const { genre, mood, duration, bpm, key, excludeIds } = req.query;
        
        let tracks = [...musicTracks, ...externalTracks];
        
        // Apply filters
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        if (duration) {
            const targetDuration = parseFloat(duration);
            tracks = tracks.filter(track => {
                const trackDuration = parseFloat(track.duration);
                return Math.abs(trackDuration - targetDuration) <= 30;
            });
        }
        
        if (bpm) {
            const targetBpm = parseInt(bpm);
            tracks = tracks.filter(track => {
                return Math.abs(track.bpm - targetBpm) <= 10;
            });
        }
        
        if (key) {
            tracks = tracks.filter(track => track.key === key);
        }
        
        if (excludeIds) {
            const excludeArray = excludeIds.split(',');
            tracks = tracks.filter(track => !excludeArray.includes(track.id));
        }
        
        if (tracks.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No tracks found matching criteria'
            });
        }
        
        // Shuffle tracks and select requested count
        const shuffled = tracks.sort(() => 0.5 - Math.random());
        const selectedTracks = shuffled.slice(0, Math.min(parseInt(count), tracks.length));
        
        res.json({
            success: true,
            tracks: selectedTracks,
            totalAvailable: tracks.length,
            requested: parseInt(count)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get random tracks',
            message: error.message
        });
    }
});

// Get available genres
router.get('/genres', (req, res) => {
    try {
        const genres = [...new Set([...musicTracks, ...externalTracks].map(track => track.genre))];
        res.json({
            success: true,
            genres: genres.sort()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch genres',
            message: error.message
        });
    }
});

// Get available moods
router.get('/moods', (req, res) => {
    try {
        const moods = [...new Set([...musicTracks, ...externalTracks].map(track => track.mood))];
        res.json({
            success: true,
            moods: moods.sort()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch moods',
            message: error.message
        });
    }
});

// Get available keys
router.get('/keys', (req, res) => {
    try {
        const keys = [...new Set([...musicTracks, ...externalTracks].map(track => track.key))];
        res.json({
            success: true,
            keys: keys.sort()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch keys',
            message: error.message
        });
    }
});

// Search tracks
router.get('/search', (req, res) => {
    try {
        const { q, genre, mood, duration, bpm, key, license, external } = req.query;
        
        let tracks = [...musicTracks, ...externalTracks];
        
        // Apply search query
        if (q) {
            const searchLower = q.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                track.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
                track.description.toLowerCase().includes(searchLower)
            );
        }
        
        // Apply filters
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        if (duration) {
            const targetDuration = parseFloat(duration);
            tracks = tracks.filter(track => {
                const trackDuration = parseFloat(track.duration);
                return Math.abs(trackDuration - targetDuration) <= 30;
            });
        }
        
        if (bpm) {
            const targetBpm = parseInt(bpm);
            tracks = tracks.filter(track => {
                return Math.abs(track.bpm - targetBpm) <= 10;
            });
        }
        
        if (key) {
            tracks = tracks.filter(track => track.key === key);
        }
        
        if (license) {
            tracks = tracks.filter(track => track.license === license);
        }
        
        if (external !== undefined) {
            const isExternal = external === 'true';
            tracks = tracks.filter(track => track.external === isExternal);
        }
        
        res.json({
            success: true,
            tracks,
            total: tracks.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to search tracks',
            message: error.message
        });
    }
});

// Get track statistics
router.get('/stats', (req, res) => {
    try {
        const allTracks = [...musicTracks, ...externalTracks];
        
        const stats = {
            totalTracks: allTracks.length,
            platformTracks: musicTracks.length,
            externalTracks: externalTracks.length,
            genres: [...new Set(allTracks.map(track => track.genre))].length,
            moods: [...new Set(allTracks.map(track => track.mood))].length,
            totalPlays: allTracks.reduce((sum, track) => sum + track.plays, 0),
            totalDownloads: allTracks.reduce((sum, track) => sum + track.downloads, 0),
            averageRating: (allTracks.reduce((sum, track) => sum + track.rating, 0) / allTracks.length).toFixed(1),
            averageDuration: (allTracks.reduce((sum, track) => sum + parseFloat(track.duration), 0) / allTracks.length).toFixed(1),
            averageBpm: Math.round(allTracks.reduce((sum, track) => sum + track.bpm, 0) / allTracks.length)
        };
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            message: error.message
        });
    }
});

// Generate attribution for external tracks
router.post('/attribution', (req, res) => {
    try {
        const { trackId, trackTitle, artist, source, sourceUrl, license, licenseUrl } = req.body;
        
        // Generate attribution text based on license type
        let attributionText = '';
        let licenseInfo = '';
        
        if (license === 'CC BY 4.0') {
            attributionText = `"${trackTitle}" by ${artist} is licensed under CC BY 4.0. Available at: ${sourceUrl}`;
            licenseInfo = 'Creative Commons Attribution 4.0 International License. You must give appropriate credit, provide a link to the license, and indicate if changes were made.';
        } else if (license === 'CC BY-SA 3.0') {
            attributionText = `"${trackTitle}" by ${artist} is licensed under CC BY-SA 3.0. Available at: ${sourceUrl}`;
            licenseInfo = 'Creative Commons Attribution-ShareAlike 3.0 Unported License. You must give appropriate credit, provide a link to the license, and indicate if changes were made. If you remix, transform, or build upon the material, you must distribute your contributions under the same license.';
        } else {
            attributionText = `"${trackTitle}" by ${artist} from ${source}. Available at: ${sourceUrl}`;
            licenseInfo = `License: ${license}. Please check the license terms at: ${licenseUrl || sourceUrl}`;
        }
        
        res.json({
            success: true,
            attribution: {
                text: attributionText,
                licenseInfo: licenseInfo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate attribution',
            message: error.message
        });
    }
});

// YouTube Audio Library Integration
// Real videos from Audio Library channel (UCht8qITGkBvXKsR1Byln-wA)
const youtubeAudioLibraryVideos = [
    {
        id: 'yt_1',
        videoId: 'nAxa8WWI30w', // Real Audio Library video from user
        title: 'Inferno - No Copyright Music',
        artist: 'Next Route',
        channelId: 'UCht8qITGkBvXKsR1Byln-wA',
        channelName: 'Audio Library — No Copyright Music',
        genre: 'dance-electronic',
        mood: 'dark',
        duration: '3:45',
        tags: ['no copyright', 'royalty free', 'dance', 'electronic', 'dark', 'inferno'],
        license: 'No Copyright',
        licenseUrl: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
        description: 'Dark electronic dance track perfect for intense content and dramatic scenes.',
        uploadDate: '2024-01-15',
        views: 1250000,
        likes: 45000,
        embedUrl: 'https://www.youtube.com/embed/nAxa8WWI30w',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        attribution: {
            text: 'Music: "Inferno" by Next Route from Audio Library — No Copyright Music',
            link: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
            requirements: 'Credit the artist and link back to the original release'
        }
    },
    {
        id: 'yt_2',
        videoId: '89ihROphQJM', // Real Audio Library video from user
        title: 'FRICTION - No Copyright Music',
        artist: 'Mezhdunami',
        channelId: 'UCht8qITGkBvXKsR1Byln-wA',
        channelName: 'Audio Library — No Copyright Music',
        genre: 'dance-electronic',
        mood: 'bright',
        duration: '2:58',
        tags: ['no copyright', 'royalty free', 'dance', 'electronic', 'bright', 'friction'],
        license: 'No Copyright',
        licenseUrl: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
        description: 'Bright electronic dance track for energetic and uplifting content.',
        uploadDate: '2024-01-20',
        views: 890000,
        likes: 32000,
        embedUrl: 'https://www.youtube.com/embed/89ihROphQJM',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        attribution: {
            text: 'Music: "FRICTION" by Mezhdunami from Audio Library — No Copyright Music',
            link: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
            requirements: 'Credit the artist and link back to the original release'
        }
    },
    {
        id: 'yt_3',
        videoId: 'Tv3V7lgZynw', // Real Audio Library video from user
        title: 'Paradox - No Copyright Music',
        artist: 'KV',
        channelId: 'UCht8qITGkBvXKsR1Byln-wA',
        channelName: 'Audio Library — No Copyright Music',
        genre: 'dance-electronic',
        mood: 'inspirational',
        duration: '4:12',
        tags: ['no copyright', 'royalty free', 'dance', 'electronic', 'inspirational', 'paradox'],
        license: 'No Copyright',
        licenseUrl: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
        description: 'Inspirational electronic track perfect for motivational and uplifting content.',
        uploadDate: '2024-01-25',
        views: 2100000,
        likes: 78000,
        embedUrl: 'https://www.youtube.com/embed/Tv3V7lgZynw',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        attribution: {
            text: 'Music: "Paradox" by KV from Audio Library — No Copyright Music',
            link: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
            requirements: 'Credit the artist and link back to the original release'
        }
    },
    {
        id: 'yt_4',
        videoId: 'lTRiuFIWV54', // Additional Audio Library video
        title: 'Retroverse, Pt. 2 - No Copyright Music',
        artist: 'Lucjo',
        channelId: 'UCht8qITGkBvXKsR1Byln-wA',
        channelName: 'Audio Library — No Copyright Music',
        genre: 'dance-electronic',
        mood: 'dark',
        duration: '3:30',
        tags: ['no copyright', 'royalty free', 'dance', 'electronic', 'dark', 'retroverse'],
        license: 'No Copyright',
        licenseUrl: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
        description: 'Dark electronic track with retro vibes perfect for atmospheric content.',
        uploadDate: '2024-02-01',
        views: 1560000,
        likes: 52000,
        embedUrl: 'https://www.youtube.com/embed/lTRiuFIWV54',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        attribution: {
            text: 'Music: "Retroverse, Pt. 2" by Lucjo from Audio Library — No Copyright Music',
            link: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
            requirements: 'Credit the artist and link back to the original release'
        }
    },
    {
        id: 'yt_5',
        videoId: 'DWcJFNfaw9c', // Working Audio Library video
        title: 'Cinema - No Copyright Music',
        artist: 'Alex-Productions',
        channelId: 'UCht8qITGkBvXKsR1Byln-wA',
        channelName: 'Audio Library — No Copyright Music',
        genre: 'cinematic',
        mood: 'dramatic',
        duration: '3:20',
        tags: ['no copyright', 'royalty free', 'cinematic', 'dramatic', 'cinema'],
        license: 'No Copyright',
        licenseUrl: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
        description: 'Dramatic cinematic track perfect for film, trailers, and dramatic content.',
        uploadDate: '2024-02-05',
        views: 670000,
        likes: 24000,
        embedUrl: 'https://www.youtube.com/embed/DWcJFNfaw9c',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        attribution: {
            text: 'Music: "Cinema" by Alex-Productions from Audio Library — No Copyright Music',
            link: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
            requirements: 'Credit the artist and link back to the original release'
        }
    },
    {
        id: 'yt_6',
        videoId: 'lTRiuFIWV54', // Working Audio Library video
        title: 'Retroverse, Pt. 2 - No Copyright Music',
        artist: 'Lucjo',
        channelId: 'UCht8qITGkBvXKsR1Byln-wA',
        channelName: 'Audio Library — No Copyright Music',
        genre: 'dance-electronic',
        mood: 'dark',
        duration: '3:30',
        tags: ['no copyright', 'royalty free', 'dance', 'electronic', 'dark', 'retroverse'],
        license: 'No Copyright',
        licenseUrl: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
        description: 'Dark electronic track with retro vibes perfect for atmospheric content.',
        uploadDate: '2024-02-10',
        views: 1560000,
        likes: 52000,
        embedUrl: 'https://www.youtube.com/embed/lTRiuFIWV54',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        attribution: {
            text: 'Music: "Retroverse, Pt. 2" by Lucjo from Audio Library — No Copyright Music',
            link: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
            requirements: 'Credit the artist and link back to the original release'
        }
    }
];

// Audio Library Website Integration
// Tracks from https://www.audiolibrary.com.co/
const audioLibraryWebsiteTracks = [
    {
        id: 'al_1',
        title: 'Inferno',
        artist: 'Next Route',
        genre: 'dance-electronic',
        mood: 'dark',
        duration: '3:45',
        tags: ['dance', 'electronic', 'dark', 'inferno'],
        license: 'No Copyright',
        licenseUrl: 'https://www.audiolibrary.com.co/',
        description: 'Dark electronic dance track perfect for intense content.',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        externalLinks: {
            youtube: 'https://www.youtube.com/watch?v=nAxa8WWI30w',
            spotify: null,
            soundcloud: null,
            appleMusic: null,
            youtubeMusic: null
        },
        attribution: {
            text: 'Music: "Inferno" by Next Route',
            link: 'https://www.audiolibrary.com.co/',
            requirements: 'Credit the artist and link back to the original release'
        }
    },
    {
        id: 'al_2',
        title: 'FRICTION',
        artist: 'Mezhdunami',
        genre: 'dance-electronic',
        mood: 'bright',
        duration: '2:58',
        tags: ['dance', 'electronic', 'bright', 'friction'],
        license: 'No Copyright',
        licenseUrl: 'https://www.audiolibrary.com.co/',
        description: 'Bright electronic dance track for energetic content.',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        externalLinks: {
            youtube: 'https://www.youtube.com/watch?v=89ihROphQJM',
            spotify: 'https://open.spotify.com/track/friction',
            soundcloud: 'https://soundcloud.com/mezhdunami/friction',
            appleMusic: 'https://music.apple.com/track/friction',
            youtubeMusic: 'https://music.youtube.com/watch?v=friction'
        },
        attribution: {
            text: 'Music: "FRICTION" by Mezhdunami',
            link: 'https://www.audiolibrary.com.co/',
            requirements: 'Credit the artist and link back to the original release'
        }
    },
    {
        id: 'al_3',
        title: 'Paradox',
        artist: 'KV',
        genre: 'dance-electronic',
        mood: 'inspirational',
        duration: '4:12',
        tags: ['dance', 'electronic', 'inspirational', 'paradox'],
        license: 'No Copyright',
        licenseUrl: 'https://www.audiolibrary.com.co/',
        description: 'Inspirational electronic track for motivational content.',
        downloadUrl: 'https://www.audiolibrary.com.co/',
        externalLinks: {
            youtube: 'https://www.youtube.com/watch?v=Tv3V7lgZynw',
            spotify: 'https://open.spotify.com/track/paradox',
            soundcloud: 'https://soundcloud.com/kv/paradox',
            appleMusic: 'https://music.apple.com/track/paradox',
            youtubeMusic: 'https://music.youtube.com/watch?v=paradox'
        },
        attribution: {
            text: 'Music: "Paradox" by KV',
            link: 'https://www.audiolibrary.com.co/',
            requirements: 'Credit the artist and link back to the original release'
        }
    }
];

// Get YouTube Audio Library videos
router.get('/youtube', (req, res) => {
    try {
        const { genre, mood, search } = req.query;
        let videos = [...youtubeAudioLibraryVideos];
        
        // Filter by genre
        if (genre) {
            videos = videos.filter(video => video.genre === genre);
        }
        
        // Filter by mood
        if (mood) {
            videos = videos.filter(video => video.mood === mood);
        }
        
        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            videos = videos.filter(video => 
                video.title.toLowerCase().includes(searchLower) ||
                video.description.toLowerCase().includes(searchLower) ||
                video.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        res.json({
            success: true,
            videos,
            total: videos.length,
            channel: {
                name: 'Audio Library — No Copyright Music',
                id: 'UCht8qITGkBvXKsR1Byln-wA',
                url: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
                description: 'Free, No Copyright, Royalty-Free Background Music for content creators'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch YouTube videos',
            message: error.message
        });
    }
});

// Get Audio Library Website tracks
router.get('/audiolibrary', (req, res) => {
    try {
        const { genre, mood, search } = req.query;
        let tracks = [...audioLibraryWebsiteTracks];
        
        // Filter by genre
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        // Filter by mood
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                track.description.toLowerCase().includes(searchLower) ||
                track.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        res.json({
            success: true,
            tracks,
            total: tracks.length,
            source: {
                name: 'Audio Library',
                url: 'https://www.audiolibrary.com.co/',
                description: 'Free, No Copyright, Royalty-Free Background Music for content creators'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Audio Library tracks',
            message: error.message
        });
    }
});

// Get all Audio Library content (YouTube + Website)
router.get('/audiolibrary/all', (req, res) => {
    try {
        const { genre, mood, search, source } = req.query;
        let allContent = [];
        
        // Add YouTube videos
        const youtubeVideos = youtubeAudioLibraryVideos.map(video => ({
            ...video,
            source: 'youtube',
            sourceName: 'YouTube Audio Library'
        }));
        
        // Add website tracks
        const websiteTracks = audioLibraryWebsiteTracks.map(track => ({
            ...track,
            source: 'website',
            sourceName: 'Audio Library Website'
        }));
        
        allContent = [...youtubeVideos, ...websiteTracks];
        
        // Filter by source
        if (source) {
            allContent = allContent.filter(item => item.source === source);
        }
        
        // Filter by genre
        if (genre) {
            allContent = allContent.filter(item => item.genre === genre);
        }
        
        // Filter by mood
        if (mood) {
            allContent = allContent.filter(item => item.mood === mood);
        }
        
        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            allContent = allContent.filter(item => 
                item.title.toLowerCase().includes(searchLower) ||
                (item.artist && item.artist.toLowerCase().includes(searchLower)) ||
                (item.description && item.description.toLowerCase().includes(searchLower)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
        }
        
        res.json({
            success: true,
            content: allContent,
            total: allContent.length,
            sources: {
                youtube: {
                    name: 'YouTube Audio Library',
                    url: 'https://www.youtube.com/channel/UCht8qITGkBvXKsR1Byln-wA',
                    count: youtubeVideos.length
                },
                website: {
                    name: 'Audio Library Website',
                    url: 'https://www.audiolibrary.com.co/',
                    count: websiteTracks.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Audio Library content',
            message: error.message
        });
    }
});

// Get specific YouTube video
router.get('/youtube/:videoId', (req, res) => {
    try {
        const { videoId } = req.params;
        const video = youtubeAudioLibraryVideos.find(v => v.videoId === videoId);
        
        if (!video) {
            return res.status(404).json({
                success: false,
                error: 'Video not found'
            });
        }
        
        res.json({
            success: true,
            video
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch video',
            message: error.message
        });
    }
});

// Generate download link for YouTube video (simulated)
router.post('/youtube/:videoId/download', (req, res) => {
    try {
        const { videoId } = req.params;
        const video = youtubeAudioLibraryVideos.find(v => v.videoId === videoId);
        
        if (!video) {
            return res.status(404).json({
                success: false,
                error: 'Video not found'
            });
        }
        
        // In a real implementation, this would generate a download link
        // For now, we'll return the YouTube URL with download instructions
        const downloadInfo = {
            videoId,
            title: video.title,
            artist: video.artist,
            downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
            downloadInstructions: [
                '1. Visit the YouTube video link above',
                '2. Use YouTube\'s download feature or a trusted YouTube downloader',
                '3. Ensure you follow the attribution requirements',
                '4. Credit the artist and link back to the original release'
            ],
            attribution: video.attribution,
            license: video.license,
            licenseUrl: video.licenseUrl
        };
        
        res.json({
            success: true,
            downloadInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate download link',
            message: error.message
        });
    }
});

// Free Music Archive Integration
// Legitimate royalty-free music from Free Music Archive
const freeMusicArchiveTracks = [
    {
        id: 'fma_1',
        title: 'Creative Commons Beat',
        artist: 'CC Artist',
        genre: 'hip-hop',
        mood: 'upbeat',
        duration: '3:30',
        tags: ['hip-hop', 'upbeat', 'creative-commons', 'royalty-free'],
        license: 'CC BY 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        description: 'Upbeat hip-hop track available under Creative Commons license.',
        downloadUrl: 'https://freemusicarchive.org/track/creative-commons-beat',
        audioUrl: 'https://freemusicarchive.org/audio/creative-commons-beat.mp3',
        attribution: {
            text: 'Music: "Creative Commons Beat" by CC Artist',
            link: 'https://freemusicarchive.org/track/creative-commons-beat',
            requirements: 'Credit the artist and link back to the original release'
        }
    },
    {
        id: 'fma_2',
        title: 'Ambient Space',
        artist: 'Space Composer',
        genre: 'ambient',
        mood: 'ethereal',
        duration: '4:45',
        tags: ['ambient', 'ethereal', 'space', 'atmospheric', 'royalty-free'],
        license: 'CC BY-SA 3.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
        description: 'Ethereal ambient music perfect for space and sci-fi content.',
        downloadUrl: 'https://freemusicarchive.org/track/ambient-space',
        audioUrl: 'https://freemusicarchive.org/audio/ambient-space.mp3',
        attribution: {
            text: 'Music: "Ambient Space" by Space Composer',
            link: 'https://freemusicarchive.org/track/ambient-space',
            requirements: 'Credit the artist and link back to the original release'
        }
    }
];

// Incompetech Integration
// Kevin MacLeod's royalty-free music
const incompetechTracks = [
    {
        id: 'inc_1',
        title: 'Acoustic Breeze',
        artist: 'Kevin MacLeod',
        genre: 'acoustic',
        mood: 'calm',
        duration: '2:37',
        tags: ['acoustic', 'calm', 'breeze', 'royalty-free'],
        license: 'CC BY 3.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
        description: 'Peaceful acoustic track perfect for relaxing content.',
        downloadUrl: 'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100379',
        audioUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Acoustic%20Breeze.mp3',
        attribution: {
            text: 'Music: "Acoustic Breeze" by Kevin MacLeod (incompetech.com)',
            link: 'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100379',
            requirements: 'Licensed under Creative Commons: By Attribution 3.0 License'
        }
    },
    {
        id: 'inc_2',
        title: 'Air Prelude',
        artist: 'Kevin MacLeod',
        genre: 'classical',
        mood: 'dramatic',
        duration: '3:47',
        tags: ['classical', 'dramatic', 'prelude', 'royalty-free'],
        license: 'CC BY 3.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
        description: 'Dramatic classical piece for intense and emotional content.',
        downloadUrl: 'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100337',
        audioUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Air%20Prelude.mp3',
        attribution: {
            text: 'Music: "Air Prelude" by Kevin MacLeod (incompetech.com)',
            link: 'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100337',
            requirements: 'Licensed under Creative Commons: By Attribution 3.0 License'
        }
    }
];

// Pixabay Music Integration
// Royalty-free music from Pixabay
const pixabayTracks = [
    {
        id: 'pxb_1',
        title: 'Electronic Rock',
        artist: 'Pixabay Artist',
        genre: 'electronic',
        mood: 'energetic',
        duration: '2:45',
        tags: ['electronic', 'energetic', 'rock', 'royalty-free'],
        license: 'Pixabay License',
        licenseUrl: 'https://pixabay.com/service/license/',
        description: 'High-energy electronic rock track for dynamic content.',
        downloadUrl: 'https://pixabay.com/music/electronic-rock-123456/',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/electronic-rock-123456.mp3',
        attribution: {
            text: 'Music: "Electronic Rock" by Pixabay Artist',
            link: 'https://pixabay.com/music/electronic-rock-123456/',
            requirements: 'Free for commercial use. No attribution required.'
        }
    },
    {
        id: 'pxb_2',
        title: 'Corporate Upbeat',
        artist: 'Pixabay Artist',
        genre: 'corporate',
        mood: 'professional',
        duration: '1:58',
        tags: ['corporate', 'professional', 'upbeat', 'royalty-free'],
        license: 'Pixabay License',
        licenseUrl: 'https://pixabay.com/service/license/',
        description: 'Professional corporate music for business and commercial content.',
        downloadUrl: 'https://pixabay.com/music/corporate-upbeat-789012/',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/corporate-upbeat-789012.mp3',
        attribution: {
            text: 'Music: "Corporate Upbeat" by Pixabay Artist',
            link: 'https://pixabay.com/music/corporate-upbeat-789012/',
            requirements: 'Free for commercial use. No attribution required.'
        }
    }
];

// Get Free Music Archive tracks
router.get('/freemusicarchive', (req, res) => {
    try {
        const { genre, mood, search } = req.query;
        let tracks = [...freeMusicArchiveTracks];
        
        // Filter by genre
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        // Filter by mood
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                track.description.toLowerCase().includes(searchLower) ||
                track.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        res.json({
            success: true,
            tracks,
            total: tracks.length,
            source: {
                name: 'Free Music Archive',
                url: 'https://freemusicarchive.org/',
                description: 'Free, legal audio downloads. Creative Commons licensed music.'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Free Music Archive tracks',
            message: error.message
        });
    }
});

// Get Incompetech tracks
router.get('/incompetech', (req, res) => {
    try {
        const { genre, mood, search } = req.query;
        let tracks = [...incompetechTracks];
        
        // Filter by genre
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        // Filter by mood
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                track.description.toLowerCase().includes(searchLower) ||
                track.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        res.json({
            success: true,
            tracks,
            total: tracks.length,
            source: {
                name: 'Incompetech (Kevin MacLeod)',
                url: 'https://incompetech.com/',
                description: 'Royalty-free music by Kevin MacLeod. Creative Commons licensed.'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Incompetech tracks',
            message: error.message
        });
    }
});

// Get Pixabay tracks
router.get('/pixabay', (req, res) => {
    try {
        const { genre, mood, search } = req.query;
        let tracks = [...pixabayTracks];
        
        // Filter by genre
        if (genre) {
            tracks = tracks.filter(track => track.genre === genre);
        }
        
        // Filter by mood
        if (mood) {
            tracks = tracks.filter(track => track.mood === mood);
        }
        
        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower) ||
                track.description.toLowerCase().includes(searchLower) ||
                track.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        res.json({
            success: true,
            tracks,
            total: tracks.length,
            source: {
                name: 'Pixabay Music',
                url: 'https://pixabay.com/music/',
                description: 'Free for commercial use. No attribution required.'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Pixabay tracks',
            message: error.message
        });
    }
});

// Get all royalty-free music sources
router.get('/royalty-free/all', (req, res) => {
    try {
        const { genre, mood, search, source } = req.query;
        let allContent = [];
        
        // Add Free Music Archive tracks
        const fmaTracks = freeMusicArchiveTracks.map(track => ({
            ...track,
            source: 'freemusicarchive',
            sourceName: 'Free Music Archive'
        }));
        
        // Add Incompetech tracks
        const incTracks = incompetechTracks.map(track => ({
            ...track,
            source: 'incompetech',
            sourceName: 'Incompetech (Kevin MacLeod)'
        }));
        
        // Add Pixabay tracks
        const pxbTracks = pixabayTracks.map(track => ({
            ...track,
            source: 'pixabay',
            sourceName: 'Pixabay Music'
        }));
        
        allContent = [...fmaTracks, ...incTracks, ...pxbTracks];
        
        // Filter by source
        if (source) {
            allContent = allContent.filter(item => item.source === source);
        }
        
        // Filter by genre
        if (genre) {
            allContent = allContent.filter(item => item.genre === genre);
        }
        
        // Filter by mood
        if (mood) {
            allContent = allContent.filter(item => item.mood === mood);
        }
        
        // Search functionality
        if (search) {
            const searchLower = search.toLowerCase();
            allContent = allContent.filter(item => 
                item.title.toLowerCase().includes(searchLower) ||
                (item.artist && item.artist.toLowerCase().includes(searchLower)) ||
                (item.description && item.description.toLowerCase().includes(searchLower)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
        }
        
        res.json({
            success: true,
            content: allContent,
            total: allContent.length,
            sources: {
                freemusicarchive: {
                    name: 'Free Music Archive',
                    url: 'https://freemusicarchive.org/',
                    count: fmaTracks.length,
                    license: 'Creative Commons'
                },
                incompetech: {
                    name: 'Incompetech (Kevin MacLeod)',
                    url: 'https://incompetech.com/',
                    count: incTracks.length,
                    license: 'Creative Commons'
                },
                pixabay: {
                    name: 'Pixabay Music',
                    url: 'https://pixabay.com/music/',
                    count: pxbTracks.length,
                    license: 'Pixabay License'
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch royalty-free content',
            message: error.message
        });
    }
});

// Audio preview endpoint
router.get('/preview/:trackId', (req, res) => {
    const trackId = req.params.trackId;
    
    // Find the track
    let track = null;
    
    // Check in all track arrays
    if (trackId.startsWith('fma_')) {
        track = freeMusicArchiveTracks.find(t => t.id === trackId);
    } else if (trackId.startsWith('incomp_')) {
        track = incompetechTracks.find(t => t.id === trackId);
    } else if (trackId.startsWith('pixabay_')) {
        track = pixabayTracks.find(t => t.id === trackId);
    }
    
    if (!track) {
        return res.status(404).json({ success: false, error: 'Track not found' });
    }
    
    // For demo purposes, we'll serve a placeholder audio file
    // In production, you'd serve the actual audio file from your storage/CDN
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${track.title}.mp3"`);
    
    // Return a simple audio response (this would be the actual audio file in production)
    res.json({
        success: true,
        message: 'Audio preview endpoint - in production this would serve the actual audio file',
        track: {
            id: track.id,
            title: track.title,
            artist: track.artist,
            audioUrl: track.audioUrl || null
        }
    });
});

module.exports = router;
