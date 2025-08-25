// Music Player Component
class MusicPlayer {
    constructor() {
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.volume = 0.7;
        this.isShuffled = false;
        this.isLooped = false;
        this.audio = new Audio();
        this.originalPlaylist = [];
        
        this.init();
    }
    
    init() {
        this.setupAudioEvents();
        this.createPlayerUI();
        this.loadSampleTracks();
    }
    
    setupAudioEvents() {
        this.audio.addEventListener('loadedmetadata', () => {
            this.updateDuration();
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        this.audio.addEventListener('ended', () => {
            this.nextTrack();
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showNotification('Error playing track', 'error');
        });
    }
    
    createPlayerUI() {
        const playerHTML = `
            <div id="musicPlayer" class="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 transform translate-y-full transition-transform duration-300">
                <div class="max-w-7xl mx-auto px-4 py-3">
                    <div class="flex items-center justify-between">
                        <!-- Track Info -->
                        <div class="flex items-center space-x-4 flex-1 min-w-0">
                            <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i data-lucide="music" class="w-6 h-6 text-white"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <h4 id="playerTrackTitle" class="text-white font-medium truncate">No track playing</h4>
                                <p id="playerArtistName" class="text-gray-400 text-sm truncate">Select a track to start</p>
                            </div>
                        </div>
                        
                        <!-- Controls -->
                        <div class="flex items-center space-x-4">
                            <button id="shuffleBtn" class="text-gray-400 hover:text-white transition-colors">
                                <i data-lucide="shuffle" class="w-5 h-5"></i>
                            </button>
                            <button id="prevBtn" class="text-gray-400 hover:text-white transition-colors">
                                <i data-lucide="skip-back" class="w-5 h-5"></i>
                            </button>
                            <button id="playPauseBtn" class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all">
                                <i data-lucide="play" class="w-5 h-5 text-white"></i>
                            </button>
                            <button id="nextBtn" class="text-gray-400 hover:text-white transition-colors">
                                <i data-lucide="skip-forward" class="w-5 h-5"></i>
                            </button>
                            <button id="loopBtn" class="text-gray-400 hover:text-white transition-colors">
                                <i data-lucide="repeat" class="w-5 h-5"></i>
                            </button>
                        </div>
                        
                        <!-- Progress & Volume -->
                        <div class="flex items-center space-x-4 flex-1 max-w-md">
                            <span id="currentTime" class="text-gray-400 text-sm">0:00</span>
                            <div class="flex-1 relative">
                                <input id="progressBar" type="range" min="0" max="100" value="0" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider">
                            </div>
                            <span id="duration" class="text-gray-400 text-sm">0:00</span>
                            <div class="flex items-center space-x-2">
                                <i data-lucide="volume-2" class="w-4 h-4 text-gray-400"></i>
                                <input id="volumeSlider" type="range" min="0" max="100" value="70" class="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider">
                            </div>
                        </div>
                        
                        <!-- Queue & Settings -->
                        <div class="flex items-center space-x-2">
                            <button id="queueBtn" class="text-gray-400 hover:text-white transition-colors">
                                <i data-lucide="list" class="w-5 h-5"></i>
                            </button>
                            <button id="minimizeBtn" class="text-gray-400 hover:text-white transition-colors">
                                <i data-lucide="chevron-down" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Queue Panel -->
                <div id="queuePanel" class="hidden bg-gray-800 border-t border-gray-700 max-h-64 overflow-y-auto">
                    <div class="max-w-7xl mx-auto px-4 py-3">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-white font-medium">Queue</h3>
                            <button id="closeQueueBtn" class="text-gray-400 hover:text-white transition-colors">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div id="queueList" class="space-y-2">
                            <!-- Queue items will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', playerHTML);
        this.bindEvents();
        this.addSliderStyles();
    }
    
    addSliderStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .slider::-webkit-slider-thumb {
                appearance: none;
                height: 12px;
                width: 12px;
                border-radius: 50%;
                background: #8b5cf6;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .slider::-webkit-slider-thumb:hover {
                background: #7c3aed;
                transform: scale(1.2);
            }
            .slider::-moz-range-thumb {
                height: 12px;
                width: 12px;
                border-radius: 50%;
                background: #8b5cf6;
                cursor: pointer;
                border: none;
                transition: all 0.2s ease;
            }
            .slider::-moz-range-thumb:hover {
                background: #7c3aed;
                transform: scale(1.2);
            }
        `;
        document.head.appendChild(style);
    }
    
    bindEvents() {
        // Play/Pause
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlay();
        });
        
        // Previous/Next
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousTrack();
        });
        
        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextTrack();
        });
        
        // Shuffle/Loop
        document.getElementById('shuffleBtn').addEventListener('click', () => {
            this.toggleShuffle();
        });
        
        document.getElementById('loopBtn').addEventListener('click', () => {
            this.toggleLoop();
        });
        
        // Progress bar
        document.getElementById('progressBar').addEventListener('input', (e) => {
            this.seekTo(e.target.value);
        });
        
        // Volume
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // Queue
        document.getElementById('queueBtn').addEventListener('click', () => {
            this.toggleQueue();
        });
        
        document.getElementById('closeQueueBtn').addEventListener('click', () => {
            this.toggleQueue();
        });
        
        // Minimize
        document.getElementById('minimizeBtn').addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousTrack();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextTrack();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.setVolume(Math.min(1, this.volume + 0.1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.setVolume(Math.max(0, this.volume - 0.1));
                    break;
            }
        });
    }
    
    loadSampleTracks() {
        this.playlist = [
            {
                id: 1,
                title: 'Midnight Dreams',
                artist: 'Alex Rivers',
                genre: 'Electronic',
                duration: '3:45',
                url: '#', // Placeholder for actual audio URL
                cover: 'purple'
            },
            {
                id: 2,
                title: 'Ocean Waves',
                artist: 'Sarah Chen',
                genre: 'Ambient',
                duration: '4:12',
                url: '#',
                cover: 'blue'
            },
            {
                id: 3,
                title: 'Urban Beat',
                artist: 'DJ Marcus',
                genre: 'Hip Hop',
                duration: '2:58',
                url: '#',
                cover: 'green'
            },
            {
                id: 4,
                title: 'Sunset Vibes',
                artist: 'Luna Sky',
                genre: 'Pop',
                duration: '5:23',
                url: '#',
                cover: 'yellow'
            },
            {
                id: 5,
                title: 'Electric Dreams',
                artist: 'Neon Pulse',
                genre: 'Electronic',
                duration: '3:31',
                url: '#',
                cover: 'pink'
            }
        ];
        
        this.originalPlaylist = [...this.playlist];
        this.updateQueueDisplay();
    }
    
    playTrack(track = null) {
        if (track) {
            this.currentTrack = track;
            this.currentIndex = this.playlist.findIndex(t => t.id === track.id);
        }
        
        if (!this.currentTrack && this.playlist.length > 0) {
            this.currentTrack = this.playlist[0];
            this.currentIndex = 0;
        }
        
        if (this.currentTrack) {
            // In a real implementation, this would load the actual audio file
            // For now, we'll simulate playing
            this.audio.src = this.currentTrack.url;
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
                this.updateTrackInfo();
                this.showNotification(`Now playing: ${this.currentTrack.title}`, 'success');
            }).catch(error => {
                console.error('Error playing track:', error);
                this.showNotification('Error playing track', 'error');
            });
        }
    }
    
    togglePlay() {
        if (!this.currentTrack) {
            this.playTrack();
            return;
        }
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.isPlaying = true;
        }
        
        this.updatePlayButton();
    }
    
    previousTrack() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.playlist.length - 1;
        }
        this.playTrack(this.playlist[this.currentIndex]);
    }
    
    nextTrack() {
        if (this.currentIndex < this.playlist.length - 1) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0;
        }
        this.playTrack(this.playlist[this.currentIndex]);
    }
    
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        const shuffleBtn = document.getElementById('shuffleBtn');
        
        if (this.isShuffled) {
            shuffleBtn.classList.add('text-purple-400');
            this.shufflePlaylist();
        } else {
            shuffleBtn.classList.remove('text-purple-400');
            this.playlist = [...this.originalPlaylist];
        }
        
        this.updateQueueDisplay();
    }
    
    toggleLoop() {
        this.isLooped = !this.isLooped;
        const loopBtn = document.getElementById('loopBtn');
        
        if (this.isLooped) {
            loopBtn.classList.add('text-purple-400');
        } else {
            loopBtn.classList.remove('text-purple-400');
        }
    }
    
    shufflePlaylist() {
        const shuffled = [...this.playlist];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        this.playlist = shuffled;
    }
    
    seekTo(percent) {
        const time = (percent / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }
    
    setVolume(volume) {
        this.volume = volume;
        this.audio.volume = volume;
        document.getElementById('volumeSlider').value = volume * 100;
    }
    
    toggleQueue() {
        const queuePanel = document.getElementById('queuePanel');
        queuePanel.classList.toggle('hidden');
    }
    
    toggleMinimize() {
        const player = document.getElementById('musicPlayer');
        player.classList.toggle('translate-y-full');
    }
    
    updatePlayButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const icon = playPauseBtn.querySelector('i');
        
        if (this.isPlaying) {
            icon.setAttribute('data-lucide', 'pause');
        } else {
            icon.setAttribute('data-lucide', 'play');
        }
        
        // Reinitialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    updateTrackInfo() {
        if (this.currentTrack) {
            document.getElementById('playerTrackTitle').textContent = this.currentTrack.title;
            document.getElementById('playerArtistName').textContent = this.currentTrack.artist;
        }
    }
    
    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        const currentTime = document.getElementById('currentTime');
        const duration = document.getElementById('duration');
        
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            progressBar.value = progress;
            
            currentTime.textContent = this.formatTime(this.audio.currentTime);
            duration.textContent = this.formatTime(this.audio.duration);
        }
    }
    
    updateDuration() {
        const duration = document.getElementById('duration');
        duration.textContent = this.formatTime(this.audio.duration);
    }
    
    updateQueueDisplay() {
        const queueList = document.getElementById('queueList');
        queueList.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            const queueItem = document.createElement('div');
            queueItem.className = `flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer ${index === this.currentIndex ? 'bg-purple-500/20' : ''}`;
            queueItem.innerHTML = `
                <div class="w-8 h-8 bg-gradient-to-r from-${track.cover}-500 to-${track.cover}-600 rounded flex items-center justify-center">
                    <i data-lucide="music" class="w-4 h-4 text-white"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-white text-sm font-medium truncate">${track.title}</p>
                    <p class="text-gray-400 text-xs truncate">${track.artist}</p>
                </div>
                <span class="text-gray-400 text-xs">${track.duration}</span>
            `;
            
            queueItem.addEventListener('click', () => {
                this.playTrack(track);
            });
            
            queueList.appendChild(queueItem);
        });
        
        // Reinitialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Public methods for external use
    playTrackById(trackId) {
        const track = this.playlist.find(t => t.id === trackId);
        if (track) {
            this.playTrack(track);
        }
    }
    
    addToQueue(track) {
        this.playlist.push(track);
        this.originalPlaylist.push(track);
        this.updateQueueDisplay();
    }
    
    removeFromQueue(index) {
        this.playlist.splice(index, 1);
        this.originalPlaylist.splice(index, 1);
        this.updateQueueDisplay();
    }
    
    getCurrentTrack() {
        return this.currentTrack;
    }
    
    getPlaylist() {
        return this.playlist;
    }
    
    isTrackPlaying() {
        return this.isPlaying;
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();
    
    // Make play buttons work across the site
    document.addEventListener('click', (e) => {
        if (e.target.closest('.play-button')) {
            const trackCard = e.target.closest('.track-card');
            if (trackCard) {
                const trackTitle = trackCard.querySelector('h3').textContent;
                const artistName = trackCard.querySelector('p').textContent.replace('by ', '');
                
                // Find track in playlist
                const track = window.musicPlayer.playlist.find(t => 
                    t.title === trackTitle && t.artist === artistName
                );
                
                if (track) {
                    window.musicPlayer.playTrack(track);
                    window.musicPlayer.toggleMinimize(); // Show player
                }
            }
        }
    });
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayer;
}
