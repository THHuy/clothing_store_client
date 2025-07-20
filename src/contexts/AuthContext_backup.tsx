import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';
import { authAPI } from '../services/api'    } else {
      console.log('📭 No auth data found in localStorage');
      // Không có auth data, đánh dấu đã hoàn thành init
      dispatch({ type: 'INIT_COMPLETE' });
    }import type { User, AuthState } from '../types';

interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  checkTokenValidity: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; user: User; tokenExpiration: number } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'TOKEN_EXPIRED' }
  | { type: 'INIT_COMPLETE' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        token: action.payload.token,
        user: action.payload.user,
        tokenExpiration: action.payload.tokenExpiration,
        isInitialized: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        token: null,
        user: null,
        tokenExpiration: null,
        isInitialized: true,
      };
    case 'LOGOUT':
    case 'TOKEN_EXPIRED':
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        tokenExpiration: null,
        isInitialized: true,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'INIT_COMPLETE':
      return {
        ...state,
        isInitialized: true,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  tokenExpiration: null,
  isInitialized: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Utility functions
  const isTokenValid = (tokenExpiration: number | null): boolean => {
    if (!tokenExpiration) return false;
    return Date.now() < tokenExpiration;
  };

  const checkTokenValidity = (): boolean => {
    const isValid = isTokenValid(state.tokenExpiration);
    console.log('🔍 checkTokenValidity called:', {
      hasExpiration: !!state.tokenExpiration,
      expirationDate: state.tokenExpiration ? new Date(state.tokenExpiration) : null,
      currentTime: new Date(),
      isValid,
      timeLeft: state.tokenExpiration ? state.tokenExpiration - Date.now() : null
    });
    return isValid;
  };

  const clearExpiredAuth = () => {
    localStorage.removeItem('auth');
    dispatch({ type: 'TOKEN_EXPIRED' });
  };

  useEffect(() => {
    console.log('🔄 AuthContext useEffect triggered - checking localStorage...');
    // Check for stored auth data on app start
    const authData = localStorage.getItem('auth');
    
    if (authData) {
      console.log('📦 Found auth data in localStorage');
      try {
        const parsedData = JSON.parse(authData);
        const { token, user } = parsedData;
        let { tokenExpiration } = parsedData;
        
        console.log('🔍 Checking stored auth data:', { 
          hasToken: !!token, 
          hasUser: !!user, 
          hasExpiration: !!tokenExpiration,
          tokenExpiration: tokenExpiration ? new Date(tokenExpiration) : null,
          currentTime: new Date(),
          rawData: parsedData
        });
        
        if (token && user) {
          // Nếu không có tokenExpiration (từ phiên cũ), tạo mới với 7 ngày
          if (!tokenExpiration) {
            tokenExpiration = Date.now() + (7 * 24 * 60 * 60 * 1000);
            console.log('🔐 No expiration found, setting 7 days from now:', new Date(tokenExpiration));
            
            // Cập nhật localStorage với tokenExpiration
            localStorage.setItem('auth', JSON.stringify({ token, user, tokenExpiration }));
          }
          
          // Kiểm tra token còn hiệu lực không
          if (isTokenValid(tokenExpiration)) {
            console.log('✅ Token is valid, restoring authentication state');
            dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user, tokenExpiration } });
            console.log('🔐 Token restored from localStorage, expires at:', new Date(tokenExpiration));
          } else {
            console.log('❌ Token expired, clearing auth data');
            clearExpiredAuth();
          }
        } else {
          console.log('❌ Invalid auth data structure (missing token or user), clearing');
          clearExpiredAuth();
        }
      } catch (error) {
        console.error('❌ Error parsing stored auth data:', error);
        clearExpiredAuth();
      }
    } else {
      console.log('� No auth data found in localStorage');
    }
    
    console.log('🏁 AuthContext initialization complete');
  }, []);

  // Auto-check token validity every minute
  useEffect(() => {
    if (state.isAuthenticated && state.tokenExpiration) {
      const checkInterval = setInterval(() => {
        if (!isTokenValid(state.tokenExpiration)) {
          console.log('🔐 Token expired during session, logging out');
          clearExpiredAuth();
          message.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
      }, 60000); // Check every minute

      return () => clearInterval(checkInterval);
    }
  }, [state.isAuthenticated, state.tokenExpiration]);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authAPI.login({ username, password });
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Set token expiration to 7 days from now
        const tokenExpiration = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
        
        // Store auth data with expiration
        const authData = { token, user, tokenExpiration };
        localStorage.setItem('auth', JSON.stringify(authData));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user, tokenExpiration } });
        message.success('Đăng nhập thành công! Phiên làm việc sẽ kéo dài 7 ngày.');
        
        console.log('🔐 Login successful, token expires at:', new Date(tokenExpiration));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      message.error(error.message || 'Đăng nhập thất bại');
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout API
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      localStorage.removeItem('auth');
      dispatch({ type: 'LOGOUT' });
      message.success('Đã đăng xuất');
      console.log('🔐 User logged out');
    }
  };

  const updateUser = (user: User) => {
    // Update auth data in localStorage
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const auth = JSON.parse(authData);
        auth.user = user;
        localStorage.setItem('auth', JSON.stringify(auth));
      } catch (error) {
        console.error('Error updating user in localStorage:', error);
      }
    }
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, updateUser, checkTokenValidity }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
