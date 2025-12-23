import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored authentication on app startup
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token')
      ]);

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
        
        // Navigate to appropriate screen based on user role
        if (userData.role === 'customer') {
          router.replace('/customer/(customer-tabs)/HomeScreen');
        } else if (userData.role === 'owner') {
          router.replace('/owner/(owner-tabs)/ResortScreen');
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      // Clear any corrupted data
      await AsyncStorage.multiRemove(['user', 'token']);
    } finally {
      setIsLoading(false);
      SplashScreen.hideAsync();
    }
  };

  const login = async (userData: User, authToken: string) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', authToken);
      
      setUser(userData);
      setToken(authToken);

      // Navigate to appropriate screen based on user role
      if (userData.role === 'customer') {
        router.replace('/customer/(customer-tabs)/HomeScreen');
      } else if (userData.role === 'owner') {
        router.replace('/owner/(owner-tabs)/ResortScreen');
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'token']);
      setUser(null);
      setToken(null);
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
