import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { secureStorage } from '../../lib/secure-storage';

/**
 * Discord OAuth Callback Route (Web Only)
 *
 * Discord redirects here after user authorizes.
 * URL format: /discord/callback?code=xxx&state=yyy
 *
 * This route:
 * 1. Extracts code and state from URL
 * 2. Sends to backend to exchange for JWT tokens
 * 3. Stores tokens
 * 4. Redirects to main app
 */
export default function DiscordCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('=== Discord Web Callback ===');
      console.log('Code:', params.code);
      console.log('State:', params.state);
      console.log('Error:', params.error);

      // Handle OAuth errors
      if (params.error) {
        console.error('OAuth error:', params.error);
        router.replace('/login?error=' + encodeURIComponent(params.error as string));
        return;
      }

      // Validate required params
      if (!params.code || !params.state) {
        console.error('Missing code or state in callback');
        router.replace('/login?error=Invalid callback');
        return;
      }

      // Exchange code for tokens via backend
      console.log('Exchanging code for tokens...');
      const redirectUri = `${window.location.origin}/discord/callback`;
      console.log('Redirect URI:', redirectUri);

      const result = await api.handleDiscordCallback(
        params.code as string,
        params.state as string,
        redirectUri
      );

      console.log('Token exchange successful');
      console.log('User:', result.user.email);

      // Store tokens securely
      console.log('Storing tokens...');
      await secureStorage.setItem('access_token', result.accessToken);
      await secureStorage.setItem('refresh_token', result.refreshToken);
      console.log('Tokens stored successfully');

      // Navigate to main app
      console.log('Redirecting to events...');
      router.replace('/(tabs)/events');
    } catch (err: any) {
      console.error('Discord callback error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Authentication failed';
      router.replace('/login?error=' + encodeURIComponent(errorMessage));
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#667eea" />
      <Text style={styles.text}>Completing login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
});
