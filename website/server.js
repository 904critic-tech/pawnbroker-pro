const express = require('express');
const path = require('path');
const musicRouter = require('./api/music');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/music', musicRouter);
app.use('/api/ai-music', require('./api/ai-music-generator'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/music-browse.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'music-browse.html'));
});

app.get('/music-upload.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'music-upload.html'));
});

app.get('/music-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'music-dashboard.html'));
});

app.get('/licensing-info.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'licensing-info.html'));
});

app.get('/support-artists.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'support-artists.html'));
});

app.get('/youtube-audio-library.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'youtube-audio-library.html'));
});

app.get('/ai-music-generator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ai-music-generator.html'));
});



app.get('/about-us.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'about-us.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/privacy-policy.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

app.get('/terms-of-service.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'terms-of-service.html'));
});

// Audio file serving (for demo purposes, you'd typically use a CDN)
app.get('/audio/:filename', (req, res) => {
    // For demo purposes, we'll serve placeholder audio files
    // In production, you'd serve actual audio files from a CDN or storage service
    res.status(404).json({ 
        message: 'Audio file not found. In production, this would serve actual audio files.',
        filename: req.params.filename 
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Something went wrong!' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Route not found' 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Music API available at http://localhost:${PORT}/api/music`);
    console.log(`Browse page: http://localhost:${PORT}/music-browse.html`);
});

module.exports = app;
