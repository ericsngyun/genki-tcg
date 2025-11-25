import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { theme } from '../lib/theme';

// Required for web browser auth session
WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const DISCORD_REDIRECT_URI = `${API_URL}/auth/discord/mobile-callback`;
const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animated values for background effects
  const blob1Anim = useRef(new Animated.Value(0)).current;
  const blob2Anim = useRef(new Animated.Value(0)).current;
  const blob3Anim = useRef(new Animated.Value(0)).current;

  // Animate background blobs
  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      createAnimation(blob1Anim, 12000, 0),
      createAnimation(blob2Anim, 15000, 3000),
      createAnimation(blob3Anim, 18000, 6000),
    ];

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, []);

  // Handle deep link for Discord callback (mobile)
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (url.includes('auth/callback')) {
        await handleAuthCallback(url);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url && url.includes('auth/callback')) {
        handleAuthCallback(url);
      }
    });

    return () => subscription.remove();
  }, []);

  // Handle postMessage for Discord callback (web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'DISCORD_AUTH_CALLBACK') {
          console.log('Received auth callback from popup:', event.data);

          if (event.data.error) {
            setError(event.data.error);
            setLoading(false);
            return;
          }

          if (event.data.accessToken && event.data.refreshToken) {
            try {
              // Store tokens
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.multiSet([
                ['access_token', event.data.accessToken],
                ['refresh_token', event.data.refreshToken],
              ]);

              // Navigate to events screen
              router.replace('/(tabs)/events');
            } catch (err: any) {
              console.error('Error storing tokens:', err);
              setError('Failed to store authentication tokens');
              setLoading(false);
            }
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const handleAuthCallback = async (url: string) => {
    try {
      setLoading(true);
      setError('');

      // Parse the deep link URL
      // Format: genki-tcg://auth/callback?accessToken=...&refreshToken=...&error=...
      const parsed = Linking.parse(url);
      const accessToken = parsed.queryParams?.accessToken as string;
      const refreshToken = parsed.queryParams?.refreshToken as string;
      const errorParam = parsed.queryParams?.error as string;

      if (errorParam) {
        throw new Error(errorParam);
      }

      if (!accessToken || !refreshToken) {
        throw new Error('Invalid callback - missing tokens');
      }

      // Store tokens
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiSet([
        ['access_token', accessToken],
        ['refresh_token', refreshToken],
      ]);

      // Navigate to events screen
      router.replace('/(tabs)/events');
    } catch (err: any) {
      console.error('Auth callback error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Log configuration for debugging
      console.log('Discord OAuth Config:', {
        apiUrl: API_URL,
        redirectUri: DISCORD_REDIRECT_URI,
      });

      // Get the Discord auth URL from backend
      const response = await api.getDiscordAuthUrl(DISCORD_REDIRECT_URI);

      // Backend returns { url, state }
      const { url } = response;
      if (!url) {
        throw new Error('Discord OAuth not configured on server');
      }

      // Open Discord login in browser
      // The backend will handle the callback and redirect to genki-tcg://auth/callback
      // which will be caught by the deep link listener above
      const result = await WebBrowser.openAuthSessionAsync(url, DISCORD_REDIRECT_URI);

      // The deep link handler will process the callback automatically
      // Just handle explicit cancellation here
      if (result.type === 'cancel') {
        setError('Discord login cancelled');
        setLoading(false);
      }
      // Note: We don't setLoading(false) on success because the deep link handler will do it
    } catch (err: any) {
      console.error('Discord login error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        redirectUri: DISCORD_REDIRECT_URI,
      });
      setError(err.response?.data?.message || err.message || 'Discord login failed');
      setLoading(false);
    }
  };

  // Interpolate blob positions
  const blob1TranslateX = blob1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });
  const blob1TranslateY = blob1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });
  const blob1Scale = blob1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const blob2TranslateX = blob2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });
  const blob2TranslateY = blob2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 35],
  });
  const blob2Scale = blob2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  const blob3TranslateX = blob3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });
  const blob3TranslateY = blob3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });
  const blob3Scale = blob3Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.background}
      />

      {/* Animated Gradient Blobs - Using Radial Gradients for Smoothness */}
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          {
            transform: [
              { translateX: blob1TranslateX },
              { translateY: blob1TranslateY },
              { scale: blob1Scale },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(220, 38, 38, 0.2)',
            'rgba(220, 38, 38, 0.12)',
            'rgba(220, 38, 38, 0.05)',
            'transparent',
          ]}
          locations={[0, 0.3, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          {
            transform: [
              { translateX: blob2TranslateX },
              { translateY: blob2TranslateY },
              { scale: blob2Scale },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(88, 101, 242, 0.18)',
            'rgba(88, 101, 242, 0.1)',
            'rgba(88, 101, 242, 0.04)',
            'transparent',
          ]}
          locations={[0, 0.25, 0.55, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.9, y: 0.9 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          styles.blob3,
          {
            transform: [
              { translateX: blob3TranslateX },
              { translateY: blob3TranslateY },
              { scale: blob3Scale },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(220, 38, 38, 0.15)',
            'rgba(220, 38, 38, 0.08)',
            'rgba(220, 38, 38, 0.03)',
            'transparent',
          ]}
          locations={[0, 0.35, 0.65, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.4, y: 0.4 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Additional subtle blob for depth */}
      <Animated.View
        style={[
          styles.blob,
          styles.blob4,
          {
            opacity: blob1Anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.4, 0.5, 0.4],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(139, 92, 246, 0.1)',
            'rgba(139, 92, 246, 0.05)',
            'transparent',
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Radial gradient overlay for depth */}
      <View style={styles.radialOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Subtle light ray from top - smoother gradient */}
      <View style={styles.lightRay}>
        <LinearGradient
          colors={[
            'rgba(220, 38, 38, 0.1)',
            'rgba(220, 38, 38, 0.05)',
            'rgba(220, 38, 38, 0.02)',
            'transparent',
          ]}
          locations={[0, 0.2, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
        />
      </View>

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          {/* Logo Image with Refined Street Flair */}
          <Animated.View
            style={[
              styles.logoImageContainer,
              {
                transform: [
                  { rotate: blob1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-1.5deg', '1.5deg'],
                  }) },
                  { scale: blob1Anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.02, 1],
                  }) },
                ],
              },
            ]}
          >
            {/* Subtle glow effect */}
            <View style={styles.logoGlow} />
            <View style={styles.imageWrapper}>
              <Image
                source={require('../assets/images/genki-head.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Text Logo - Clean and Refined */}
          <View style={styles.textLogoContainer}>
            <Text style={styles.titleMain}>GENKI</Text>
            <Text style={styles.subtext}>Tournament Management</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={theme.colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.discordButton}
            onPress={handleDiscordLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#5865F2', '#4752C4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.discordButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.discordButtonContent}>
                  <Ionicons name="logo-discord" size={22} color="#FFFFFF" />
                  <Text style={styles.discordButtonText}>Continue with Discord</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerMeta}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Early Access</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  blob1: {
    width: width * 1.4,
    height: width * 1.4,
    top: -width * 0.4,
    right: -width * 0.5,
  },
  blob2: {
    width: width * 1.6,
    height: width * 1.6,
    bottom: -width * 0.6,
    left: -width * 0.4,
  },
  blob3: {
    width: width * 1.1,
    height: width * 1.1,
    top: height * 0.25,
    left: -width * 0.25,
  },
  blob4: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.6,
    right: -width * 0.2,
  },
  radialOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  lightRay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.5,
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing['2xl'],
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing['4xl'],
  },
  logoImageContainer: {
    marginBottom: theme.spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  imageWrapper: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  logoImage: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
  },
  logoGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.primary.main,
    opacity: 0.12,
    zIndex: 1,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 35,
  },
  textLogoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  titleMain: {
    fontSize: theme.typography.fontSize['5xl'],
    fontWeight: theme.typography.fontWeight.black,
    color: theme.colors.text.primary,
    letterSpacing: -1.5,
    marginBottom: theme.spacing.sm,
    textShadowColor: 'rgba(220, 38, 38, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  subtext: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: theme.spacing.xs,
    opacity: 0.8,
  },
  footer: {
    width: '100%',
    gap: theme.spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  errorText: {
    color: theme.colors.error.main,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  discordButton: {
    width: '100%',
    height: 56,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  discordButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  discordButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  versionText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  badgeText: {
    color: theme.colors.primary.light,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
});
