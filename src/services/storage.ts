// Secure storage service for authentication tokens and sensitive data
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';
const PUSH_TOKEN_KEY = 'push_token';

/**
 * Secure storage for sensitive data (tokens)
 */
export const secureStorage = {
  /**
   * Save authentication token
   */
  async setAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
      throw error;
    }
  },

  /**
   * Get authentication token
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  },

  /**
   * Remove authentication token
   */
  async removeAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  },

  /**
   * Save refresh token
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
      throw error;
    }
  },

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  },

  /**
   * Remove refresh token
   */
  async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove refresh token:', error);
    }
  },

  /**
   * Clear all secure storage (logout)
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  },
};

/**
 * Regular storage for non-sensitive data
 */
export const appStorage = {
  /**
   * Save user data
   */
  async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw error;
    }
  },

  /**
   * Get user data
   */
  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  },

  /**
   * Remove user data
   */
  async removeUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Failed to remove user data:', error);
    }
  },

  /**
   * Save push token
   */
  async setPushToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save push token:', error);
      throw error;
    }
  },

  /**
   * Get push token
   */
  async getPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  },

  /**
   * Clear all app storage (logout)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([USER_DATA_KEY, PUSH_TOKEN_KEY]);
    } catch (error) {
      console.error('Failed to clear app storage:', error);
    }
  },
};

/**
 * Clear all storage (secure + regular)
 */
export async function clearAllStorage(): Promise<void> {
  await Promise.all([
    secureStorage.clearAll(),
    appStorage.clearAll(),
  ]);
}

export default {
  secure: secureStorage,
  app: appStorage,
  clearAll: clearAllStorage,
};

