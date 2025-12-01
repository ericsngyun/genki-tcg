import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { pushNotificationService } from '../lib/push-notifications';
import { secureStorage } from '../lib/secure-storage';

export function usePushNotifications() {
  const router = useRouter();
  const hasRegistered = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const registerToken = async () => {
      // Only register once per app launch
      if (hasRegistered.current) return;

      try {
        // Check if user is logged in
        const accessToken = await secureStorage.getItem('access_token');
        if (!accessToken) {
          console.log('User not logged in, skipping push notification registration');
          return;
        }

        // Register for push notifications
        const token = await pushNotificationService.registerForPushNotifications();
        if (token && isMounted) {
          hasRegistered.current = true;
        }
      } catch (error) {
        console.error('Failed to register push notifications:', error);
      }
    };

    // Register token on mount (if logged in)
    registerToken();

    // Set up notification listeners
    pushNotificationService.setupNotificationListeners(
      // On notification received (app foregrounded)
      (notification) => {
        console.log('Notification received while app is open:', notification);
        // Update badge count or show in-app notification
      },
      // On notification tapped
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;

        // Navigate based on notification data
        if (data.eventId) {
          router.push(`/(tabs)/events`);
        } else if (data.matchId) {
          router.push(`/match-details?id=${data.matchId}`);
        }
      }
    );

    return () => {
      isMounted = false;
      pushNotificationService.removeNotificationListeners();
    };
  }, [router]);

  return {
    registerForPushNotifications: () => pushNotificationService.registerForPushNotifications(),
    unregisterPushToken: () => pushNotificationService.unregisterPushToken(),
    getBadgeCount: () => pushNotificationService.getBadgeCount(),
    setBadgeCount: (count: number) => pushNotificationService.setBadgeCount(count),
    clearAllNotifications: () => pushNotificationService.clearAllNotifications(),
  };
}
