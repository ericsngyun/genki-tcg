import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import { Button, Card, Input } from '../components';
import { theme } from '../lib/theme';

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
      >
        <View
          style={styles.header}
          accessibilityRole="header"
        >
          <Text
            style={styles.title}
            accessibilityRole="header"
            accessibilityLabel="Genki TCG"
          >
            Genki TCG
          </Text>
          <Text
            style={styles.subtitle}
            accessibilityRole="text"
          >
            Sign in to your account
          </Text>
        </View>

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
            style={{ marginTop: theme.spacing.md }}
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
            style={{ marginTop: theme.spacing.sm }}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing['3xl'],
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  testAccounts: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
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
  },
  testAccountsInfo: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary.main,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
});
