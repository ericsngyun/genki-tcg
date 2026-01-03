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
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { theme } from '../lib/theme';
import { secureStorage } from '../lib/secure-storage';
import { logger } from '../lib/logger';

// Required for web browser auth session
WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Get the appropriate redirect URI based on platform
const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    // Web: Discord redirects directly back to our web app
    return `${window.location.origin}/discord/callback`;
  } else {
    // Native: Discord redirects to backend, which opens deep link
    return `${API_URL}/auth/discord/mobile-callback`;
  }
};

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'discord' | 'email'>('discord');
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  // Check if Apple Sign In is available (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }
  }, []);

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
      logger.debug('Deep link event received:', url);
      if (url.includes('auth/callback')) {
        // On Android, we need to manually dismiss the browser when deep link is received
        if (Platform.OS === 'android') {
          logger.debug('Dismissing browser on Android...');
          await WebBrowser.dismissBrowser();
        }
        await handleAuthCallback(url);
      }
    };

    logger.debug('Setting up deep link listener...');
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then(async (url) => {
      logger.debug('Initial URL:', url);
      if (url && url.includes('auth/callback')) {
        // Also dismiss browser if app was opened via initial URL on Android
        if (Platform.OS === 'android') {
          await WebBrowser.dismissBrowser();
        }
        handleAuthCallback(url);
      }
    });

    return () => {
      logger.debug('Removing deep link listener');
      subscription.remove();
    };
  }, []);

  // Handle postMessage for Discord callback (web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      logger.debug('Setting up postMessage listener for web...');

      const handleMessage = async (event: MessageEvent) => {
        logger.debug('=== postMessage Received ===');
        logger.debug('Origin:', event.origin);
        logger.debug('Data:', event.data);
        logger.debug('Data type:', event.data?.type);

        if (event.data.type === 'DISCORD_AUTH_CALLBACK') {
          logger.debug('Discord auth callback received!');
          logger.debug('Has accessToken:', !!event.data.accessToken);
          logger.debug('Has refreshToken:', !!event.data.refreshToken);
          logger.debug('Error:', event.data.error);

          if (event.data.error) {
            logger.error('OAuth error:', event.data.error);
            setError(event.data.error);
            setLoading(false);
            return;
          }

          if (event.data.accessToken && event.data.refreshToken) {
            try {
              logger.debug('Storing tokens securely...');
              // Store tokens securely
              await secureStorage.setItem('access_token', event.data.accessToken);
              await secureStorage.setItem('refresh_token', event.data.refreshToken);
              logger.debug('Tokens stored successfully');

              // Navigate to events screen
              logger.debug('Navigating to events screen...');
              router.replace('/(tabs)/events');
            } catch (err: any) {
              logger.error('Error storing tokens:', err);
              setError('Failed to store authentication tokens');
              setLoading(false);
            }
          } else {
            logger.error('Missing tokens in callback');
            setError('Authentication failed - missing tokens');
            setLoading(false);
          }
        } else {
          logger.debug('Message type not DISCORD_AUTH_CALLBACK, ignoring');
        }
      };

      logger.debug('Adding message event listener...');
      window.addEventListener('message', handleMessage);
      logger.debug('Message listener added successfully');

      return () => {
        logger.debug('Removing message event listener');
        window.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const handleAuthCallback = async (url: string) => {
    try {
      logger.debug('=== Deep Link Callback Received ===');
      logger.debug('URL:', url);

      setLoading(true);
      setError('');

      // Parse the deep link URL
      // Format: genki-tcg://auth/callback?accessToken=...&refreshToken=...&error=...
      const parsed = Linking.parse(url);
      logger.debug('Parsed URL:', {
        scheme: parsed.scheme,
        hostname: parsed.hostname,
        path: parsed.path,
        queryParams: parsed.queryParams,
      });

      const accessToken = parsed.queryParams?.accessToken as string;
      const refreshToken = parsed.queryParams?.refreshToken as string;
      const errorParam = parsed.queryParams?.error as string;

      if (errorParam) {
        logger.error('OAuth error in callback:', errorParam);
        throw new Error(errorParam);
      }

      if (!accessToken || !refreshToken) {
        logger.error('Missing tokens in callback:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });
        throw new Error('Invalid callback - missing tokens');
      }

      logger.debug('Tokens received, storing securely...');
      // Store tokens securely
      await secureStorage.setItem('access_token', accessToken);
      await secureStorage.setItem('refresh_token', refreshToken);
      logger.debug('Tokens stored successfully');

      // Navigate to events screen
      logger.debug('Navigating to events screen...');
      router.replace('/(tabs)/events');
    } catch (err: any) {
      logger.error('Auth callback error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const redirectUri = getRedirectUri();

      logger.debug('=== Starting Discord OAuth ===');
      logger.debug('Platform:', Platform.OS);
      logger.debug('Redirect URI:', redirectUri);

      // Get the Discord auth URL from backend
      const response = await api.getDiscordAuthUrl(redirectUri);
      const { url } = response;

      if (!url) {
        throw new Error('Discord OAuth not configured on server');
      }

      logger.debug('Discord OAuth URL:', url);

      if (Platform.OS === 'web') {
        // WEB: Open Discord auth in popup window
        logger.debug('Opening Discord auth popup (web)...');
        const width = 500;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          url,
          'Discord Login',
          `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        logger.debug('Popup opened, waiting for callback...');
        // Loading state will persist until postMessage is received
      } else {
        // NATIVE: Backend-mediated flow with deep links
        logger.debug('Opening Discord OAuth (native)...');
        const result = await WebBrowser.openAuthSessionAsync(url, 'genki-tcg://auth/callback');

        logger.debug('WebBrowser result:', result);

        if (result.type === 'cancel') {
          setError('Discord login cancelled');
          setLoading(false);
        } else if (result.type === 'dismiss') {
          // Browser closed - wait for deep link handler
          // Android may take longer to process the deep link redirect
          logger.debug('Waiting for deep link...');
          const timeoutMs = Platform.OS === 'android' ? 8000 : 2000;
          setTimeout(() => {
            // If still loading after timeout, something went wrong
            setLoading(false);
            setError('Authentication window closed. Please try again.');
          }, timeoutMs);
        } else if (result.type === 'success' && result.url) {
          // WebBrowser successfully captured the deep link callback
          logger.debug('Processing deep link callback from WebBrowser...');
          await handleAuthCallback(result.url);
        }
        // On success, the deep link handler will take over
      }
    } catch (err: any) {
      logger.error('Discord login error:', err);
      setError(err.response?.data?.message || err.message || 'Discord login failed');
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      setError('');

      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      logger.debug('=== Email Login ===');
      logger.debug('Email:', email);

      // Call the login API
      const response = await api.login(email, password);

      if (!response.accessToken || !response.refreshToken) {
        throw new Error('Invalid response from server');
      }

      logger.debug('Login successful, storing tokens...');
      // Store tokens securely
      await secureStorage.setItem('access_token', response.accessToken);
      await secureStorage.setItem('refresh_token', response.refreshToken);

      logger.debug('Navigating to events screen...');
      // Navigate to events screen
      router.replace('/(tabs)/events');
    } catch (err: any) {
      logger.error('Email login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      logger.debug('=== Apple Sign In ===');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      logger.debug('Apple credential received:', {
        user: credential.user,
        hasEmail: !!credential.email,
        hasFullName: !!credential.fullName,
        hasIdentityToken: !!credential.identityToken,
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Send the identity token to our backend
      const response = await api.appleLogin({
        identityToken: credential.identityToken,
        fullName: credential.fullName ? {
          givenName: credential.fullName.givenName,
          familyName: credential.fullName.familyName,
        } : undefined,
        email: credential.email || undefined,
        user: credential.user,
      });

      if (!response.accessToken || !response.refreshToken) {
        throw new Error('Invalid response from server');
      }

      logger.debug('Apple login successful, storing tokens...');
      await secureStorage.setItem('access_token', response.accessToken);
      await secureStorage.setItem('refresh_token', response.refreshToken);

      logger.debug('Navigating to events screen...');
      router.replace('/(tabs)/events');
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - don't show error
        logger.debug('Apple Sign In cancelled by user');
      } else {
        logger.error('Apple login error:', err);
        setError(err.response?.data?.message || err.message || 'Apple Sign In failed');
      }
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
                  {
                    rotate: blob1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-1.5deg', '1.5deg'],
                    })
                  },
                  {
                    scale: blob1Anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.02, 1],
                    })
                  },
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

          {/* Discord Login */}
          {loginMethod === 'discord' ? (
            <View>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleDiscordLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#5865F2', '#4752C4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.loginButtonContent}>
                      <Ionicons name="logo-discord" size={22} color="#FFFFFF" />
                      <Text style={styles.loginButtonText}>Continue with Discord</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Apple Sign In - iOS only */}
              {Platform.OS === 'ios' && isAppleAvailable && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={12}
                  style={styles.appleButton}
                  onPress={handleAppleLogin}
                />
              )}
            </View>
          ) : (
            /* Email/Password Login */
            <View style={styles.emailLoginContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleEmailLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#DC2626', '#B91C1C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View style={styles.loginButtonContent}>
                      <Ionicons name="mail" size={20} color="#FFFFFF" />
                      <Text style={styles.loginButtonText}>Login with Email</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Swap Login Method Button */}
          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => setLoginMethod(loginMethod === 'discord' ? 'email' : 'discord')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.swapButtonText}>
              {loginMethod === 'discord' ? 'Use email instead' : 'Use Discord instead'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerMeta}>
            <Text style={styles.versionText}>Version 0.1.0</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Alpha</Text>
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
  emailLoginContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  appleButton: {
    width: '100%',
    height: 56,
    marginTop: theme.spacing.md,
  },
  swapButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  swapButtonText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
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
