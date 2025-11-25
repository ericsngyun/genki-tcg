import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Secure storage abstraction that uses:
 * - iOS Keychain on iOS
 * - Android Keystore on Android
 * - AsyncStorage as fallback on Web
 *
 * This ensures tokens are stored securely on native platforms
 * while maintaining compatibility with web.
 */
class SecureStorageManager {
  private isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  async setItem(key: string, value: string): Promise<void> {
    if (this.isNative) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (this.isNative) {
      return await SecureStore.getItemAsync(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (this.isNative) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    if (this.isNative) {
      await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
    } else {
      await AsyncStorage.multiRemove(keys);
    }
  }
}

export const secureStorage = new SecureStorageManager();
