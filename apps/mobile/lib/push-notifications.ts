import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';
import { secureStorage } from './secure-storage';
import { logger } from './logger';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class PushNotificationService {
  private static instance: PushNotificationService;
  private notificationListener: any;
  private responseListener: any;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Register for push notifications and send token to backend
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      logger.debug('Push notifications are only available on physical devices');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.debug('Push notification permissions not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      });
      const token = tokenData.data;

      // Determine platform
      const platform: 'IOS' | 'ANDROID' | 'WEB' =
        Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';

      // Register token with backend
      await api.registerPushToken(token, platform);

      // Store token locally for unregistration on logout
      await secureStorage.setItem('push_token', token);

      logger.debug('Push token registered:', token);
      return token;
    } catch (error) {
      logger.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Unregister push token from backend
   */
  async unregisterPushToken(): Promise<void> {
    try {
      const token = await secureStorage.getItem('push_token');
      if (token) {
        await api.unregisterPushToken(token);
        await secureStorage.removeItem('push_token');
        logger.debug('Push token unregistered');
      }
    } catch (error) {
      logger.error('Error unregistering push token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      logger.debug('Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // Listen for notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.debug('Notification tapped:', response);
      onNotificationTapped?.(response);
    });
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
