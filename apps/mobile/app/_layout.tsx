import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { theme as customTheme } from '../lib/theme';
import { SocketProvider } from '../contexts/SocketContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { initSentry } from '../lib/sentry';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Initialize Sentry error tracking
initSentry();

// Integrate custom theme with React Native Paper's Material Design 3 Dark Theme
const paperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: customTheme.colors.primary.main,
    primaryContainer: customTheme.colors.primary.dark,
    onPrimary: customTheme.colors.primary.foreground,
    secondary: customTheme.colors.neutral[400],
    secondaryContainer: customTheme.colors.neutral[700],
    tertiary: customTheme.colors.info.main,
    error: customTheme.colors.error.main,
    errorContainer: customTheme.colors.error.dark,
    background: customTheme.colors.background.primary,
    surface: customTheme.colors.background.card,
    surfaceVariant: customTheme.colors.background.elevated,
    onBackground: customTheme.colors.text.primary,
    onSurface: customTheme.colors.text.primary,
    outline: customTheme.colors.border.main,
    outlineVariant: customTheme.colors.border.light,
  },
  roundness: customTheme.borderRadius.base / 4, // Paper uses 0-4 scale
};

export default function RootLayout() {
  // Initialize push notifications on app launch
  usePushNotifications();

  return (
    <ErrorBoundary>
      <SocketProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar style="light" />
          <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: customTheme.colors.background.primary },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="pairings" />
          <Stack.Screen name="standings" />
          <Stack.Screen name="match-details" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="notification-preferences" />
          <Stack.Screen name="leaderboard" />
          </Stack>
        </PaperProvider>
      </SocketProvider>
    </ErrorBoundary>
  );
}
