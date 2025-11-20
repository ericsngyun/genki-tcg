import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import { Button, Card, Input } from '../components';
import { theme } from '../lib/theme';
import { FadeInView, SlideUpView, ScaleInView } from '../lib/animations';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
            <Input
              label="Email"
              placeholder="player1@test.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
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
              editable={!loading}
              error={error && password ? error : undefined}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password to sign in"
            />

            <Button
              onPress={handleLogin}
              loading={loading}
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
              disabled={loading}
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
