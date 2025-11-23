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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { Button, Card, Input } from '../components';
import { theme } from '../lib/theme';
import { FadeInView, SlideUpView, ScaleInView } from '../lib/animations';

// Required for web browser auth session
WebBrowser.maybeCompleteAuthSession();

const DISCORD_REDIRECT_URI = Linking.createURL('discord/callback');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
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
      setDiscordLoading(true);
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
      setDiscordLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      setDiscordLoading(true);
      setError('');

      // Get the Discord auth URL from backend
      const { authUrl } = await api.getDiscordAuthUrl(DISCORD_REDIRECT_URI);

      // Open Discord login in browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, DISCORD_REDIRECT_URI);

      if (result.type === 'success' && result.url) {
        await handleDiscordCallback(result.url);
      } else if (result.type === 'cancel') {
        setError('Discord login cancelled');
      }
    } catch (err: any) {
      console.error('Discord login error:', err);
      setError(err.response?.data?.message || err.message || 'Discord login failed');
    } finally {
      setDiscordLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.login(email, password);
      router.replace('/(tabs)/events');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || discordLoading;

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
              accessibilityLabel="Welcome Back"
            >
              Welcome Back
            </Text>
            <Text
              style={styles.subtitle}
              accessibilityRole="text"
            >
              Sign in to continue your tournament journey
            </Text>
          </SlideUpView>
        </FadeInView>

        <SlideUpView delay={300}>
          <Card variant="elevated" padding="xl">
            {/* Discord OAuth Button */}
            <TouchableOpacity
              style={[styles.discordButton, isLoading && styles.discordButtonDisabled]}
              onPress={handleDiscordLogin}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Discord"
              accessibilityHint="Double tap to sign in using your Discord account"
            >
              <View style={styles.discordButtonContent}>
                <Ionicons name="logo-discord" size={24} color="#FFFFFF" style={styles.discordIcon} />
                <Text style={styles.discordButtonText}>
                  {discordLoading ? 'Connecting...' : 'Sign in with Discord'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Login */}
            <Input
              label="Email"
              placeholder="player1@test.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
              error={error && !password ? error : undefined}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address to sign in"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              error={error && password ? error : undefined}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password to sign in"
            />

            {error && !email && !password && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Button
              onPress={handleLogin}
              loading={loading}
              disabled={isLoading}
              fullWidth
              style={{ marginTop: theme.spacing.lg }}
              accessibilityLabel="Sign in"
              accessibilityHint="Double tap to sign in to your account"
            >
              Sign In
            </Button>

            <Button
              onPress={() => router.push('/signup')}
              variant="ghost"
              disabled={isLoading}
              fullWidth
              style={{ marginTop: theme.spacing.md }}
              accessibilityLabel="Sign up"
              accessibilityHint="Double tap to create a new account"
            >
              Don't have an account? Sign Up
            </Button>

            <View
              style={styles.testAccounts}
              accessibilityRole="summary"
              accessibilityLabel="Test account information"
            >
              <Text style={styles.testAccountsTitle}>Test Accounts:</Text>
              <Text style={styles.testAccountsText}>player1@test.com / password123</Text>
              <Text style={styles.testAccountsText}>player2@test.com / password123</Text>
              <Text style={styles.testAccountsInfo}>Use invite code: GENKI</Text>
            </View>
          </Card>
        </SlideUpView>
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
    marginBottom: theme.spacing['4xl'],
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 54,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
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
  },
  discordButton: {
    backgroundColor: '#5865F2',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  discordButtonDisabled: {
    opacity: 0.6,
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
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  dividerText: {
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.sm,
  },
  errorText: {
    color: theme.colors.error.main,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  testAccounts: {
    marginTop: theme.spacing['2xl'],
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  testAccountsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  testAccountsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  testAccountsInfo: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary.main,
    marginTop: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
