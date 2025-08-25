// API Client for Music Platform
class MusicAPI {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Authentication
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    async logout() {
        this.clearToken();
        return { message: 'Logged out successfully' };
    }

    // Tracks
    async getTracks(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/tracks?${params}`);
    }

    async getTrack(id) {
        return this.request(`/tracks/${id}`);
    }

    async recordStream(trackId) {
        return this.request(`/tracks/${trackId}/stream`, {
            method: 'POST'
        });
    }

    async recordDownload(trackId) {
        return this.request(`/tracks/${trackId}/download`, {
            method: 'POST'
        });
    }

    // Uploads
    async uploadTrack(trackData) {
        return this.request('/uploads/track', {
            method: 'POST',
            body: JSON.stringify(trackData)
        });
    }

    async uploadThumbnail(formData) {
        return this.request('/uploads/thumbnail', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
    }

    // Artists
    async getArtist(id) {
        return this.request(`/artists/${id}`);
    }

    async getArtistAnalytics(id) {
        return this.request(`/artists/${id}/analytics`);
    }

    // Wallet
    async getWalletBalance() {
        return this.request('/wallet/balance');
    }

    async sendTip(tipData) {
        return this.request('/wallet/tip', {
            method: 'POST',
            body: JSON.stringify(tipData)
        });
    }

    // Referrals
    async getReferralInfo() {
        return this.request('/referrals/info');
    }

    async getReferralEarnings() {
        return this.request('/referrals/earnings');
    }

    // Utility methods
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Create global API instance
window.musicAPI = new MusicAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicAPI;
}
