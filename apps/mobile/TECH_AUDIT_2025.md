# Mobile App Technology Audit - January 2025

**Audit Date:** January 2025
**Current SDK:** Expo SDK 50.0.21
**React Native:** 0.73.6
**Latest Stable SDK:** Expo SDK 54 (with React Native 0.81)

---

## Executive Summary

This audit reviews all technologies and libraries used in the Genki TCG mobile application to ensure they are properly configured according to 2025 best practices for Expo SDK 50.

### Current Status
✅ **Good:** Core dependencies properly installed
⚠️ **Needs Attention:** Missing React Native Paper provider setup
⚠️ **Needs Attention:** Babel configuration may have unnecessary plugin
📝 **Future:** Consider upgrading to SDK 54 for latest features

---

## 1. Package Dependencies Audit

### Core Dependencies ✅
| Package | Current Version | SDK 50 Compatible | Status |
|---------|----------------|-------------------|--------|
| expo | 50.0.21 | ✅ | Up to date for SDK 50 |
| expo-router | 3.4.10 | ✅ | Latest for SDK 50 |
| react | 18.2.0 | ✅ | Correct version |
| react-native | 0.73.6 | ✅ | Correct for SDK 50 |
| react-native-web | 0.19.13 | ✅ | Compatible |

### Expo Modules ✅
| Package | Version | Required By | Status |
|---------|---------|-------------|--------|
| expo-router | 3.4.10 | App navigation | ✅ Installed |
| expo-constants | 15.4.6 | expo-router | ✅ Installed (peer dep) |
| expo-font | 11.10.3 | @expo/vector-icons | ✅ Installed (peer dep) |
| expo-haptics | 12.8.1 | Button feedback | ✅ Installed |
| expo-linear-gradient | 12.7.2 | Card gradients | ✅ Installed |
| expo-linking | 6.2.2 | Deep linking | ✅ Installed |
| expo-notifications | 0.27.8 | Push notifications | ✅ Installed |
| expo-status-bar | 1.11.1 | Status bar | ✅ Installed |

### UI Library ⚠️
| Package | Version | Status | Issue |
|---------|---------|--------|-------|
| react-native-paper | 5.14.5 | ⚠️ | **Missing PaperProvider setup** |

### Backend Communication ⚠️
| Package | Version | Status | Issue |
|---------|---------|--------|-------|
| axios | 1.6.5 | ✅ | Properly configured with interceptors |
| socket.io-client | 4.6.1 | ⚠️ | **Not implemented yet** |
| @react-native-async-storage/async-storage | 1.21.0 | ✅ | Used for token storage |

---

## 2. Configuration Files Audit

### 2.1 babel.config.js ⚠️

**Current Configuration:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['expo-router/babel'],
  };
};
```

**Status:** ⚠️ **Needs Review**

**Issues:**
1. The `expo-router/babel` plugin may not be necessary for SDK 50 as it should be handled by `babel-preset-expo`
2. Missing React Native Paper babel plugin for production optimization

**2025 Best Practice Recommendation:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};
```

**Note:** The `expo-router/babel` plugin was added to fix EXPO_ROUTER_APP_ROOT Metro errors. Monitor if removing it causes issues. If errors return, it may still be needed for SDK 50.

### 2.2 metro.config.js ✅

**Current Configuration:**
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('css');
// Transformer config for require.context
```

**Status:** ✅ **Good**
- Uses `expo/metro-config` as recommended
- CSS support enabled for web
- Transformer properly configured

### 2.3 app.json ✅

**Current Configuration:**
- Main entry: `expo-router/entry` ✅
- Web bundler: `metro` ✅
- Scheme: `genki-tcg` ✅
- Dark mode UI ✅

**Issues:**
- ⚠️ Icon assets not square (480x80 instead of square dimensions)
  - `./assets/icon.png` should be square
  - `./assets/adaptive-icon.png` should be square

### 2.4 tsconfig.json ✅

**Status:** ✅ **Good**
- Extends `expo/tsconfig.base`
- Strict mode enabled
- Path mappings for monorepo

---

## 3. Library-Specific Configuration Audit

### 3.1 Expo Router v3 (2025 Best Practices) ✅

**Required Dependencies:** All installed ✅
- expo-router ✅
- react-native-safe-area-context ✅
- react-native-screens ✅
- expo-linking ✅
- expo-constants ✅
- expo-status-bar ✅

**Configuration:**
- ✅ Entry point: `expo-router/entry` in package.json
- ✅ Scheme defined in app.json
- ✅ Metro bundler for web
- ✅ Root layout exists at `app/_layout.tsx`

**Key Changes in v3 (Applied):**
- ✅ Using `router.navigate` (v3 changed navigation behavior)
- ✅ Metro bundler instead of deprecated webpack
- ⚠️ No API Routes used (still experimental)

### 3.2 React Native Paper ⚠️ NEEDS SETUP

**Current Status:** ⚠️ **Library installed but not configured**

**Missing:**
1. **PaperProvider** not wrapped around app root
2. **Theme configuration** not set up
3. **Babel plugin** for production not added

**2025 Best Practice Implementation Needed:**

```typescript
// app/_layout.tsx
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

// Custom theme extending MD3
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Custom colors from your theme.ts
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      {/* existing Stack */}
    </PaperProvider>
  );
}
```

**Benefits:**
- Material Design 3 (MD3) components
- Consistent theming across all Paper components
- Better bundle size with production babel plugin

### 3.3 Socket.io-client ⚠️ NOT IMPLEMENTED

**Current Status:** ⚠️ **Installed but not used**

**Package:** socket.io-client@4.6.1

**2025 Best Practice Implementation Needed:**

```typescript
// lib/socket.ts (to be created)
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export const createSocket = async (): Promise<Socket> => {
  const token = await AsyncStorage.getItem('access_token');

  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'], // REQUIRED for React Native
    reconnection: true,
    reconnectionDelay: 100,
    reconnectionAttempts: 100000,
  });
};
```

**Critical for React Native:**
- ✅ Must use `transports: ['websocket']`
- ✅ Use device network IP, not localhost
- ✅ Proper cleanup in useEffect
- ✅ Context-based socket management recommended

### 3.4 Axios API Client ✅

**Current Status:** ✅ **Properly configured**

**Implementation:** `lib/api.ts`

**Features:**
- ✅ Token refresh interceptor
- ✅ Request queue during refresh
- ✅ AsyncStorage for token persistence
- ✅ TypeScript types
- ✅ Error handling

**Best Practice:** Already following 2025 patterns

---

## 4. SDK Version Analysis

### Current: Expo SDK 50 (Released January 2024)
- React Native 0.73.6
- Expo Router v3
- Node 18 default

### Latest: Expo SDK 54 (Released September 2025)
- React Native 0.81
- Precompiled XCFrameworks (faster iOS builds)
- React 19.1 integration
- Last SDK supporting Legacy Architecture

**Recommendation:**
- ✅ Stay on SDK 50 for stability (tested, working)
- 📅 Plan SDK 54 upgrade for Q2 2025
- ⚠️ Note: SDK 54 is last to support Legacy Architecture

---

## 5. Priority Fixes & Recommendations

### 🔴 High Priority

1. **Add React Native Paper Provider**
   - File: `app/_layout.tsx`
   - Impact: Required for Paper components to work correctly
   - Effort: 15 minutes

2. **Add Production Babel Plugin for Paper**
   - File: `babel.config.js`
   - Impact: Reduces bundle size
   - Effort: 5 minutes

3. **Fix Asset Dimensions**
   - Files: `assets/icon.png`, `assets/adaptive-icon.png`
   - Impact: Expo Doctor warnings, potential store rejection
   - Effort: 30 minutes (design work)

### 🟡 Medium Priority

4. **Review expo-router/babel Plugin Necessity**
   - File: `babel.config.js`
   - Test if removing breaks Metro bundling
   - Keep if errors occur, remove if stable

5. **Implement Socket.io Client** (when needed)
   - Create `lib/socket.ts`
   - Create Socket Context
   - Use `transports: ['websocket']`

### 🟢 Low Priority

6. **Plan SDK 54 Upgrade**
   - Schedule for Q2 2025
   - Review changelog for breaking changes
   - Test New Architecture compatibility

---

## 6. Dependencies Version Matrix (2025)

### Expo SDK 50 Compatibility
| Package | Recommended | Current | Status |
|---------|------------|---------|--------|
| expo | ~50.0.0 | 50.0.21 | ✅ |
| expo-router | ~3.4.0 | 3.4.10 | ✅ |
| react-native | 0.73.6 | 0.73.6 | ✅ |
| react | 18.2.0 | 18.2.0 | ✅ |
| @expo/vector-icons | ^14.0.0 | 14.1.0 | ✅ |
| expo-font | ~11.10.0 | 11.10.3 | ✅ |
| expo-constants | ~15.4.0 | 15.4.6 | ✅ |

---

## 7. Expo Doctor Results

```
✖ Check Expo config (app.json/ app.config.js) schema
Error validating asset fields:
 - icon: image should be square, but has dimensions 480x80
 - Android.adaptiveIcon.foregroundImage: should be square, but has dimensions 480x80

✖ Check that required peer dependencies are installed
✅ RESOLVED: expo-font and expo-constants now installed
```

**Status:** 1 issue remaining (assets)

---

## 8. Configuration Files - Final Recommended State

### babel.config.js (Recommended)
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Keep expo-router/babel if removing causes Metro errors
    plugins: ['expo-router/babel'],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};
```

### app/_layout.tsx (Needs Update)
```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';

const theme = {
  ...MD3DarkTheme,
  // Merge with your custom theme from lib/theme.ts
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
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
```

---

## 9. Action Items

### Immediate (This Session)
- [ ] Update `babel.config.js` with production plugin for React Native Paper
- [ ] Add `PaperProvider` to `app/_layout.tsx`
- [ ] Integrate custom theme with Paper's MD3 theme

### Short Term (Next Sprint)
- [ ] Create square icon assets (1024x1024 recommended)
- [ ] Implement Socket.io client when backend endpoints are ready
- [ ] Add Socket Context for real-time features

### Long Term (Q2 2025)
- [ ] Plan Expo SDK 54 upgrade
- [ ] Review New Architecture migration path
- [ ] Consider API Routes when they exit experimental

---

## 10. Resources & Documentation

### Official Docs (2025)
- [Expo SDK 54](https://expo.dev/changelog)
- [Expo Router Installation](https://docs.expo.dev/router/installation/)
- [React Native Paper v5](https://callstack.github.io/react-native-paper/)
- [Socket.io React Native Guide](https://socket.io/docs/v4/)

### Version Compatibility
- [Expo SDK Changelog](https://expo.dev/changelog)
- [React Native Releases](https://reactnative.dev/blog)

---

**Report Generated:** January 2025
**Next Review:** After SDK 54 upgrade or Q2 2025
