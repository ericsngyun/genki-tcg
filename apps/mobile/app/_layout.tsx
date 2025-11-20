import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { theme as customTheme } from '../lib/theme';

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
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pairings" options={{ title: 'Pairings' }} />
        <Stack.Screen name="standings" options={{ title: 'Standings' }} />
      </Stack>
    </PaperProvider>
  );
}
