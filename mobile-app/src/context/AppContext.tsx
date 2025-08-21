import React, { createContext, useContext, useReducer, ReactNode } from 'react';
// Temporarily disable ads for Expo Go compatibility
// import { rewardedAdService } from '../services/RewardedAdService';

// Types
export interface Item {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  imageUrl?: string;
  marketValue: number;
  pawnValue: number;
  confidence: number;
  searchResults: SearchResult[];
  createdAt: Date;
}

export interface SearchResult {
  id: string;
  title: string;
  price: number;
  condition: string;
  soldDate: Date;
  source: 'ebay' | 'other';
  url: string;
}

// App State Interface
interface AppState {
  isLoading: boolean;
  currentItem: any;
  searchHistory: any[];
  settings: {
    pawnPercentage: number;
    notifications: boolean;
    autoSave: boolean;
  };
  // Query limit tracking
  dailyQueries: number;
  lastQueryDate: string;
  maxDailyQueries: number;
}

// Action Types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_ITEM'; payload: any }
  | { type: 'ADD_TO_HISTORY'; payload: any }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'INCREMENT_QUERY_COUNT' }
  | { type: 'RESET_DAILY_QUERIES' }
  | { type: 'SET_QUERY_LIMIT'; payload: number }
  | { type: 'ADD_QUERIES'; payload: number };

// Initial State
const initialState: AppState = {
  isLoading: false,
  currentItem: null,
  searchHistory: [],
  settings: {
    pawnPercentage: 30,
    notifications: true,
    autoSave: true,
  },
  dailyQueries: 0,
  lastQueryDate: new Date().toDateString(),
  maxDailyQueries: 5,
};

// App Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_CURRENT_ITEM':
      return { ...state, currentItem: action.payload };
    
    case 'ADD_TO_HISTORY':
      return {
        ...state,
        searchHistory: [action.payload, ...state.searchHistory.slice(0, 49)], // Keep last 50
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    
    case 'INCREMENT_QUERY_COUNT':
      const today = new Date().toDateString();
      if (today !== state.lastQueryDate) {
        // New day, reset count
        return {
          ...state,
          dailyQueries: 1,
          lastQueryDate: today,
        };
      } else {
        // Same day, increment count
        return {
          ...state,
          dailyQueries: state.dailyQueries + 1,
        };
      }
    
    case 'RESET_DAILY_QUERIES':
      return {
        ...state,
        dailyQueries: 0,
        lastQueryDate: new Date().toDateString(),
      };
    
    case 'SET_QUERY_LIMIT':
      return {
        ...state,
        maxDailyQueries: action.payload,
      };
    
    case 'ADD_QUERIES':
      return {
        ...state,
        maxDailyQueries: state.maxDailyQueries + action.payload,
      };
    
    default:
      return state;
  }
};

// Context Interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  startLoading: () => void;
  stopLoading: () => void;
  setCurrentItem: (item: any) => void;
  addToHistory: (item: any) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  incrementQueryCount: () => void;
  resetDailyQueries: () => void;
  canMakeQuery: () => boolean;
  getRemainingQueries: () => number;
  showRewardedAd: () => Promise<boolean>;
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Helper functions
  const startLoading = () => dispatch({ type: 'SET_LOADING', payload: true });
  const stopLoading = () => dispatch({ type: 'SET_LOADING', payload: false });
  const setCurrentItem = (item: any) => dispatch({ type: 'SET_CURRENT_ITEM', payload: item });
  const addToHistory = (item: any) => dispatch({ type: 'ADD_TO_HISTORY', payload: item });
  const updateSettings = (settings: Partial<AppState['settings']>) => 
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  const incrementQueryCount = () => dispatch({ type: 'INCREMENT_QUERY_COUNT' });
  const resetDailyQueries = () => dispatch({ type: 'RESET_DAILY_QUERIES' });
  
  const canMakeQuery = (): boolean => {
    const today = new Date().toDateString();
    if (today !== state.lastQueryDate) {
      // New day, reset count
      dispatch({ type: 'RESET_DAILY_QUERIES' });
      return true;
    }
    return state.dailyQueries < state.maxDailyQueries;
  };
  
  const getRemainingQueries = (): number => {
    const today = new Date().toDateString();
    if (today !== state.lastQueryDate) {
      return state.maxDailyQueries;
    }
    return Math.max(0, state.maxDailyQueries - state.dailyQueries);
  };

  const showRewardedAd = async (): Promise<boolean> => {
    try {
      // Temporarily disabled for Expo Go compatibility
      // return await rewardedAdService.showRewardedAd(() => {
      //   // User watched the ad, give them 3 bonus queries
      //   dispatch({ type: 'SET_QUERY_LIMIT', payload: state.maxDailyQueries + 3 });
      // });
      
      // For now, just give the user more queries without showing an ad
      dispatch({ type: 'ADD_QUERIES', payload: 3 });
      return true;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      return false;
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    startLoading,
    stopLoading,
    setCurrentItem,
    addToHistory,
    updateSettings,
    incrementQueryCount,
    resetDailyQueries,
    canMakeQuery,
    getRemainingQueries,
    showRewardedAd,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
