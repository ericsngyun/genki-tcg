/**
 * Discord OAuth Callback Handler
 *
 * This route handles the redirect from Discord OAuth.
 * expo-auth-session's useAuthRequest hook typically handles this
 * automatically, but this route provides a fallback and
 * ensures proper deep linking on all platforms.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../../lib/theme';
import { exchangeCodeForTokens, makeRedirectUri } from '../../../lib/discord-auth';

export default function DiscordCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();

  useEffect(() => {
    handleCallback();
  }, [params]);

  const handleCallback = async () => {
    // Handle error from Discord
    if (params.error) {
      console.error('Discord OAuth error:', params.error, params.error_description);
      router.replace({
        pathname: '/login',
        params: { error: params.error_description || 'Discord sign in was cancelled' },
      });
      return;
    }

    // Handle authorization code
    if (params.code) {
      try {
        const redirectUri = makeRedirectUri();
        await exchangeCodeForTokens(params.code, redirectUri);
        router.replace('/(tabs)/events');
      } catch (error: any) {
        console.error('Discord callback error:', error);
        router.replace({
          pathname: '/login',
          params: { error: error.message || 'Failed to complete Discord sign in' },
        });
      }
    } else {
      // No code or error - something went wrong
      router.replace({
        pathname: '/login',
        params: { error: 'No authorization code received' },
      });
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary.main} />
      <Text style={styles.text}>Completing Discord sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
  },
});
