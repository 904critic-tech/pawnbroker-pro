import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Storage keys for offline functionality
const OFFLINE_STORAGE_KEYS = {
  CACHED_ITEMS: 'offline_cached_items',
  CACHED_SEARCH_RESULTS: 'offline_cached_search_results',
  CACHED_MARKET_DATA: 'offline_cached_market_data',
  PENDING_OPERATIONS: 'offline_pending_operations',
  LAST_SYNC: 'offline_last_sync',
  USER_SETTINGS: 'offline_user_settings',
  SEARCH_HISTORY: 'offline_search_history',
  ITEM_HISTORY: 'offline_item_history',
};

// Types for offline functionality
interface CachedItem {
  id: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface PendingOperation {
  id: string;
  type: 'CREATE_ITEM' | 'UPDATE_ITEM' | 'DELETE_ITEM' | 'SEARCH_ITEM' | 'UPLOAD_IMAGE';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface SyncStatus {
  lastSync: number;
  pendingOperations: number;
  cachedItems: number;
  isOnline: boolean;
}

class OfflineStorageService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    this.initializeNetworkListener();
  }

  // Initialize network status listener
  private async initializeNetworkListener() {
    // Get initial network state
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected ?? true;

    // Listen for network changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOnline !== this.isOnline) {
        console.log(`🌐 Network status changed: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        this.notifyListeners();
        
        if (this.isOnline && !this.syncInProgress) {
          this.syncPendingOperations();
        }
      }
    });
  }

  // Add network status listener
  addNetworkListener(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of network status change
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  // Check if currently online
  isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  // Cache item data with expiration
  async cacheItem(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    try {
      const cachedItem: CachedItem = {
        id: key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttlMinutes * 60 * 1000),
      };

      const existingCache = await this.getCachedItems();
      existingCache[key] = cachedItem;

      // Remove expired items
      const now = Date.now();
      Object.keys(existingCache).forEach(cacheKey => {
        if (existingCache[cacheKey].expiresAt < now) {
          delete existingCache[cacheKey];
        }
      });

      await AsyncStorage.setItem(
        OFFLINE_STORAGE_KEYS.CACHED_ITEMS,
        JSON.stringify(existingCache)
      );

      console.log(`💾 Cached item: ${key}`);
    } catch (error) {
      console.error('Failed to cache item:', error);
    }
  }

  // Get cached item
  async getCachedItem(key: string): Promise<any | null> {
    try {
      const cachedItems = await this.getCachedItems();
      const cachedItem = cachedItems[key];

      if (!cachedItem) {
        return null;
      }

      // Check if expired
      if (Date.now() > cachedItem.expiresAt) {
        delete cachedItems[key];
        await AsyncStorage.setItem(
          OFFLINE_STORAGE_KEYS.CACHED_ITEMS,
          JSON.stringify(cachedItems)
        );
        return null;
      }

      return cachedItem.data;
    } catch (error) {
      console.error('Failed to get cached item:', error);
      return null;
    }
  }

  // Get all cached items
  private async getCachedItems(): Promise<Record<string, CachedItem>> {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.CACHED_ITEMS);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Failed to get cached items:', error);
      return {};
    }
  }

  // Add operation to pending queue
  async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      const pendingOperations = await this.getPendingOperations();
      const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newOperation: PendingOperation = {
        ...operation,
        id: operationId,
        timestamp: Date.now(),
        retryCount: 0,
      };

      pendingOperations.push(newOperation);
      await AsyncStorage.setItem(
        OFFLINE_STORAGE_KEYS.PENDING_OPERATIONS,
        JSON.stringify(pendingOperations)
      );

      console.log(`📝 Added pending operation: ${operation.type}`);
      return operationId;
    } catch (error) {
      console.error('Failed to add pending operation:', error);
      throw error;
    }
  }

  // Get all pending operations
  private async getPendingOperations(): Promise<PendingOperation[]> {
    try {
      const pending = await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.PENDING_OPERATIONS);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Failed to get pending operations:', error);
      return [];
    }
  }

  // Remove pending operation
  async removePendingOperation(operationId: string): Promise<void> {
    try {
      const pendingOperations = await this.getPendingOperations();
      const filtered = pendingOperations.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(
        OFFLINE_STORAGE_KEYS.PENDING_OPERATIONS,
        JSON.stringify(filtered)
      );
      console.log(`✅ Removed pending operation: ${operationId}`);
    } catch (error) {
      console.error('Failed to remove pending operation:', error);
    }
  }

  // Update operation retry count
  async updateOperationRetry(operationId: string): Promise<void> {
    try {
      const pendingOperations = await this.getPendingOperations();
      const operation = pendingOperations.find(op => op.id === operationId);
      
      if (operation) {
        operation.retryCount++;
        await AsyncStorage.setItem(
          OFFLINE_STORAGE_KEYS.PENDING_OPERATIONS,
          JSON.stringify(pendingOperations)
        );
      }
    } catch (error) {
      console.error('Failed to update operation retry count:', error);
    }
  }

  // Sync pending operations when online
  async syncPendingOperations(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting offline sync...');

    try {
      const pendingOperations = await this.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        console.log('✅ No pending operations to sync');
        return;
      }

      console.log(`📊 Syncing ${pendingOperations.length} pending operations`);

      for (const operation of pendingOperations) {
        try {
          if (operation.retryCount >= operation.maxRetries) {
            console.log(`❌ Operation ${operation.id} exceeded max retries, removing`);
            await this.removePendingOperation(operation.id);
            continue;
          }

          // Process operation based on type
          await this.processOperation(operation);
          await this.removePendingOperation(operation.id);
          
        } catch (error) {
          console.error(`❌ Failed to process operation ${operation.id}:`, error);
          await this.updateOperationRetry(operation.id);
        }
      }

      // Update last sync timestamp
      await AsyncStorage.setItem(
        OFFLINE_STORAGE_KEYS.LAST_SYNC,
        Date.now().toString()
      );

      console.log('✅ Offline sync completed');
    } catch (error) {
      console.error('❌ Offline sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual operation
  private async processOperation(operation: PendingOperation): Promise<void> {
    // This method will be implemented to handle different operation types
    // For now, we'll just log the operation
    console.log(`🔄 Processing operation: ${operation.type}`, operation.data);
    
    // TODO: Implement actual operation processing based on type
    // This would involve calling the appropriate API endpoints
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const [cachedItems, pendingOperations, lastSync] = await Promise.all([
        this.getCachedItems(),
        this.getPendingOperations(),
        AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.LAST_SYNC),
      ]);

      return {
        lastSync: lastSync ? parseInt(lastSync) : 0,
        pendingOperations: pendingOperations.length,
        cachedItems: Object.keys(cachedItems).length,
        isOnline: this.isOnline,
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        lastSync: 0,
        pendingOperations: 0,
        cachedItems: 0,
        isOnline: this.isOnline,
      };
    }
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(OFFLINE_STORAGE_KEYS.CACHED_ITEMS),
        AsyncStorage.removeItem(OFFLINE_STORAGE_KEYS.CACHED_SEARCH_RESULTS),
        AsyncStorage.removeItem(OFFLINE_STORAGE_KEYS.CACHED_MARKET_DATA),
        AsyncStorage.removeItem(OFFLINE_STORAGE_KEYS.PENDING_OPERATIONS),
        AsyncStorage.removeItem(OFFLINE_STORAGE_KEYS.LAST_SYNC),
      ]);
      console.log('🧹 Cleared all offline data');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  // Cache search results
  async cacheSearchResults(query: string, results: any[]): Promise<void> {
    await this.cacheItem(`search_${query.toLowerCase()}`, results, 30); // 30 minutes TTL
  }

  // Get cached search results
  async getCachedSearchResults(query: string): Promise<any[] | null> {
    return await this.getCachedItem(`search_${query.toLowerCase()}`);
  }

  // Cache market data
  async cacheMarketData(itemId: string, marketData: any): Promise<void> {
    await this.cacheItem(`market_${itemId}`, marketData, 120); // 2 hours TTL
  }

  // Get cached market data
  async getCachedMarketData(itemId: string): Promise<any | null> {
    return await this.getCachedItem(`market_${itemId}`);
  }

  // Save user settings offline
  async saveUserSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        OFFLINE_STORAGE_KEYS.USER_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  }

  // Get user settings
  async getUserSettings(): Promise<any | null> {
    try {
      const settings = await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.USER_SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return null;
    }
  }

  // Save search history
  async saveSearchHistory(search: any): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      history.unshift(search);
      
      // Keep only last 50 searches
      const limitedHistory = history.slice(0, 50);
      
      await AsyncStorage.setItem(
        OFFLINE_STORAGE_KEYS.SEARCH_HISTORY,
        JSON.stringify(limitedHistory)
      );
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  // Get search history
  async getSearchHistory(): Promise<any[]> {
    try {
      const history = await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.SEARCH_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  // Save item history
  async saveItemHistory(item: any): Promise<void> {
    try {
      const history = await this.getItemHistory();
      const existingIndex = history.findIndex(h => h._id === item._id);
      
      if (existingIndex >= 0) {
        history[existingIndex] = item;
      } else {
        history.unshift(item);
      }
      
      // Keep only last 100 items
      const limitedHistory = history.slice(0, 100);
      
      await AsyncStorage.setItem(
        OFFLINE_STORAGE_KEYS.ITEM_HISTORY,
        JSON.stringify(limitedHistory)
      );
    } catch (error) {
      console.error('Failed to save item history:', error);
    }
  }

  // Get item history
  async getItemHistory(): Promise<any[]> {
    try {
      const history = await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.ITEM_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get item history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();
export default offlineStorageService;
