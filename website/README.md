# Music Platform - Complete Music Solution

A comprehensive music platform that connects independent artists with content creators, featuring a full-featured website with music playback, API integration, and video editing program compatibility.

## 🎵 Features

### For Content Creators
- **Browse Music**: Discover thousands of royalty-free tracks
- **Advanced Search**: Filter by genre, mood, BPM, duration, and more
- **Music Player**: Full-featured web player with queue management
- **Random Selection**: Perfect for automatic music selection in video editing
- **External Sources**: Access to Creative Commons and external music
- **License Information**: Clear licensing details and attribution requirements

### For Independent Artists
- **Upload Music**: Share your tracks with the community
- **Artist Dashboard**: Track earnings, plays, and downloads
- **Promotion Tools**: Get your music discovered by content creators
- **Fair Compensation**: Earn from your music while helping creators

### For Video Editing Programs
- **API Integration**: RESTful API for automatic music selection
- **Random Track Selection**: Get perfectly matched music for your videos
- **Multiple Options**: Get several tracks to choose from
- **Advanced Filtering**: Filter by duration, BPM, genre, mood, and key
- **License Compliance**: Automatic license information and attribution

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd music-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the platform**
   - Website: http://localhost:3000
   - Browse Music: http://localhost:3000/music-browse.html
   - API Documentation: See `API_DOCUMENTATION.md`

## 🎬 Video Editor Integration

### Python Integration Example

```python
import requests

def get_random_background_music(video_duration, mood="calm"):
    url = "http://localhost:3000/api/music/random"
    params = {
        "duration": video_duration,
        "mood": mood,
        "excludeIds": "1,2,3"  # Exclude previously used tracks
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        return data["track"]
    return None

# Usage
track = get_random_background_music(180, "energetic")
if track:
    print(f"Selected: {track['title']} by {track['artist']}")
    print(f"Duration: {track['duration']}, BPM: {track['bpm']}")
```

### Complete Integration Script

Run the provided integration script to see all features in action:

```bash
python video_editor_integration.py
```

## 📡 API Endpoints

### Core Endpoints
- `GET /api/music/tracks` - Get all tracks with filtering
- `GET /api/music/random` - Get random track (perfect for video editing)
- `GET /api/music/random/{count}` - Get multiple random tracks
- `GET /api/music/search` - Advanced search functionality
- `GET /api/music/track/{id}` - Get specific track details

### Metadata Endpoints
- `GET /api/music/genres` - Available genres
- `GET /api/music/moods` - Available moods
- `GET /api/music/keys` - Available musical keys
- `GET /api/music/stats` - Platform statistics

### Filtering Options
- **Genre**: ambient, electronic, hip-hop, jazz, cinematic, synthwave
- **Mood**: calm, energetic, upbeat, chill, inspiring, mysterious, peaceful, ethereal
- **Duration**: Target duration in seconds (with 30-second tolerance)
- **BPM**: Target BPM (with 10 BPM tolerance)
- **Key**: Musical key (C, D, E, F, G, A, B)
- **License**: royalty-free, CC BY 4.0, CC BY-SA 3.0

## 🎵 Music Player Features

### Web Player
- **Play/Pause Controls**: Full playback control
- **Progress Bar**: Click to seek, visual progress
- **Queue Management**: Add tracks, remove tracks, view queue
- **Volume Control**: Mute/unmute functionality
- **Minimize/Maximize**: Collapsible player interface
- **Track Information**: Title, artist, duration display

### Queue Features
- **Add to Queue**: Click play button to add tracks
- **Queue Modal**: View and manage current queue
- **Remove Tracks**: Remove individual tracks from queue
- **Auto-advance**: Automatically play next track
- **Current Track Highlighting**: Visual indication of playing track

## 🎨 Website Features

### Pages
- **Home** (`index.html`) - Landing page with platform overview
- **Browse Music** (`music-browse.html`) - Main music discovery page
- **Upload Music** (`music-upload.html`) - Artist upload interface
- **Artist Dashboard** (`music-dashboard.html`) - Artist management
- **Licensing Info** (`licensing-info.html`) - License details and compliance
- **Support Artists** (`support-artists.html`) - Ways to support artists
- **About Us** (`about-us.html`) - Company information
- **Contact** (`contact.html`) - Contact information and support
- **Privacy Policy** (`privacy-policy.html`) - Privacy policy
- **Terms of Service** (`terms-of-service.html`) - Terms and conditions

### Design Features
- **Dark Theme**: Modern dark interface
- **Responsive Design**: Works on all screen sizes
- **Glass Effects**: Beautiful backdrop blur effects
- **Gradient Accents**: Purple to pink gradients
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: High contrast, keyboard navigation

## 🔧 Technical Stack

### Frontend
- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework
- **JavaScript**: Vanilla JS for interactivity
- **Lucide Icons**: Beautiful icon library
- **Google Fonts**: Inter font family

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **RESTful API**: JSON-based API design

### Features
- **CORS Support**: Cross-origin resource sharing
- **Error Handling**: Comprehensive error responses
- **Static File Serving**: Efficient file delivery
- **API Documentation**: Complete endpoint documentation

## 📊 Sample Data

The platform includes 10 sample tracks:

### Platform Tracks (8)
1. **Ambient Dreams** - Sarah Chen (ambient, calm)
2. **Urban Beat** - Marcus Johnson (hip-hop, energetic)
3. **Ocean Waves** - Elena Rodriguez (ambient, peaceful)
4. **Tech Startup** - Alex Chen (electronic, upbeat)
5. **Mountain Sunrise** - Sarah Chen (cinematic, inspiring)
6. **Coffee Shop Vibes** - Marcus Johnson (jazz, chill)
7. **Night Drive** - Elena Rodriguez (synthwave, mysterious)
8. **Workout Energy** - Alex Chen (electronic, energetic)

### External Tracks (2)
1. **Creative Commons Beat** - CC Artist (hip-hop, upbeat)
2. **Ambient Space** - Space Composer (ambient, ethereal)

## 🎯 Use Cases

### For Content Creators
- **YouTube Videos**: Find perfect background music
- **Podcasts**: Royalty-free intro/outro music
- **Social Media**: Short-form video content
- **Commercial Projects**: Licensed music for ads
- **Educational Content**: Background music for tutorials

### For Video Editing Programs
- **Automatic Selection**: AI-powered music matching
- **Batch Processing**: Multiple video music selection
- **Template Music**: Consistent branding music
- **Mood Matching**: Emotion-based music selection
- **Duration Matching**: Perfect length music tracks

### For Independent Artists
- **Exposure**: Get discovered by content creators
- **Revenue**: Earn from music licensing
- **Community**: Connect with other artists
- **Analytics**: Track performance and engagement
- **Promotion**: Built-in promotion tools

## 🔒 Licensing

### Platform Tracks
- **Royalty-Free**: No ongoing fees
- **Commercial Use**: Allowed for commercial projects
- **Attribution**: Required for platform tracks
- **No Restrictions**: Unlimited use within license terms

### External Tracks
- **Creative Commons**: Various CC licenses
- **Attribution Required**: Must credit original artists
- **Source Links**: Direct links to original sources
- **License Compliance**: Follow original license terms

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Start with nodemon for development
```

### Production Deployment
```bash
npm start    # Start production server
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## 📚 Documentation

- **API Documentation**: `API_DOCUMENTATION.md`
- **Integration Examples**: `video_editor_integration.py`
- **Code Comments**: Comprehensive inline documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions:
- Check the API documentation
- Review the integration examples
- Contact the development team

## 🎉 Success!

Your music platform is now complete with:
- ✅ Full-featured website with music playback
- ✅ Comprehensive API for video editing integration
- ✅ Random track selection for automatic music matching
- ✅ Beautiful, responsive design
- ✅ Complete documentation and examples

The platform is ready for content creators, independent artists, and video editing programs to use!
