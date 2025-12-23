import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { secureStorage } from '../lib/secure-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../lib/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation for the glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Spin animation for loading ring
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    // Check auth after a brief delay for smooth transition
    const timer = setTimeout(() => {
      checkAuth();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const checkAuth = async () => {
    try {
      // Use secureStorage (SecureStore on native, AsyncStorage on web) for token persistence
      const accessToken = await secureStorage.getItem('access_token');
      const oldToken = await secureStorage.getItem('auth_token');

      if (accessToken || oldToken) {
        // Migrate legacy auth_token to access_token if needed
        if (oldToken && !accessToken) {
          await secureStorage.setItem('access_token', oldToken);
          await secureStorage.removeItem('auth_token');
        }
        router.replace('/(tabs)/events');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.background.primary, '#0A0A0F', theme.colors.background.primary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Background Glow */}
      <View style={styles.glowContainer}>
        <Animated.View
          style={[
            styles.glow,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      </View>

      {/* Logo and Title */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Image */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/images/genki-head.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>GENKI</Text>
        <Text style={styles.subtitle}>Tournament Companion</Text>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loadingRing,
            {
              transform: [
                {
                  rotate: spinAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </Animated.View>

      {/* Version */}
      <Text style={styles.version}>v0.1.0 Alpha</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    top: '30%',
    alignItems: 'center',
  },
  glow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary.main,
    opacity: 0.15,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginTop: 4,
    letterSpacing: 1,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  loadingRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: theme.colors.primary.main,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: theme.colors.text.tertiary,
    opacity: 0.6,
  },
});
