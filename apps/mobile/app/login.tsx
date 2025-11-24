import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { Card } from '../components';
import { theme } from '../lib/theme';
import { FadeInView, SlideUpView, ScaleInView } from '../lib/animations';

// Required for web browser auth session
WebBrowser.maybeCompleteAuthSession();

// Create redirect URI that works on all platforms (native and web)
const DISCORD_REDIRECT_URI = makeRedirectUri({
  scheme: 'genki-tcg',
  path: 'discord/callback',
});

// Debug: Log the redirect URI so we know what to register in Discord portal
console.log('Discord Redirect URI:', DISCORD_REDIRECT_URI);

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle deep link for Discord callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (url.includes('discord/callback')) {
        await handleDiscordCallback(url);
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('discord/callback')) {
        handleDiscordCallback(url);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleDiscordCallback = async (url: string) => {
    try {
      setLoading(true);
      setError('');

      // Parse the callback URL
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code as string;
      const state = parsed.queryParams?.state as string;
      const errorParam = parsed.queryParams?.error as string;

      if (errorParam) {
        throw new Error(errorParam === 'access_denied' ? 'Discord login cancelled' : errorParam);
      }

      if (!code || !state) {
        throw new Error('Invalid callback - missing code or state');
      }

      // Exchange code for tokens
      await api.handleDiscordCallback(code, state, DISCORD_REDIRECT_URI);
      router.replace('/(tabs)/events');
    } catch (err: any) {
      console.error('Discord callback error:', err);
      setError(err.response?.data?.message || err.message || 'Discord login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the Discord auth URL from backend
      const response = await api.getDiscordAuthUrl(DISCORD_REDIRECT_URI);

      // Backend returns { url, state }
      const { url } = response;
      if (!url) {
        throw new Error('Discord OAuth not configured on server');
      }

      // Open Discord login in browser
      const result = await WebBrowser.openAuthSessionAsync(url, DISCORD_REDIRECT_URI);

      if (result.type === 'success' && result.url) {
        await handleDiscordCallback(result.url);
      } else if (result.type === 'cancel') {
        setError('Discord login cancelled');
      }
    } catch (err: any) {
      console.error('Discord login error:', err);
      setError(err.response?.data?.message || err.message || 'Discord login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      accessibilityRole="none"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="none"
        showsVerticalScrollIndicator={false}
      >
        <FadeInView style={styles.header}>
          <ScaleInView delay={100}>
            <Image
              source={require('../assets/images/genki-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </ScaleInView>
          <SlideUpView delay={200}>
            <Text
              style={styles.title}
              accessibilityRole="header"
              accessibilityLabel="Welcome to Genki TCG"
            >
              Welcome to Genki TCG
            </Text>
            <Text
              style={styles.subtitle}
              accessibilityRole="text"
            >
              Sign in with Discord to join tournaments and track your progress
            </Text>
          </SlideUpView>
        </FadeInView>

        <SlideUpView delay={300}>
          <Card variant="elevated" padding="xl">
            {/* Discord OAuth Button */}
            <TouchableOpacity
              style={[styles.discordButton, loading && styles.discordButtonDisabled]}
              onPress={handleDiscordLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Discord"
              accessibilityHint="Double tap to sign in using your Discord account"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.discordButtonContent}>
                  <Ionicons name="logo-discord" size={24} color="#FFFFFF" style={styles.discordIcon} />
                  <Text style={styles.discordButtonText}>Sign in with Discord</Text>
                </View>
              )}
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error.main} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color={theme.colors.success.main} />
                <Text style={styles.infoText}>Secure authentication via Discord</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="people" size={20} color={theme.colors.info.light} />
                <Text style={styles.infoText}>Join your local tournament community</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="trophy" size={20} color={theme.colors.warning.main} />
                <Text style={styles.infoText}>Track matches, standings & prizes</Text>
              </View>
            </View>
          </Card>
        </SlideUpView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['5xl'],
  },
  header: {
    marginBottom: theme.spacing['3xl'],
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 60,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    paddingHorizontal: theme.spacing.md,
  },
  discordButton: {
    backgroundColor: '#5865F2',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discordButtonDisabled: {
    opacity: 0.7,
  },
  discordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discordIcon: {
    marginRight: theme.spacing.sm,
  },
  discordButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error.lightest,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error.dark,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  infoSection: {
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.xs,
  },
});
