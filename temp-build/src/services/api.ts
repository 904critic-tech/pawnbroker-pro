import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineStorageService from './OfflineStorageService';
import { ENVIRONMENT } from '../config/environment';

// API Configuration with environment-specific endpoints
export const API_BASE_URL = ENVIRONMENT.API_BASE_URL;
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
};

// Types
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  role: 'pawnbroker' | 'admin';
  settings: {
    pawnPercentage: number;
    notifications: boolean;
    autoSave: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface Item {
  _id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  marketValue: number;
  pawnValue: number;
  notes?: string;
  imageUrl?: string;
  searchResults?: any[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface MarketData {
  estimatedValue: number;
  confidence: number;
  similarItems: Array<{
    title: string;
    price: number;
    soldDate: string;
    source: string;
  }>;
  marketTrends: {
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
  };
}

interface ImageRecognitionResult {
  itemName: string;
  confidence: number;
  category: string;
  brand?: string;
  model?: string;
}

// API Service Class
class ApiService {
  private token: string | null = null;

  // Initialize token from storage
  async initialize() {
    try {
      this.token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to initialize API service:', error);
    }
  }

  // Set authentication token
  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  // Clear authentication token
  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // Get headers for API requests
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method with token refresh
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && this.token) {
        console.log('Token expired, attempting refresh...');
        try {
          await this.refreshToken();
          // Retry the request with new token
          config.headers = this.getHeaders();
          const retryResponse = await fetch(url, config);
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            throw new Error(retryData.message || `HTTP ${retryResponse.status}`);
          }
          
          return retryData;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          await this.clearToken();
          throw new Error('Authentication expired. Please log in again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Token refresh method
  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update tokens
      await this.setToken(data.token);
      if (data.refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  }) {
    const response = await this.request<{
      success: boolean;
      token: string;
      user: User;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success) {
      await this.setToken(response.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    }

    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{
      success: boolean;
      token: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success) {
      await this.setToken(response.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.request<{ success: boolean; user: User }>('/auth/me');
      return response.success ? response.user : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Item management endpoints
  async createItem(itemData: {
    name: string;
    category: string;
    brand?: string;
    model?: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    notes?: string;
    imageUrl?: string;
  }) {
    // Check if offline
    if (!offlineStorageService.isCurrentlyOnline()) {
      console.log('📱 Offline mode: Queuing item creation');
      
      // Add to pending operations
      const operationId = await offlineStorageService.addPendingOperation({
        type: 'CREATE_ITEM',
        data: itemData,
        maxRetries: 5,
      });
      
      // Save to local history for immediate display
      const tempItem = {
        ...itemData,
        _id: `temp_${operationId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending' as const,
      };
      
      await offlineStorageService.saveItemHistory(tempItem);
      
      return {
        success: true,
        item: tempItem,
        fromCache: true,
        pendingSync: true,
      };
    }

    try {
      const response = await this.request<{ success: boolean; item: Item }>('/items', {
        method: 'POST',
        body: JSON.stringify(itemData),
      });

      // Save to local history
      if (response.success && response.item) {
        await offlineStorageService.saveItemHistory(response.item);
      }

      return response;
    } catch (error) {
      // If online request fails, queue for later
      console.log('🌐 Online request failed, queuing item creation');
      await offlineStorageService.addPendingOperation({
        type: 'CREATE_ITEM',
        data: itemData,
        maxRetries: 5,
      });
      
      throw new Error('Item creation failed. Will be retried when online.');
    }
  }

  async getItems(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await this.request<{
      success: boolean;
      items: Item[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);
  }

  async getItem(itemId: string) {
    return await this.request<{ success: boolean; item: Item }>(`/items/${itemId}`);
  }

  async updateItem(itemId: string, updates: Partial<Item>) {
    return await this.request<{ success: boolean; item: Item }>(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteItem(itemId: string) {
    return await this.request<{ success: boolean; message: string }>(`/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async acceptOffer(itemId: string) {
    return await this.request<{ success: boolean; item: Item }>(`/items/${itemId}/accept`, {
      method: 'POST',
    });
  }

  async rejectOffer(itemId: string) {
    return await this.request<{ success: boolean; item: Item }>(`/items/${itemId}/reject`, {
      method: 'POST',
    });
  }

  async getItemStats() {
    return await this.request<{
      success: boolean;
      stats: {
        totalItems: number;
        totalMarketValue: number;
        totalPawnValue: number;
        averagePawnPercentage: number;
        itemsByStatus: Record<string, number>;
        itemsByCategory: Record<string, number>;
      };
    }>('/items/stats');
  }

  // Market data endpoints
  async searchMarketData(query: string) {
    // Check if offline and try to get cached results
    if (!offlineStorageService.isCurrentlyOnline()) {
      console.log('📱 Offline mode: Checking cached search results');
      const cachedResults = await offlineStorageService.getCachedItem(`search_${query.toLowerCase()}`);
      if (cachedResults) {
        console.log('📱 Using cached search results');
        return {
          success: true,
          data: cachedResults,
          fromCache: true,
        };
      }
      
      // Add to pending operations for when online
      await offlineStorageService.addPendingOperation({
        type: 'SEARCH_ITEM',
        data: { query },
        maxRetries: 3,
      });
      
      throw new Error('No cached data available. Search will be performed when online.');
    }

    try {
      const response = await this.request<{
        success: boolean;
        data: MarketData;
      }>('/market/search', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });

      // Cache the results for offline use
      if (response.success && response.data) {
        await offlineStorageService.cacheItem(`search_${query.toLowerCase()}`, response.data, 30);
        await offlineStorageService.saveSearchHistory({ query, timestamp: Date.now() });
      }

      return response;
    } catch (error) {
      // If online request fails, try cached data as fallback
      console.log('🌐 Online request failed, trying cached data');
      const cachedResults = await offlineStorageService.getCachedItem(`search_${query.toLowerCase()}`);
      if (cachedResults) {
        console.log('📱 Using cached data as fallback');
        return {
          success: true,
          data: cachedResults,
          fromCache: true,
        };
      }
      throw error;
    }
  }

  async estimateMarketValue(itemDetails: {
    name: string;
    category: string;
    brand?: string;
    model?: string;
    condition: string;
  }) {
    const cacheKey = `estimate_${itemDetails.name}_${itemDetails.category}_${itemDetails.condition}`;
    
    // Check if offline and try to get cached results
    if (!offlineStorageService.isCurrentlyOnline()) {
      console.log('📱 Offline mode: Checking cached market estimate');
      const cachedResults = await offlineStorageService.getCachedItem(cacheKey);
      if (cachedResults) {
        console.log('📱 Using cached market estimate');
        return {
          success: true,
          data: cachedResults,
          fromCache: true,
        };
      }
      
      // Add to pending operations for when online
      await offlineStorageService.addPendingOperation({
        type: 'SEARCH_ITEM',
        data: { itemDetails },
        maxRetries: 3,
      });
      
      throw new Error('No cached data available. Estimate will be performed when online.');
    }

    try {
      const response = await this.request<{
        success: boolean;
        data: MarketData;
      }>('/market/estimate', {
        method: 'POST',
        body: JSON.stringify(itemDetails),
      });

      // Cache the results for offline use
      if (response.success && response.data) {
        await offlineStorageService.cacheItem(cacheKey, response.data, 120); // 2 hours TTL
      }

      return response;
    } catch (error) {
      // If online request fails, try cached data as fallback
      console.log('🌐 Online request failed, trying cached data');
      const cachedResults = await offlineStorageService.getCachedItem(cacheKey);
      if (cachedResults) {
        console.log('📱 Using cached data as fallback');
        return {
          success: true,
          data: cachedResults,
          fromCache: true,
        };
      }
      throw error;
    }
  }

  async getMarketTrends(category?: string) {
    const endpoint = category ? `/market/trends?category=${category}` : '/market/trends';
    return await this.request<{
      success: boolean;
      trends: Array<{
        category: string;
        trend: 'up' | 'down' | 'stable';
        percentageChange: number;
        confidence: number;
      }>;
    }>(endpoint);
  }

  // Image processing endpoints
  async recognizeImage(imageUri: string) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'item.jpg',
    } as any);

    return await this.request<{
      success: boolean;
      result: ImageRecognitionResult;
    }>('/images/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async uploadImage(imageUri: string) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'item.jpg',
    } as any);

    return await this.request<{
      success: boolean;
      imageUrl: string;
    }>('/images/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  // User management endpoints
  async updateProfile(updates: Partial<User>) {
    return await this.request<{ success: boolean; user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateSettings(settings: Partial<User['settings']>) {
    return await this.request<{ success: boolean; user: User }>('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async changePassword(passwords: { currentPassword: string; newPassword: string }) {
    return await this.request<{ success: boolean; message: string }>('/users/password', {
      method: 'PUT',
      body: JSON.stringify(passwords),
    });
  }

  async getUserStats() {
    return await this.request<{
      success: boolean;
      stats: {
        totalEstimates: number;
        totalValue: number;
        averageAccuracy: number;
        monthlyTrends: Array<{
          month: string;
          estimates: number;
          totalValue: number;
        }>;
      };
    }>('/users/stats');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
