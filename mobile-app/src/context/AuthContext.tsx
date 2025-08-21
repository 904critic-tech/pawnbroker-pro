import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiService, User } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth State Interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Auth Context Interface
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await apiService.initialize();
        
        if (apiService.isAuthenticated()) {
          const user = await apiService.getCurrentUser();
          if (user) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
          } else {
            dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
          }
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to initialize authentication' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Demo login bypass for testing
      if (email === 'demo@pawnbroker.com' && password === 'demo123456') {
        const demoUser = {
          _id: 'demo-user-id',
          email: 'demo@pawnbroker.com',
          firstName: 'Demo',
          lastName: 'User',
          businessName: 'Demo Pawn Shop',
          role: 'pawnbroker' as const,
          settings: {
            pawnPercentage: 30,
            notifications: true,
            autoSave: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Set demo token
        await apiService.setToken('demo-token-123');
        await AsyncStorage.setItem('user_data', JSON.stringify(demoUser));
        
        dispatch({ type: 'AUTH_SUCCESS', payload: demoUser });
        return;
      }
      
      const response = await apiService.login({ email, password });
      
      if (response.success && response.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Login failed' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    }
  };

  // Register function
  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  }) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await apiService.register(userData);
      
      if (response.success && response.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Registration failed' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Update user function
  const updateUser = async (updates: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(updates);
      
      if (response.success && response.user) {
        dispatch({ type: 'UPDATE_USER', payload: response.user });
      }
    } catch (error) {
      console.error('Update user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
