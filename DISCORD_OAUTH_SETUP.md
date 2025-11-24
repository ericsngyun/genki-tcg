# Discord OAuth Setup Guide

## Problem
Getting 400 errors when trying to login with Discord from mobile app.

## Root Causes
1. **Redirect URI not registered** - Discord requires exact URI matches
2. **Production env vars not set** - Railway might not have Discord credentials
3. **CORS/Allowed redirects not configured** - Backend rejecting the redirect URI

## Solution Steps

### 1. Find Your Mobile App's Redirect URI

The mobile app generates a platform-specific redirect URI. To find it:

1. Open your mobile app in Expo
2. Open the login screen
3. Check the console/logs for: `Discord Redirect URI: <value>`

Common values:
- **Expo Dev (Web)**: `exp://localhost:8081/--/discord/callback`
- **Expo Dev (iOS)**: `exp://192.168.x.x:8081/--/discord/callback`
- **Production (Native)**: `genki-tcg://discord/callback`

### 2. Register Redirect URIs in Discord Developer Portal

Go to: https://discord.com/developers/applications/1441953820820373639/oauth2

Click "Add Redirect" and add ALL of these:

#### Development:
- `http://localhost:3001/auth/discord/callback` (backend dev)
- `http://localhost:3000/auth/discord/callback` (admin web dev)
- `http://localhost:8081` (Expo web)
- `exp://localhost:8081/--/discord/callback` (Expo dev)

#### Production:
- `genki-tcg://discord/callback` (mobile app deep link)
- `https://genki-tcg-production.up.railway.app/auth/discord/callback` (backend prod)
- `https://your-admin-domain.com/auth/discord/callback` (admin web prod)

**IMPORTANT**: URIs must match EXACTLY (case-sensitive, no trailing slash on callback URLs)

### 3. Configure Production Backend Environment Variables

In Railway dashboard (https://railway.app), add these environment variables:

```bash
DISCORD_CLIENT_ID=1441953820820373639
DISCORD_CLIENT_SECRET=lOhOX_bGSNGlzJxbLgFi3tBz2aqj-24D

# Comma-separated list of allowed redirect URIs
DISCORD_ALLOWED_REDIRECTS="http://localhost:3000,http://localhost:3001,http://localhost:8081,exp://localhost:8081/--/discord/callback,genki-tcg://discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/callback"
```

### 4. Verify Backend Configuration

SSH into Railway or check logs:

```bash
# The backend should log when it starts
# Check if Discord credentials are loaded

# Test the auth URL endpoint
curl "https://genki-tcg-production.up.railway.app/auth/discord/auth-url" \
  -H "Content-Type: application/json" \
  -d '{"redirectUri":"genki-tcg://discord/callback"}'
```

Should return:
```json
{
  "url": "https://discord.com/api/oauth2/authorize?...",
  "state": "random-hex-string"
}
```

### 5. Check Backend Error Logs

When you get a 400 error, the backend now logs detailed error info:

```
Discord token exchange failed: {
  status: 400,
  error: {
    error: "unauthorized_client",
    error_description: "Invalid redirect_uri in request."
  },
  redirectUri: "genki-tcg://discord/callback",
  clientId: "1441953820820373639"
}
```

Common errors:
- `unauthorized_client` → Redirect URI not registered in Discord portal
- `invalid_grant` → Code expired or already used (try again)
- `invalid_client` → Wrong client_id or client_secret

### 6. Mobile App Redirect URI Validation

The mobile app uses `expo-auth-session`'s `makeRedirectUri()` which generates:

- **Development (Web)**: `exp://localhost:8081/--/discord/callback`
- **Development (iOS Sim)**: `exp://127.0.0.1:8081/--/discord/callback`
- **Production Build**: `genki-tcg://discord/callback`

Make sure the **exact** URI being used is registered in Discord portal.

## Testing Checklist

- [ ] Discord Developer Portal has all redirect URIs registered
- [ ] Railway has DISCORD_CLIENT_ID environment variable
- [ ] Railway has DISCORD_CLIENT_SECRET environment variable
- [ ] Railway has DISCORD_ALLOWED_REDIRECTS environment variable
- [ ] Backend restarts after environment variable changes
- [ ] Mobile app console shows redirect URI being used
- [ ] Backend logs show detailed error if auth fails

## Quick Fix

**Most likely fix**: Add `genki-tcg://discord/callback` to Discord Developer Portal

1. Go to https://discord.com/developers/applications/1441953820820373639/oauth2
2. Click "Add Redirect"
3. Enter: `genki-tcg://discord/callback`
4. Click "Save Changes"
5. Try logging in again

## Production Deployment Notes

When deploying to production:

1. **Update Discord redirect URIs** with production URLs
2. **Update Railway env vars** with production redirect list
3. **Restart Railway backend** after env var changes
4. **Test with production mobile build** (not Expo dev)

## Troubleshooting

### Error: "Invalid redirect URI"
→ URI not registered in Discord portal OR doesn't match exactly

### Error: "State parameter mismatch"
→ Backend and frontend are out of sync, clear app data and try again

### Error: "Code expired"
→ Authorization codes expire in 10 minutes, try login flow again

### Error: "Code already used"
→ Codes are single-use, start fresh login flow
