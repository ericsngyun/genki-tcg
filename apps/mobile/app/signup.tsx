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

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('GENKI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password || !inviteCode) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.signup(email, password, name, inviteCode);
      router.replace('/(tabs)/events');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
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
              accessibilityLabel="Create Account"
            >
              Create Account
            </Text>
            <Text
              style={styles.subtitle}
              accessibilityRole="text"
            >
              Join the Genki TCG tournament community
            </Text>
          </SlideUpView>
        </FadeInView>

        <SlideUpView delay={300}>
          <Card variant="elevated" padding="xl">
            <Input
              label="Name"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
              error={error && !name ? 'Name is required' : undefined}
              accessibilityLabel="Full name"
              accessibilityHint="Enter your full name"
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              error={error && !email ? 'Email is required' : undefined}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address"
            />

            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              error={error && !password ? 'Password is required' : undefined}
              accessibilityLabel="Password"
              accessibilityHint="Create a password for your account"
            />

            <Input
              label="Invite Code"
              placeholder="Enter shop invite code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              editable={!loading}
              error={error && !inviteCode ? 'Invite code is required' : error ? error : undefined}
              accessibilityLabel="Invite code"
              accessibilityHint="Enter the shop's invite code"
            />

            <Button
              onPress={handleSignup}
              loading={loading}
              fullWidth
              style={{ marginTop: theme.spacing.lg }}
              accessibilityLabel="Create account"
              accessibilityHint="Double tap to create your account"
            >
              Create Account
            </Button>

            <Button
              onPress={() => router.back()}
              variant="ghost"
              disabled={loading}
              fullWidth
              style={{ marginTop: theme.spacing.md }}
              accessibilityLabel="Sign in"
              accessibilityHint="Double tap to return to sign in"
            >
              Already have an account? Sign In
            </Button>

            <View
              style={styles.infoBox}
              accessibilityRole="summary"
              accessibilityLabel="Invite code information"
            >
              <Text style={styles.infoText}>
                💡 Use invite code{' '}
                <Text style={styles.infoCodeText}>GENKI</Text>
                {' '}to join Genki TCG
              </Text>
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
  infoBox: {
    marginTop: theme.spacing['2xl'],
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  infoCodeText: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
