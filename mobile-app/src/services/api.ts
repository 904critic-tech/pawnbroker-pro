import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration - Dynamic URL based on environment
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Use only the Ethernet interface that your phone can reach
    return 'http://10.0.0.7:5001/api';
  }
  // For production, use the deployed backend URL
  return 'https://your-production-backend.com/api';
};

export const API_BASE_URL = getApiBaseUrl();
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
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

  // Generic API request method
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

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
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
    return await this.request<{ success: boolean; item: Item }>('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
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
    return await this.request<{
      success: boolean;
      data: MarketData;
    }>('/market/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async estimateMarketValue(itemDetails: {
    name: string;
    category: string;
    brand?: string;
    model?: string;
    condition: string;
  }) {
    return await this.request<{
      success: boolean;
      data: MarketData;
    }>('/market/estimate', {
      method: 'POST',
      body: JSON.stringify(itemDetails),
    });
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
