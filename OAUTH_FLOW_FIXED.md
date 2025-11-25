# Discord OAuth Flow - Fixed Implementation

## What Was Wrong

### Issue #1: Wrong Redirect URL in WebBrowser.openAuthSessionAsync()
**Problem:**
```javascript
// BEFORE (WRONG):
const result = await WebBrowser.openAuthSessionAsync(url, DISCORD_REDIRECT_URI);
// DISCORD_REDIRECT_URI = "http://localhost:3001/auth/discord/mobile-callback"
```

`openAuthSessionAsync` was waiting for a redirect to the backend URL, but the backend returns HTML that opens a deep link. The browser never navigated to the expected URL, so the OAuth session never completed.

**Fixed:**
```javascript
// AFTER (CORRECT):
const result = await WebBrowser.openAuthSessionAsync(url, DEEP_LINK_REDIRECT);
// DEEP_LINK_REDIRECT = "genki-tcg://auth/callback"
```

Now `openAuthSessionAsync` knows to complete when the deep link is opened.

### Issue #2: Deep Link Not Being Opened Correctly
**Problem:**
```javascript
// BEFORE (WRONG):
console.log('Opening deep link:', '${deepLink}');  // Literal string!
window.location.href = '${deepLink}';               // Literal string!
```

The template literals were inside single quotes, so they weren't interpolated. JavaScript was literally trying to open `'${deepLink}'` as a URL.

**Fixed:**
```javascript
// AFTER (CORRECT):
console.log('Opening deep link:', ${JSON.stringify(deepLink)});
window.location.href = ${JSON.stringify(deepLink)};
```

Now the actual deep link URL is used.

---

## Complete OAuth Flow

Here's how the fixed flow works:

```
┌─────────────────┐
│   Mobile App    │
│  (Login Screen) │
└────────┬────────┘
         │ 1. User taps "Continue with Discord"
         │
         ▼
┌─────────────────┐
│  handleDiscord  │ 2. Get Discord auth URL from backend
│     Login()     │    POST /auth/discord/url
└────────┬────────┘    { redirectUri: "http://localhost:3001/auth/discord/mobile-callback" }
         │
         │ 3. Backend generates state token & returns Discord URL
         │
         ▼
┌─────────────────────────────────────────┐
│  WebBrowser.openAuthSessionAsync()      │
│  - Opens: Discord OAuth page            │ 4. User logs in with Discord
│  - Listens for: "genki-tcg://auth/..."  │
└────────┬────────────────────────────────┘
         │
         │ 5. Discord redirects to backend
         ▼
┌─────────────────────────────────────────────────────┐
│  Backend: GET /auth/discord/mobile-callback         │
│  - Receives: code, state                            │ 6. Backend exchanges code
│  - Validates state (CSRF protection)                │    for Discord tokens
│  - Exchanges code for Discord tokens                │
│  - Gets user info from Discord                      │
│  - Finds or creates user in database                │
│  - Generates JWT access & refresh tokens            │
└────────┬────────────────────────────────────────────┘
         │
         │ 7. Returns HTML page
         ▼
┌─────────────────────────────────────────────────────┐
│  HTML Page (in browser)                             │
│  - Shows: "Login successful!"                       │ 8. JavaScript opens deep link
│  - JavaScript executes:                             │
│    window.location.href = "genki-tcg://auth/callback│
│      ?accessToken=xxx&refreshToken=yyy"             │
└────────┬────────────────────────────────────────────┘
         │
         │ 9. Deep link triggers OS
         ▼
┌─────────────────────────────────────────────────────┐
│  WebBrowser.openAuthSessionAsync() completes        │
│  - Detects: "genki-tcg://auth/callback" was opened  │ 10. Returns result
│  - Returns: { type: 'success' }                     │
│  - Browser window closes                            │
└────────┬────────────────────────────────────────────┘
         │
         │ 11. Deep link caught by Linking listener
         ▼
┌─────────────────────────────────────────────────────┐
│  handleAuthCallback()                               │
│  - Parses URL: genki-tcg://auth/callback?...        │ 12. Store tokens
│  - Extracts: accessToken & refreshToken             │     & navigate
│  - Stores tokens in secure storage                  │
│  - Navigates to: /(tabs)/events                     │
└─────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Mobile App (login.tsx)

**Constants:**
```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const BACKEND_CALLBACK_URI = `${API_URL}/auth/discord/mobile-callback`;  // Backend URL
const DEEP_LINK_REDIRECT = 'genki-tcg://auth/callback';                  // Deep link
```

**Login Handler:**
```javascript
const handleDiscordLogin = async () => {
  // 1. Get Discord auth URL from backend
  const response = await api.getDiscordAuthUrl(BACKEND_CALLBACK_URI);

  // 2. Open OAuth in browser, listen for deep link
  const result = await WebBrowser.openAuthSessionAsync(url, DEEP_LINK_REDIRECT);

  // 3. Handle result
  if (result.type === 'success') {
    // Deep link handler will process tokens
  }
};
```

**Deep Link Listener:**
```javascript
useEffect(() => {
  const handleDeepLink = async (event: { url: string }) => {
    if (event.url.includes('auth/callback')) {
      await handleAuthCallback(event.url);
    }
  };

  const subscription = Linking.addEventListener('url', handleDeepLink);
  return () => subscription.remove();
}, []);
```

**Callback Handler:**
```javascript
const handleAuthCallback = async (url: string) => {
  // Parse: genki-tcg://auth/callback?accessToken=xxx&refreshToken=yyy
  const parsed = Linking.parse(url);
  const accessToken = parsed.queryParams?.accessToken;
  const refreshToken = parsed.queryParams?.refreshToken;

  // Store securely
  await secureStorage.setItem('access_token', accessToken);
  await secureStorage.setItem('refresh_token', refreshToken);

  // Navigate to main app
  router.replace('/(tabs)/events');
};
```

### 2. Backend (auth.controller.ts)

**Mobile Callback Endpoint:**
```typescript
@Get('discord/mobile-callback')
async discordMobileCallback(
  @Query('code') code: string,
  @Query('state') state: string,
) {
  // 1. Exchange code for tokens
  const result = await this.authService.handleDiscordCallback(code, state, redirectUri);

  // 2. Return HTML that opens deep link
  return this.generateDeepLinkRedirect({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}
```

**Deep Link HTML Generator:**
```typescript
private generateDeepLinkRedirect(params: {
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}) {
  const deepLink = `genki-tcg://auth/callback?${params}`;

  return `
    <!DOCTYPE html>
    <html>
      <body>
        <div>Login successful! Redirecting...</div>
        <script>
          // Open deep link
          window.location.href = "${deepLink}";

          // Try multiple methods
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = "${deepLink}";
            link.click();
          }, 200);

          // Close window
          setTimeout(() => window.close(), 1500);
        </script>
      </body>
    </html>
  `;
}
```

### 3. App Configuration (app.json)

```json
{
  "expo": {
    "scheme": "genki-tcg",
    "plugins": ["expo-web-browser"]
  }
}
```

The `scheme` tells iOS/Android to open the app when a `genki-tcg://` URL is accessed.

---

## Testing the Flow

### 1. Start Backend
```bash
cd apps/backend
npm run dev

# Should see:
# Server listening on port 3001
# Discord Client ID: 1441953820820373639
```

### 2. Start Mobile App
```bash
cd apps/mobile
npm start

# Press 'i' for iOS or 'a' for Android
```

### 3. Test Login Flow

1. **Tap "Continue with Discord"**
   - Console should show: `Discord OAuth Config: { ... }`

2. **Discord OAuth Page Opens**
   - Browser opens with Discord login
   - Log in with your Discord account

3. **Backend Processes Callback**
   - Backend console shows: `=== Discord Mobile Callback Received ===`
   - Then: `Token exchange successful, generating deep link redirect`

4. **HTML Page Appears**
   - Shows: "Login successful! Redirecting..."
   - Browser should try to open deep link

5. **Deep Link Caught**
   - Mobile console shows: `=== Deep Link Callback Received ===`
   - Then: `Tokens received, storing securely...`
   - Then: `Navigating to events screen...`

6. **Success!**
   - Browser closes
   - App navigates to events screen
   - Login button spinner stops

### Expected Console Output

**Mobile App:**
```
Discord OAuth Config: {
  apiUrl: "http://localhost:3001",
  backendCallbackUri: "http://localhost:3001/auth/discord/mobile-callback",
  deepLinkRedirect: "genki-tcg://auth/callback"
}
WebBrowser result: { type: "success" }
OAuth flow completed successfully, deep link should have been caught
=== Deep Link Callback Received ===
URL: genki-tcg://auth/callback?accessToken=...&refreshToken=...
Parsed URL: { scheme: "genki-tcg", path: "auth/callback", ... }
Tokens received, storing securely...
Tokens stored successfully
Navigating to events screen...
```

**Backend:**
```
=== Discord Mobile Callback Received ===
Has code: true
Has state: true
Error: undefined
Exchanging code with redirect URI: http://localhost:3001/auth/discord/mobile-callback
Token exchange successful, generating deep link redirect
User: your@email.com
```

---

## Troubleshooting

### Browser Stays Open, Spinner Keeps Spinning

**Symptoms:**
- "Login successful!" page appears
- Browser doesn't close
- Spinner on login button keeps spinning

**Causes:**
1. Deep link not being opened by browser
2. Deep link not being caught by app
3. `openAuthSessionAsync` not recognizing the deep link

**Debug:**
1. Check browser console (if accessible) for JavaScript errors
2. Check mobile app console for "=== Deep Link Callback Received ===" message
3. Try manually opening the deep link:
   ```bash
   # iOS Simulator
   xcrun simctl openurl booted "genki-tcg://auth/callback?accessToken=test&refreshToken=test"

   # Android Emulator
   adb shell am start -W -a android.intent.action.VIEW -d "genki-tcg://auth/callback?accessToken=test&refreshToken=test"
   ```

### Deep Link Opens But Tokens Not Stored

**Symptoms:**
- Browser closes
- App doesn't navigate
- Still on login screen

**Causes:**
1. Tokens missing from deep link
2. Secure storage error
3. Navigation error

**Debug:**
1. Check mobile console for parsed URL and token presence
2. Check for secure storage errors
3. Verify router is working

### Backend Returns Error

**Symptoms:**
- Backend logs show "Mobile Discord callback error"

**Causes:**
1. Invalid state token (expired or already used)
2. Discord API error
3. Database error

**Debug:**
1. Check backend error logs for specific error message
2. Verify Discord credentials are correct
3. Check database connection

---

## Files Modified

### Mobile App
- `apps/mobile/app/login.tsx` - Fixed WebBrowser redirect URL, added logging
- `apps/mobile/.env` - Changed to use localhost for development

### Backend
- `apps/backend/src/auth/auth.controller.ts` - Fixed deep link generation, added logging
- `apps/backend/.env` - Added Discord OAuth credentials

### Documentation
- `OAUTH_FLOW_FIXED.md` - This document
- `AUTHENTICATION_GUIDE.md` - Comprehensive authentication guide
- `AUTH_FIXES_SUMMARY.md` - Executive summary of fixes

---

## Security Notes

1. **State Token (CSRF Protection):**
   - Generated server-side with crypto-secure random
   - Stored in database with 5-minute expiration
   - Validated before token exchange
   - One-time use (deleted after validation)

2. **Redirect URI Validation:**
   - Whitelist-based validation
   - Exact match required
   - Prevents open redirect attacks

3. **Token Storage:**
   - Mobile (Native): Keychain/Keystore via expo-secure-store
   - Mobile (Web): AsyncStorage fallback
   - Tokens never exposed in URL except in deep link (which only the app can catch)

4. **Deep Link Security:**
   - Custom URL scheme (`genki-tcg://`) only accessible by your app
   - OS prevents other apps from intercepting
   - Tokens only visible to your app

---

## Production Deployment

For production, you'll need to:

1. **Register Production Redirect URIs in Discord:**
   ```
   https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback
   ```

2. **Set Railway Environment Variables:**
   ```bash
   DISCORD_CLIENT_ID=1441953820820373639
   DISCORD_CLIENT_SECRET=<production-secret>
   DISCORD_ALLOWED_REDIRECTS=https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://discord/callback,genki-tcg://auth/callback
   API_URL=https://genki-tcg-production.up.railway.app
   ```

3. **Update Mobile App:**
   ```bash
   # apps/mobile/.env
   EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
   ```

4. **Build Production App:**
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

See `RAILWAY_PRODUCTION_SETUP.md` for complete production deployment guide.
