# Genki TCG Mobile App - Complete Setup & Testing Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Starting the Mobile App](#starting-the-mobile-app)
4. [Testing Authentication](#testing-authentication)
5. [Development Workflow](#development-workflow)
6. [Troubleshooting](#troubleshooting)
7. [Mobile App Architecture](#mobile-app-architecture)

---

## Prerequisites

### Required Software
- **Node.js**: v18+ (`node --version`)
- **npm**: v9+ (`npm --version`)
- **Expo CLI**: Installed via npx (no global install needed)

### Backend Requirements
The mobile app requires the backend API to be running:
- Backend must be running on **port 3001** (default)
- Database must be seeded with test data
- See [QUICK_START.md](../../QUICK_START.md) for backend setup

---

## Environment Configuration

### Mobile App Environment Variables

Location: `apps/mobile/.env`

```env
# Backend API URL - Railway Production
EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app

# Application Configuration
EXPO_PUBLIC_APP_NAME="Genki TCG"
EXPO_PUBLIC_APP_VERSION="0.1.0"
```

### Environment Setup for Different Scenarios

#### 1. **Local Development** (Recommended for Testing)
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

#### 2. **Android Emulator**
```env
# Android emulator special localhost address
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

#### 3. **Physical Device on Same Network**
```env
# Replace with your computer's local IP
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
```

#### 4. **Production/Railway**
```env
EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
```

---

## Starting the Mobile App

### Step 1: Ensure Backend is Running

```bash
# Terminal 1 - Start Backend
cd apps/backend
npm run dev
```

Verify backend is healthy:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

### Step 2: Start Mobile Development Server

```bash
# Terminal 2 - Start Mobile App
cd apps/mobile
npx expo start
```

**What This Does:**
- Starts Metro bundler (JavaScript bundler)
- Provides QR code for physical devices
- Opens interactive terminal menu

### Step 3: Choose Your Testing Platform

After running `npx expo start`, you'll see options:

#### **Option A: Web Browser** (Fastest for Testing)
```
Press 'w' in the terminal
```
- Opens at: http://localhost:8081
- Best for rapid UI/UX testing
- Full debugging with Chrome DevTools (F12)
- Recommended for initial development

#### **Option B: iOS Simulator** (Mac Only)
```
Press 'i' in the terminal
```
- Requires Xcode and iOS Simulator
- Most accurate iOS representation

#### **Option C: Android Emulator**
```
Press 'a' in the terminal
```
- Requires Android Studio and AVD
- Most accurate Android representation

#### **Option D: Physical Device**
1. Install **Expo Go** app on your device:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Scan the QR code shown in terminal
3. Ensure device is on same network as your computer

---

## Testing Authentication

### Test Accounts

The seeded database includes:

**Player Accounts:**
- Email: `player1@test.com` / Password: `password123`
- Email: `player2@test.com` / Password: `password123`

**Admin Account:**
- Email: `admin@test.com` / Password: `admin123`

**Organization:**
- Invite Code: `GENKI`

### Login Flow Test

1. **Open the mobile app** (web browser or device)
2. **Login Screen** should appear automatically
3. **Enter credentials:**
   - Email: `player1@test.com`
   - Password: `password123`
4. **Click "Sign In"**
5. **Success:** Redirected to Events screen

### Signup Flow Test

1. From login screen, click **"Don't have an account? Sign Up"**
2. **Fill in the form:**
   - Name: Your Name
   - Email: test@example.com
   - Password: password123
   - Invite Code: GENKI
3. **Click "Create Account"**
4. **Success:** Account created and redirected to Events screen

### API Integration Test

You can manually test the backend connection:

```bash
# Test login endpoint
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"player1@test.com","password":"password123"}'

# Should return accessToken and refreshToken
```

---

## Development Workflow

### Optimal Development Setup

**3 Terminal Windows:**

```bash
# Terminal 1: Backend
cd apps/backend
npm run dev

# Terminal 2: Mobile
cd apps/mobile
npx expo start
# Press 'w' for web

# Terminal 3: Admin Web (Optional)
cd apps/admin-web
npm run dev
```

### Hot Reloading

The mobile app supports **Fast Refresh**:
- Save any file in `apps/mobile/`
- Changes appear instantly in the app
- No need to restart the server
- State is preserved during refresh

### Clearing Cache

If you encounter strange behavior:

```bash
cd apps/mobile
npx expo start --clear
```

This clears the Metro bundler cache and rebuilds from scratch.

---

## Troubleshooting

### Issue: "Cannot connect to server"

**Symptoms:**
- Login fails immediately
- Network request errors in console
- "ERR_CONNECTION_REFUSED"

**Solutions:**
1. **Verify backend is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check environment variable:**
   ```bash
   cat apps/mobile/.env
   # Ensure EXPO_PUBLIC_API_URL is correct
   ```

3. **For Android Emulator:**
   - Change API URL to `http://10.0.2.2:3001`
   - NOT `http://localhost:3001`

4. **For Physical Device:**
   - Use your computer's local IP
   - Ensure both devices are on same WiFi
   - Check firewall isn't blocking port 3001

### Issue: "Babel Plugin Deprecated"

**Error Message:**
```
expo-router/babel is deprecated in favor of babel-preset-expo in SDK 50
```

**Solution:**
This has been **FIXED** in `apps/mobile/babel.config.js`. The deprecated plugin has been removed.

**Old (Broken):**
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['expo-router/babel'], // ❌ Deprecated
  };
};
```

**New (Fixed):**
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // ✅ Includes expo-router automatically
  };
};
```

### Issue: "Port 8081 Already in Use"

**Solutions:**

**Option 1: Kill the process (Windows)**
```bash
netstat -ano | findstr :8081
# Note the PID number
taskkill /F /PID <PID_NUMBER>
```

**Option 2: Kill the process (Mac/Linux)**
```bash
lsof -ti:8081 | xargs kill -9
```

**Option 3: Use a different port**
```bash
npx expo start --port 8082
```

### Issue: "Module Resolution Errors"

**Symptoms:**
- "Unable to resolve module"
- "Cannot find package"
- Import errors

**Solutions:**
```bash
cd apps/mobile

# 1. Clear cache and reinstall
rm -rf node_modules
npm install

# 2. Clear Metro cache
npx expo start --clear

# 3. Clear watchman cache (Mac only)
watchman watch-del-all
```

### Issue: "White Screen / App Crashes"

**Solutions:**
1. **Check console for errors:**
   - Web: Press F12 → Console tab
   - Device: Shake device → View error overlay

2. **Restart with clean cache:**
   ```bash
   npx expo start --clear
   ```

3. **Verify environment variables are loaded:**
   - Look for `env: export EXPO_PUBLIC_API_URL` in terminal output

---

## Mobile App Architecture

### Technology Stack

- **Framework:** React Native with Expo SDK 50
- **Navigation:** Expo Router (file-based routing)
- **State Management:** React Hooks (useState, useEffect)
- **HTTP Client:** Axios with interceptors
- **Storage:** AsyncStorage for tokens
- **Styling:** StyleSheet (CSS-in-JS)
- **Theme:** Custom theme system (`lib/theme.ts`)
- **Animations:** Custom animation components

### Project Structure

```
apps/mobile/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── events.tsx           # Events list screen
│   │   ├── profile.tsx          # User profile screen
│   │   ├── wallet.tsx           # Credits/wallet screen
│   │   └── more.tsx             # More options screen
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Entry point (redirects to login)
│   ├── login.tsx                # Login screen
│   ├── signup.tsx               # Signup screen
│   ├── match-details.tsx        # Match details screen
│   ├── pairings.tsx             # Round pairings screen
│   └── standings.tsx            # Tournament standings screen
│
├── components/                   # Reusable UI components
│   ├── Button.tsx               # Primary button component
│   ├── Card.tsx                 # Card container
│   ├── Input.tsx                # Text input field
│   ├── Badge.tsx                # Status badge
│   ├── ActiveMatchCard.tsx      # Active match display
│   └── index.ts                 # Component exports
│
├── lib/                         # Utilities and configurations
│   ├── api.ts                   # API client with auth interceptors
│   ├── theme.ts                 # Design system (colors, spacing, etc.)
│   └── animations.tsx           # Animation components
│
├── assets/                      # Static assets
│   ├── images/                  # App images
│   ├── icon.png                 # App icon
│   ├── splash.png               # Splash screen
│   └── favicon.png              # Web favicon
│
├── .env                         # Environment variables
├── app.json                     # Expo configuration
├── babel.config.js              # Babel configuration
├── metro.config.js              # Metro bundler config
├── package.json                 # Dependencies
└── tsconfig.json                # TypeScript configuration
```

### Key Features

#### 1. **Authentication System**
- JWT-based authentication with refresh tokens
- Automatic token refresh on 401 errors
- Token storage in AsyncStorage
- Login/Signup flows

**Implementation:** `apps/mobile/lib/api.ts`

#### 2. **API Client**
- Axios instance with base URL configuration
- Request interceptor: Adds access token to headers
- Response interceptor: Handles 401 and refreshes token
- Queue system for concurrent requests during refresh

**Implementation:** `apps/mobile/lib/api.ts:11-92`

#### 3. **Navigation**
- File-based routing with Expo Router
- Tab navigation for main screens
- Stack navigation for details
- Deep linking support with `genki-tcg://` scheme

**Implementation:** `apps/mobile/app/` directory structure

#### 4. **Design System**
- Centralized theme with dark mode colors
- Consistent spacing scale (4px grid)
- Typography scale with font sizes
- Reusable shadow styles
- Status badge colors

**Implementation:** `apps/mobile/lib/theme.ts`

#### 5. **Animations**
- FadeInView: Opacity animation
- SlideUpView: Slide from bottom
- ScaleInView: Scale from 0
- Configurable duration and delay

**Implementation:** `apps/mobile/lib/animations.tsx`

### API Endpoints Used

The mobile app communicates with these backend endpoints:

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

#### Events
- `GET /events` - List tournaments
- `GET /events/:id` - Get tournament details
- `POST /events/:id/register` - Register for tournament
- `POST /events/:id/self-check-in` - Check in
- `POST /events/:id/drop` - Drop from tournament
- `GET /events/:id/my-active-match` - Get current match

#### Matches
- `POST /matches/:id/report-result` - Report match result
- `POST /matches/:id/confirm-result` - Confirm opponent's result

#### Standings
- `GET /standings/events/:eventId` - Get tournament standings

#### Credits
- `GET /credits/me` - Get user's credit balance

---

## Performance Optimization

### Best Practices

1. **Use Web for Development:**
   - Fastest hot reload
   - Best debugging experience
   - Use device only for final testing

2. **Clear Cache When Needed:**
   - After npm install
   - After changing babel/metro config
   - When seeing unexplained errors

3. **Monitor Bundle Size:**
   - Keep dependencies minimal
   - Use React.memo for expensive components
   - Lazy load heavy screens

4. **Optimize Images:**
   - Use appropriate sizes
   - Compress images
   - Consider WebP format for web

---

## Testing Checklist

Use this checklist to verify mobile app functionality:

### Basic Functionality
- [ ] App starts without errors
- [ ] Login screen appears
- [ ] Can login with test account
- [ ] Can signup with new account
- [ ] Logout functionality works
- [ ] Navigation between tabs works

### Authentication Flow
- [ ] Token is stored after login
- [ ] Token is used in API requests
- [ ] Automatic token refresh works
- [ ] Redirect to login after logout

### Events & Tournament
- [ ] Can view list of events
- [ ] Can view event details
- [ ] Can register for event
- [ ] Can check-in to event
- [ ] Can view active match
- [ ] Can report match result

### UI/UX
- [ ] All screens load properly
- [ ] Animations are smooth
- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Forms validate input
- [ ] Buttons show loading state

### Cross-Platform
- [ ] Works on web browser
- [ ] Works on iOS (if testing)
- [ ] Works on Android (if testing)
- [ ] Responsive on different screen sizes

---

## Next Steps

Now that your mobile app is set up:

1. **Test Tournament Flow:**
   - Register two players
   - Start tournament (via admin web)
   - Report match results
   - Confirm results
   - View standings

2. **Customize Branding:**
   - Update app icon: `apps/mobile/assets/icon.png`
   - Update splash screen: `apps/mobile/assets/splash.png`
   - Modify colors in: `apps/mobile/lib/theme.ts`

3. **Add Features:**
   - Push notifications
   - Real-time updates via WebSocket
   - Offline support
   - Match history
   - Player profiles

4. **Deploy to Stores:**
   - Build for iOS: `eas build --platform ios`
   - Build for Android: `eas build --platform android`
   - Submit to App Store / Play Store

---

## Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [Metro Bundler](https://facebook.github.io/metro/)

### Tools
- [Expo DevTools](https://docs.expo.dev/debugging/tools/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Flipper](https://fbflipper.com/) - Advanced debugging

### Community
- [Expo Forums](https://forums.expo.dev/)
- [React Native Community](https://reactnative.dev/community/overview)

---

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review backend logs in Terminal 1
3. Check mobile app console (F12 in web)
4. Verify environment variables are correct
5. Try clearing cache: `npx expo start --clear`

Happy building! 🚀
