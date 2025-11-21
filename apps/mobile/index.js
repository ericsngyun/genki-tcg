// Custom entry point for Expo Router
// Required for Metro web builds to resolve app directory context
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh won't update the context
export function App() {
  // Explicitly set context to './app' directory for Metro bundler
  const ctx = require.context('./app', true, /\.(js|jsx|ts|tsx)$/);
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
