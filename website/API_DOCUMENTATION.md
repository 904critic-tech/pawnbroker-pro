# Music Platform API Documentation

## Overview
This API provides access to royalty-free music tracks for your video editing program. You can browse tracks, get random selections, and download music for your projects.

## Base URL
```
https://streamautoclipper-3u9f9e3qm-904critic-techs-projects.vercel.app/api/music
```

## Authentication
Currently, no authentication is required for demo purposes. In production, you would need API keys.

## Endpoints

### 1. Get All Tracks
**GET** `/tracks`

Returns all available tracks with optional filtering and pagination.

**Query Parameters:**
- `genre` (string) - Filter by genre (e.g., "ambient", "hip-hop", "electronic")
- `mood` (string) - Filter by mood (e.g., "calm", "energetic", "upbeat")
- `search` (string) - Search in title, artist, or tags
- `sort` (string) - Sort by: "latest", "popular", "rating", "duration", "bpm"
- `limit` (number) - Number of tracks per page (default: 20)
- `offset` (number) - Number of tracks to skip (default: 0)

**Example Request:**
```bash
curl "https://streamautoclipper-czs8mt0uc-904critic-techs-projects.vercel.app/api/music/tracks?genre=ambient&mood=calm&limit=5"
```

**Example Response:**
```json
{
  "success": true,
  "tracks": [
    {
      "id": "1",
      "title": "Ambient Dreams",
      "artist": "Sarah Chen",
      "genre": "ambient",
      "mood": "calm",
      "duration": "3:45",
      "bpm": 85,
      "key": "C",
      "tags": ["ambient", "calm", "meditation", "relaxing"],
      "license": "royalty-free",
      "price": 0,
      "external": false,
      "audioUrl": "/audio/ambient-dreams.mp3",
      "description": "Peaceful ambient music perfect for meditation and relaxation content.",
      "uploadDate": "2024-01-15",
      "plays": 1247,
      "downloads": 89,
      "rating": 4.8
    }
  ],
  "total": 10,
  "page": 1,
  "totalPages": 2
}
```

### 2. Get Random Track
**GET** `/random`

Returns a random track matching optional criteria. Perfect for automatic music selection in video editing.

**Query Parameters:**
- `genre` (string) - Filter by genre
- `mood` (string) - Filter by mood
- `duration` (number) - Target duration in seconds (within 30 seconds tolerance)
- `bpm` (number) - Target BPM (within 10 BPM tolerance)
- `key` (string) - Musical key (e.g., "C", "F", "G")
- `excludeIds` (string) - Comma-separated list of track IDs to exclude

**Example Request:**
```bash
curl "https://streamautoclipper-czs8mt0uc-904critic-techs-projects.vercel.app/api/music/random?genre=ambient&mood=calm&duration=240"
```

**Example Response:**
```json
{
  "success": true,
  "track": {
    "id": "3",
    "title": "Ocean Waves",
    "artist": "Elena Rodriguez",
    "genre": "ambient",
    "mood": "peaceful",
    "duration": "4:12",
    "bpm": 70,
    "key": "G",
    "audioUrl": "/audio/ocean-waves.mp3"
  },
  "totalAvailable": 5
}
```

### 3. Get Multiple Random Tracks
**GET** `/random/{count}`

Returns multiple random tracks. Useful for creating playlists or getting multiple options.

**Path Parameters:**
- `count` (number) - Number of random tracks to return

**Query Parameters:** (same as single random track)

**Example Request:**
```bash
curl "https://streamautoclipper-czs8mt0uc-904critic-techs-projects.vercel.app/api/music/random/3?genre=electronic&mood=energetic"
```

**Example Response:**
```json
{
  "success": true,
  "tracks": [
    {
      "id": "4",
      "title": "Tech Startup",
      "artist": "Alex Chen",
      "genre": "electronic",
      "mood": "upbeat",
      "duration": "3:20",
      "bpm": 120,
      "audioUrl": "/audio/tech-startup.mp3"
    }
  ],
  "totalAvailable": 8,
  "requested": 3
}
```

### 4. Get Specific Track
**GET** `/track/{id}`

Returns details for a specific track by ID.

**Example Request:**
```bash
curl "https://streamautoclipper-czs8mt0uc-904critic-techs-projects.vercel.app/api/music/track/1"
```

### 5. Search Tracks
**GET** `/search`

Advanced search with multiple filters.

**Query Parameters:**
- `q` (string) - Search query
- `genre` (string) - Filter by genre
- `mood` (string) - Filter by mood
- `duration` (number) - Target duration
- `bpm` (number) - Target BPM
- `key` (string) - Musical key
- `license` (string) - License type
- `external` (boolean) - Include external tracks

**Example Request:**
```bash
curl "https://streamautoclipper-czs8mt0uc-904critic-techs-projects.vercel.app/api/music/search?q=workout&genre=electronic&bpm=150"
```

### 6. Get Available Genres
**GET** `/genres`

Returns list of all available genres.

**Example Response:**
```json
{
  "success": true,
  "genres": ["ambient", "cinematic", "electronic", "hip-hop", "jazz", "synthwave"]
}
```

### 7. Get Available Moods
**GET** `/moods`

Returns list of all available moods.

**Example Response:**
```json
{
  "success": true,
  "moods": ["calm", "chill", "energetic", "ethereal", "inspiring", "mysterious", "peaceful", "upbeat"]
}
```

### 8. Get Available Keys
**GET** `/keys`

Returns list of all available musical keys.

**Example Response:**
```json
{
  "success": true,
  "keys": ["A", "B", "C", "D", "E", "F", "G"]
}
```

### 9. Get Statistics
**GET** `/stats`

Returns platform statistics.

**Example Response:**
```json
{
  "success": true,
  "stats": {
    "totalTracks": 10,
    "platformTracks": 8,
    "externalTracks": 2,
    "genres": 6,
    "moods": 8,
    "totalPlays": 12345,
    "totalDownloads": 890,
    "averageRating": 4.7,
    "averageDuration": 3.8,
    "averageBpm": 105
  }
}
```

## Integration Examples

### For Video Editing Program

#### 1. Get Random Background Music
```python
import requests

def get_random_background_music(video_duration, mood="calm"):
    url = "https://streamautoclipper-czs8mt0uc-904critic-techs-projects.vercel.app/api/music/random"
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

#### 2. Get Multiple Options for Selection
```python
def get_music_options(genre, count=5):
    url = f"https://streamautoclipper-czs8mt0uc-904critic-techs-projects.vercel.app/api/music/random/{count}"
    params = {"genre": genre}
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        return data["tracks"]
    return []

# Usage
options = get_music_options("ambient", 3)
for track in options:
    print(f"- {track['title']} ({track['duration']})")
```

#### 3. Search for Specific Type of Music
```python
def search_music(query, bpm_range=None):
    url = "https://streamautoclipper-czs8mt0uc-904critic-techs-projects.vercel.app/api/music/search"
    params = {"q": query}
    
    if bpm_range:
        params["bpm"] = bpm_range[0]  # Use min BPM
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        return data["tracks"]
    return []

# Usage
workout_tracks = search_music("workout", bpm_range=(140, 160))
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `404` - Track not found
- `500` - Server error

## Rate Limiting
Currently no rate limiting is implemented for demo purposes. In production, you would have rate limits.

## Audio File Access
Audio files are served at `/audio/{filename}`. For demo purposes, these return 404 errors since we don't have actual audio files. In production, these would serve actual MP3 files.

## License Information
All tracks include license information. Make sure to:
1. Check the license type before using
2. Provide proper attribution when required
3. Follow license terms and conditions

## Support
For API support or questions, contact the development team.
