# Mobile App Authentication Updates

## Summary

The mobile app has been updated to use the new authentication token format with automatic refresh capabilities.

## Changes Made

### 1. Updated API Client (`apps/mobile/lib/api.ts`)

#### Token Storage Changes
- **Old Format**: Single `auth_token` stored in AsyncStorage
- **New Format**: Separate `access_token` and `refresh_token` stored in AsyncStorage

#### Automatic Token Refresh
- Implements request queue to prevent duplicate refresh calls
- Automatically refreshes access token when it expires (401 error)
- Continues all queued API requests after successful refresh
- Clears tokens and requires re-login if refresh fails

#### Login/Signup Updates
- Now stores both `accessToken` and `refreshToken` from backend response
- Backward compatible with old token format (if backend still returns single `token`)
- Automatically migrates old `auth_token` to new `access_token` format

#### Logout Updates
- Calls backend `/auth/logout` endpoint to revoke refresh token on server
- Clears all tokens from AsyncStorage (access_token, refresh_token, auth_token)
- Continues local logout even if backend call fails

### 2. Updated Index Screen (`apps/mobile/app/index.tsx`)

#### Auth Check Migration
- Checks for both `access_token` (new) and `auth_token` (old)
- Automatically migrates old token to new format on app launch
- Removes old token after migration

## How It Works

### Token Refresh Flow
```
1. User makes API request
2. Backend returns 401 (token expired)
3. Mobile app intercepts 401 error
4. Checks if already refreshing:
   - Yes: Queue this request
   - No: Start refresh process
5. Call /auth/refresh with refresh_token
6. Receive new access_token
7. Update AsyncStorage with new token
8. Retry original request with new token
9. Process all queued requests with new token
```

### Backward Compatibility
```
- Old installs with auth_token:
  1. App launches
  2. Detects auth_token in AsyncStorage
  3. Migrates to access_token
  4. Removes auth_token
  5. User stays logged in

- New logins:
  1. Backend returns accessToken + refreshToken
  2. Both stored in AsyncStorage
  3. No migration needed
```

## Testing Instructions

### Test 1: Fresh Login
1. Clear app data or uninstall/reinstall app
2. Launch app (should show login screen)
3. Login with test credentials:
   - Email: `player1@test.com`
   - Password: `password123`
4. Check AsyncStorage (use React Native Debugger or Flipper):
   - Should have `access_token`
   - Should have `refresh_token`
   - Should NOT have `auth_token`

### Test 2: Token Migration (Existing Users)
1. Before updating app, note that AsyncStorage has `auth_token`
2. Update app with new code
3. Launch app
4. Should automatically log in (not redirect to login)
5. Check AsyncStorage:
   - `auth_token` should be removed
   - `access_token` should exist
   - User remains logged in

### Test 3: Automatic Token Refresh
1. Login to app
2. Navigate through different screens (Events, Wallet, etc.)
3. Wait for access token to expire OR manually delete `access_token` from AsyncStorage
4. Make an API request (navigate to another screen)
5. Should automatically refresh token in background
6. Screen should load successfully
7. Check AsyncStorage - new `access_token` should be present

### Test 4: Logout
1. Login to app
2. Note the `refresh_token` from AsyncStorage
3. Tap logout button
4. Check AsyncStorage - all tokens should be cleared
5. Try to use saved refresh token with curl:
   ```bash
   curl -X POST https://genki-tcg-production.up.railway.app/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"YOUR_SAVED_TOKEN"}'
   ```
6. Should return 401 error (token revoked on server)

### Test 5: Full User Journey
1. Fresh install
2. Login
3. Navigate to Events screen
4. Navigate to Wallet screen
5. Check event details
6. Logout
7. Login again
8. Everything should work smoothly

## Token Expiry Times (Based on Role)

From backend configuration:

- **PLAYER**: 7 days (168 hours)
- **STAFF**: 4 hours
- **OWNER**: 1 hour

Mobile app users are typically PLAYER role, so they get 7-day sessions for convenience.

## Security Features

1. **Automatic Refresh**: Users stay logged in seamlessly
2. **Server-Side Revocation**: Logout revokes refresh token on backend
3. **Device Tracking**: Backend tracks which device/app the refresh token belongs to
4. **Request Queue**: Prevents multiple simultaneous refresh calls
5. **Secure Storage**: AsyncStorage encrypts data on device
6. **90-Day Refresh Token**: Long-lived but revocable

## Debugging

### Common Issues

#### "401 Unauthorized" on every request
- **Cause**: Access token expired and refresh failed
- **Check**: Is `refresh_token` still valid in AsyncStorage?
- **Fix**: Re-login to get new tokens

#### "Token refresh failed"
- **Cause**: Refresh token is invalid or expired
- **Check**: Backend logs for refresh token validation
- **Fix**: Clear app data and re-login

#### Still seeing old `auth_token`
- **Cause**: Migration didn't run
- **Check**: Index screen checkAuth logic
- **Fix**: Restart app to trigger migration

## Next Steps

1. Test on both iOS and Android devices
2. Test with Expo Go app
3. Verify token migration for existing users
4. Monitor backend logs for refresh token usage
5. Consider adding biometric authentication for enhanced security

## Files Modified

- `apps/mobile/lib/api.ts` - Complete rewrite of interceptors and auth methods
- `apps/mobile/app/index.tsx` - Added token migration logic

## Backward Compatibility

✅ **Fully Backward Compatible**
- Old app versions continue to work (backend still accepts old format)
- New app versions migrate old tokens automatically
- No forced logout for existing users
- Gradual rollout safe
