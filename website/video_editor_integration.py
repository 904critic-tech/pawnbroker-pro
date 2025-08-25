#!/usr/bin/env python3
"""
Video Editor Music Integration Script
Demonstrates how to integrate with the Music Platform API for automatic background music selection.
"""

import requests
import json
import time
from typing import Optional, List, Dict, Any

class MusicPlatformAPI:
    """Client for the Music Platform API"""
    
    def __init__(self, base_url: str = "https://streamautoclipper-3u9f9e3qm-904critic-techs-projects.vercel.app/api/music"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def get_random_track(self, 
                        genre: Optional[str] = None,
                        mood: Optional[str] = None,
                        duration: Optional[float] = None,
                        bpm: Optional[int] = None,
                        key: Optional[str] = None,
                        exclude_ids: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """
        Get a random track matching the specified criteria.
        Perfect for automatic background music selection.
        """
        params = {}
        if genre:
            params['genre'] = genre
        if mood:
            params['mood'] = mood
        if duration:
            params['duration'] = duration
        if bpm:
            params['bpm'] = bpm
        if key:
            params['key'] = key
        if exclude_ids:
            params['excludeIds'] = ','.join(exclude_ids)
        
        try:
            response = self.session.get(f"{self.base_url}/random", params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('success'):
                return data['track']
            else:
                print(f"API Error: {data.get('error', 'Unknown error')}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def get_multiple_random_tracks(self, 
                                 count: int,
                                 genre: Optional[str] = None,
                                 mood: Optional[str] = None,
                                 duration: Optional[float] = None,
                                 bpm: Optional[int] = None,
                                 key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get multiple random tracks for selection.
        """
        params = {}
        if genre:
            params['genre'] = genre
        if mood:
            params['mood'] = mood
        if duration:
            params['duration'] = duration
        if bpm:
            params['bpm'] = bpm
        if key:
            params['key'] = key
        
        try:
            response = self.session.get(f"{self.base_url}/random/{count}", params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('success'):
                return data['tracks']
            else:
                print(f"API Error: {data.get('error', 'Unknown error')}")
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return []
    
    def search_tracks(self, 
                     query: Optional[str] = None,
                     genre: Optional[str] = None,
                     mood: Optional[str] = None,
                     duration: Optional[float] = None,
                     bpm: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Search for tracks with specific criteria.
        """
        params = {}
        if query:
            params['q'] = query
        if genre:
            params['genre'] = genre
        if mood:
            params['mood'] = mood
        if duration:
            params['duration'] = duration
        if bpm:
            params['bpm'] = bpm
        
        try:
            response = self.session.get(f"{self.base_url}/search", params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('success'):
                return data['tracks']
            else:
                print(f"API Error: {data.get('error', 'Unknown error')}")
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return []
    
    def get_available_genres(self) -> List[str]:
        """Get list of available genres"""
        try:
            response = self.session.get(f"{self.base_url}/genres")
            response.raise_for_status()
            data = response.json()
            
            if data.get('success'):
                return data['genres']
            return []
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return []
    
    def get_available_moods(self) -> List[str]:
        """Get list of available moods"""
        try:
            response = self.session.get(f"{self.base_url}/moods")
            response.raise_for_status()
            data = response.json()
            
            if data.get('success'):
                return data['moods']
            return []
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return []

class VideoEditorMusicSelector:
    """Music selection logic for video editing"""
    
    def __init__(self):
        self.api = MusicPlatformAPI()
        self.used_track_ids = []  # Track previously used tracks to avoid repetition
    
    def select_background_music(self, 
                               video_duration: float,
                               content_type: str = "general",
                               mood: str = "neutral") -> Optional[Dict[str, Any]]:
        """
        Automatically select background music for a video.
        
        Args:
            video_duration: Duration of the video in seconds
            content_type: Type of content (e.g., "workout", "meditation", "tech", "lifestyle")
            mood: Desired mood ("calm", "energetic", "inspiring", etc.)
        
        Returns:
            Selected track information or None if no suitable track found
        """
        
        # Map content types to genres
        genre_mapping = {
            "workout": "electronic",
            "meditation": "ambient",
            "tech": "electronic",
            "lifestyle": "jazz",
            "adventure": "cinematic",
            "urban": "hip-hop",
            "nature": "ambient",
            "space": "ambient",
            "general": None
        }
        
        genre = genre_mapping.get(content_type.lower())
        
        # Select track
        track = self.api.get_random_track(
            genre=genre,
            mood=mood,
            duration=video_duration,
            exclude_ids=self.used_track_ids
        )
        
        if track:
            self.used_track_ids.append(track['id'])
            return track
        
        return None
    
    def get_music_options(self, 
                         content_type: str,
                         count: int = 5) -> List[Dict[str, Any]]:
        """
        Get multiple music options for manual selection.
        """
        genre_mapping = {
            "workout": "electronic",
            "meditation": "ambient",
            "tech": "electronic",
            "lifestyle": "jazz",
            "adventure": "cinematic",
            "urban": "hip-hop",
            "nature": "ambient",
            "space": "ambient",
            "general": None
        }
        
        genre = genre_mapping.get(content_type.lower())
        
        return self.api.get_multiple_random_tracks(count, genre=genre)
    
    def search_for_specific_music(self, 
                                query: str,
                                bpm_range: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        Search for specific type of music.
        """
        return self.api.search_tracks(query=query, bpm=bpm_range[0] if bpm_range else None)

def main():
    """Demo of the music selection functionality"""
    
    print("🎵 Video Editor Music Integration Demo")
    print("=" * 50)
    
    # Initialize the music selector
    selector = VideoEditorMusicSelector()
    
    # Demo 1: Automatic background music selection
    print("\n1. Automatic Background Music Selection")
    print("-" * 40)
    
    # Simulate different video types
    video_scenarios = [
        {"duration": 195, "content_type": "workout", "mood": "energetic"},  # 3:15
        {"duration": 285, "content_type": "meditation", "mood": "calm"},    # 4:45
        {"duration": 200, "content_type": "tech", "mood": "upbeat"},        # 3:20
        {"duration": 235, "content_type": "lifestyle", "mood": "chill"}     # 3:55
    ]
    
    for scenario in video_scenarios:
        print(f"\nVideo: {scenario['content_type']} ({scenario['duration']}s, {scenario['mood']} mood)")
        
        track = selector.select_background_music(
            video_duration=scenario['duration'],
            content_type=scenario['content_type'],
            mood=scenario['mood']
        )
        
        if track:
            print(f"✅ Selected: {track['title']} by {track['artist']}")
            print(f"   Duration: {track['duration']}, BPM: {track['bpm']}, Key: {track['key']}")
            print(f"   Genre: {track['genre']}, Mood: {track['mood']}")
            print(f"   License: {track['license']}")
        else:
            print("❌ No suitable track found")
    
    # Demo 2: Get multiple options
    print("\n\n2. Multiple Music Options")
    print("-" * 40)
    
    options = selector.get_music_options("ambient", count=3)
    print(f"Found {len(options)} ambient music options:")
    
    for i, track in enumerate(options, 1):
        print(f"{i}. {track['title']} by {track['artist']}")
        print(f"   Duration: {track['duration']}, BPM: {track['bpm']}")
    
    # Demo 3: Search for specific music
    print("\n\n3. Search for Specific Music")
    print("-" * 40)
    
    search_results = selector.search_for_specific_music("workout", bpm_range=(140, 160))
    print(f"Found {len(search_results)} workout tracks with high BPM:")
    
    for track in search_results:
        print(f"• {track['title']} by {track['artist']} (BPM: {track['bpm']})")
    
    # Demo 4: Available genres and moods
    print("\n\n4. Available Genres and Moods")
    print("-" * 40)
    
    api = MusicPlatformAPI()
    genres = api.get_available_genres()
    moods = api.get_available_moods()
    
    print(f"Available genres: {', '.join(genres)}")
    print(f"Available moods: {', '.join(moods)}")
    
    print("\n" + "=" * 50)
    print("🎬 Integration complete! Your video editor can now automatically select music.")
    print("📖 See API_DOCUMENTATION.md for complete API reference.")

if __name__ == "__main__":
    main()
