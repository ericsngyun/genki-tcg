import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Genki TCG' }} />
        <Stack.Screen name="events" options={{ title: 'Events' }} />
        <Stack.Screen name="wallet" options={{ title: 'Credits' }} />
        <Stack.Screen name="pairings" options={{ title: 'Pairings' }} />
        <Stack.Screen name="standings" options={{ title: 'Standings' }} />
      </Stack>
    </>
  );
}
