import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="events" options={{ title: 'Events' }} />
        <Stack.Screen name="wallet" options={{ title: 'Credits' }} />
        <Stack.Screen name="pairings" options={{ title: 'Pairings' }} />
        <Stack.Screen name="standings" options={{ title: 'Standings' }} />
      </Stack>
    </>
  );
}
