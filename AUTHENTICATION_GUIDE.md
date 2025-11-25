# Authentication System Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Security Features](#security-features)
3. [Development Setup](#development-setup)
4. [Production Deployment](#production-deployment)
5. [Testing the Authentication Flow](#testing-the-authentication-flow)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Authentication Methods

The Genki TCG platform supports multiple authentication methods:

1. **Discord OAuth** (Primary for mobile app)
   - Backend-mediated OAuth flow
   - Supports both mobile deep linking and web postMessage
   - Single redirect URI works across all platforms

2. **Email/Password** (Admin web)
   - Traditional email/password authentication
   - Password reset via email (requires email service integration)
   - Email verification support (ready but not active)

### Backend-Mediated Discord OAuth Flow

```
┌──────────────┐
│  Mobile App  │
└──────┬───────┘
       │ 1. Request auth URL
       ▼
┌──────────────────────────────────────────┐
│  Backend: POST /auth/discord/url         │
│  - Generates state token (CSRF)          │
│  - Stores state in DB                    │
│  - Returns Discord auth URL              │
└──────┬───────────────────────────────────┘
       │ 2. Returns Discord auth URL
       ▼
┌──────────────┐
│  Mobile App  │ 3. Opens Discord OAuth in browser
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Discord    │ 4. User logs in and authorizes
└──────┬───────┘
       │ 5. Redirects to backend with code
       ▼
┌──────────────────────────────────────────┐
│  Backend: GET /auth/discord/mobile-callback │
│  - Validates state (CSRF protection)     │
│  - Exchanges code for tokens via Discord │
│  - Finds or creates user                 │
│  - Generates JWT tokens                  │
│  - Returns HTML with deep link           │
└──────┬───────────────────────────────────┘
       │ 6. Opens deep link: genki-tcg://auth/callback?accessToken=...
       ▼
┌──────────────┐
│  Mobile App  │ 7. Catches deep link
│              │ 8. Stores tokens securely
│              │ 9. Navigates to main app
└──────────────┘
```

### Token Management

**Access Tokens:**
- Short-lived JWT tokens
- Lifetime varies by role:
  - OWNER: 1 hour
  - STAFF: 4 hours
  - PLAYER: 7 days
- Contains user ID, email, organization membership

**Refresh Tokens:**
- Long-lived (90 days)
- Stored in database with device information
- Automatically rotated on use
- Can be revoked individually or in bulk

**Token Storage:**
- **Mobile (Native)**: iOS Keychain / Android Keystore via `expo-secure-store`
- **Mobile (Web)**: AsyncStorage (fallback for Expo web)
- **Admin Web**: localStorage (consider httpOnly cookies for production)

---

## Security Features

### 1. CSRF Protection
- Server-side state token generation using crypto-secure random bytes
- State tokens stored in database with 5-minute expiration
- State validation before token exchange

### 2. Redirect URI Validation
- Whitelist-based redirect URI validation
- Configurable via `DISCORD_ALLOWED_REDIRECTS` environment variable
- Special handling for Expo development URLs (`exp://`)

### 3. Rate Limiting
All authentication endpoints are rate-limited:
- Login: 5 attempts per 15 minutes
- Signup: 3 attempts per hour
- Discord OAuth: 10 attempts per minute
- Password reset: 3 requests per hour

### 4. Password Security
- bcrypt hashing with 12 rounds (OWASP recommended)
- Minimum password requirements enforced
- Password reset tokens expire after 1 hour

### 5. Session Management
- Device tracking (name, type, IP, user agent)
- Individual session revocation
- Logout from all devices
- Automatic cleanup of expired tokens

---

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Discord Developer Application
- Expo CLI (for mobile development)

### 1. Backend Configuration

Create or update `apps/backend/.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/genki_tcg"

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_SECRET="your-64-character-random-string"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-64-character-random-string"
REFRESH_TOKEN_EXPIRES_IN="90d"

# Application
API_PORT=3001
API_URL="http://localhost:3001"
CORS_ORIGINS="http://localhost:3000,http://localhost:8081,genki-tcg://"
NODE_ENV="development"

# Discord OAuth
DISCORD_CLIENT_ID="1441953820820373639"
DISCORD_CLIENT_SECRET="your-secret-from-discord-portal"
DISCORD_ALLOWED_REDIRECTS="http://localhost:3000,http://localhost:3001,http://localhost:8081,http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,exp://localhost:8081/--/discord/callback,genki-tcg://discord/callback,genki-tcg://auth/callback"
```

### 2. Discord Developer Portal Setup

1. Go to https://discord.com/developers/applications/1441953820820373639
2. Navigate to **OAuth2** settings
3. Add the following redirect URIs:

**Development:**
- `http://localhost:3001/auth/discord/callback`
- `http://localhost:3001/auth/discord/mobile-callback`

**Production:**
- `https://your-api.railway.app/auth/discord/callback`
- `https://your-api.railway.app/auth/discord/mobile-callback`

4. Copy your **Client Secret** and add to `.env`

### 3. Mobile App Configuration

Create or update `apps/mobile/.env`:

```bash
# For local development
EXPO_PUBLIC_API_URL="http://localhost:3001"

# For testing with production backend
# EXPO_PUBLIC_API_URL="https://genki-tcg-production.up.railway.app"
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend
cd apps/backend
npm run dev

# Terminal 2: Start mobile app
cd apps/mobile
npm start

# Terminal 3: Start admin web (optional)
cd apps/admin-web
npm run dev
```

---

## Production Deployment

### 1. Railway Backend Deployment

Set the following environment variables in Railway dashboard:

```bash
# Database (provided by Railway)
DATABASE_URL="postgresql://..."

# JWT Secrets (generate new ones for production!)
JWT_SECRET="<run: openssl rand -base64 64>"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="<run: openssl rand -base64 64>"
REFRESH_TOKEN_EXPIRES_IN="90d"

# Application
NODE_ENV="production"
API_PORT="3000"
API_URL="https://genki-tcg-production.up.railway.app"

# CORS
CORS_ORIGINS="https://admin.yourdomain.com,https://*.vercel.app,genki-tcg://"

# Discord OAuth
DISCORD_CLIENT_ID="1441953820820373639"
DISCORD_CLIENT_SECRET="<your-production-secret>"
DISCORD_ALLOWED_REDIRECTS="https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://discord/callback,genki-tcg://auth/callback"

# Rate Limiting (optional)
THROTTLE_TTL="60"
THROTTLE_LIMIT="100"
```

### 2. Mobile App Production Build

Update `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL="https://genki-tcg-production.up.railway.app"
```

Build for production:

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### 3. Admin Web Deployment (Vercel)

Set environment variables in Vercel:

```bash
NEXT_PUBLIC_API_URL="https://genki-tcg-production.up.railway.app"
```

Deploy:

```bash
cd apps/admin-web
vercel --prod
```

### 4. Update Discord Redirect URIs

Go to Discord Developer Portal and ensure production redirect URIs are registered:
- `https://genki-tcg-production.up.railway.app/auth/discord/callback`
- `https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback`

---

## Testing the Authentication Flow

### Testing Discord OAuth on Mobile (Development)

1. **Start the backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start the mobile app:**
   ```bash
   cd apps/mobile
   npm start
   ```
   Press `i` for iOS simulator or `a` for Android emulator

3. **Test the flow:**
   - Tap "Continue with Discord" button
   - Browser should open with Discord OAuth page
   - Log in with your Discord account
   - Browser should automatically close
   - You should be redirected to the events screen
   - Check logs for any errors

4. **Verify token storage:**
   - On iOS: Tokens stored in Keychain
   - On Android: Tokens stored in Keystore
   - On Web: Tokens stored in AsyncStorage

### Testing Email/Password Authentication (Admin Web)

1. **Start admin web:**
   ```bash
   cd apps/admin-web
   npm run dev
   ```

2. **Navigate to:** http://localhost:3000/login

3. **Test login:**
   - Enter email and password
   - Click "Sign In"
   - Should redirect to dashboard

### Testing Token Refresh

The API client automatically refreshes tokens when they expire:

1. Wait for access token to expire (check JWT expiry)
2. Make any authenticated API request
3. Client should automatically:
   - Detect 401 error
   - Request new access token using refresh token
   - Retry original request
   - Continue normally

### Testing Logout

1. From mobile app: Tap profile → Logout
2. Tokens should be cleared from secure storage
3. User should be redirected to login screen

---

## Troubleshooting

### Issue: "Discord OAuth not configured"

**Cause:** Backend environment variables missing

**Solution:**
1. Check `apps/backend/.env` has all Discord variables
2. Restart backend server after adding variables
3. Verify variables with:
   ```bash
   cd apps/backend
   npm run dev
   # Look for "Discord Client ID: 1441953820820373639" in logs
   ```

### Issue: "Invalid redirect URI"

**Cause:** Redirect URI not registered in Discord portal OR not in allowed list

**Solution:**
1. Check Discord Developer Portal has the correct redirect URI
2. Check `DISCORD_ALLOWED_REDIRECTS` includes the redirect URI
3. URIs must match EXACTLY (case-sensitive, no trailing slash)
4. For mobile development, check logs for actual redirect URI being used

### Issue: "State parameter mismatch"

**Cause:** CSRF state token expired or invalid

**Solution:**
1. State tokens expire after 5 minutes
2. Start login flow again (don't reuse old URLs)
3. Check backend database connection (state stored in DB)
4. Clear app data and try again

### Issue: Tokens not persisting after app restart

**Cause:** Secure storage not working properly

**Solution:**
1. Check if `expo-secure-store` is installed: `npm list expo-secure-store`
2. On iOS simulator: Keychain may be cleared between builds
3. On Android: Check app has keystore permissions
4. Check logs for secure storage errors

### Issue: "Code expired" or "Code already used"

**Cause:** Discord authorization codes expire in 10 minutes and are single-use

**Solution:**
1. Don't reuse old authorization URLs
2. Start fresh login flow
3. Complete OAuth flow within 10 minutes

### Issue: Mobile deep link not opening app

**Cause:** URL scheme not registered or app not in foreground

**Solution:**
1. Check `app.json` has `"scheme": "genki-tcg"`
2. Rebuild app after changing app.json
3. Test deep link manually:
   ```bash
   # iOS
   xcrun simctl openurl booted "genki-tcg://auth/callback?accessToken=test"

   # Android
   adb shell am start -W -a android.intent.action.VIEW -d "genki-tcg://auth/callback?accessToken=test"
   ```

### Issue: CORS errors in development

**Cause:** Frontend origin not in CORS_ORIGINS

**Solution:**
1. Add frontend origin to backend `.env`:
   ```bash
   CORS_ORIGINS="http://localhost:3000,http://localhost:8081,genki-tcg://"
   ```
2. Restart backend server

---

## File Locations Reference

### Backend
- **Auth Service:** `apps/backend/src/auth/auth.service.ts`
- **Auth Controller:** `apps/backend/src/auth/auth.controller.ts`
- **Discord Strategy:** `apps/backend/src/auth/strategies/discord.strategy.ts`
- **JWT Guard:** `apps/backend/src/auth/guards/jwt-auth.guard.ts`
- **Prisma Schema:** `apps/backend/prisma/schema.prisma`

### Mobile
- **Login Screen:** `apps/mobile/app/login.tsx`
- **API Client:** `apps/mobile/lib/api.ts`
- **Secure Storage:** `apps/mobile/lib/secure-storage.ts`
- **App Config:** `apps/mobile/app.json`

### Admin Web
- **Login Page:** `apps/admin-web/src/app/login/page.tsx`
- **Auth Context:** `apps/admin-web/src/contexts/auth-context.tsx`
- **API Client:** `apps/admin-web/src/lib/api.ts`

---

## Next Steps & Improvements

### Short-term
- [ ] Integrate email service (Resend/SendGrid) for password reset
- [ ] Implement email verification flow
- [ ] Add comprehensive error logging (Sentry)

### Medium-term
- [ ] Add two-factor authentication (2FA)
- [ ] Implement refresh token rotation
- [ ] Add audit logging for authentication events
- [ ] Consider httpOnly cookies for web tokens

### Long-term
- [ ] Add OAuth support for other providers (Google, Apple)
- [ ] Implement API key authentication for bots
- [ ] Add session management dashboard
- [ ] Implement account linking (multiple OAuth providers)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs for detailed error messages
3. Check Discord Developer Portal for OAuth errors
4. Verify all environment variables are set correctly
