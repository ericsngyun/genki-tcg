# Railway Production Backend Setup

## Current Issue

Your production Railway backend is returning: `"Invalid redirect URI"`

This means the production environment variables for Discord OAuth are not configured.

---

## Required Environment Variables in Railway

Go to your Railway project dashboard and add these environment variables:

### 1. Discord OAuth Configuration

```bash
DISCORD_CLIENT_ID=1441953820820373639
DISCORD_CLIENT_SECRET=UX_vA8v_GIAmamX3S7WqbdRhaPJja3_P
DISCORD_ALLOWED_REDIRECTS=https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://discord/callback,genki-tcg://auth/callback
```

### 2. Application Configuration

```bash
API_URL=https://genki-tcg-production.up.railway.app
```

### 3. JWT Secrets (IMPORTANT: Generate new ones for production!)

⚠️ **DO NOT use your development secrets in production!**

Generate new secrets:
```bash
# On Mac/Linux
openssl rand -base64 64

# On Windows PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Then set in Railway:
```bash
JWT_SECRET=<your-newly-generated-64-char-string>
REFRESH_TOKEN_SECRET=<another-newly-generated-64-char-string>
```

### 4. CORS Configuration

```bash
CORS_ORIGINS=https://admin.yourdomain.com,https://*.vercel.app,genki-tcg://
```

(Adjust based on your actual frontend domains)

---

## Complete Railway Environment Variables

Here's the full list you should have in Railway:

```bash
# Database (should already be set by Railway)
DATABASE_URL=postgresql://...

# Application
NODE_ENV=production
API_PORT=3000
API_URL=https://genki-tcg-production.up.railway.app

# JWT Authentication (GENERATE NEW VALUES!)
JWT_SECRET=<generate-new-with-openssl-rand-base64-64>
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=<generate-new-with-openssl-rand-base64-64>
REFRESH_TOKEN_EXPIRES_IN=90d

# Discord OAuth
DISCORD_CLIENT_ID=1441953820820373639
DISCORD_CLIENT_SECRET=UX_vA8v_GIAmamX3S7WqbdRhaPJja3_P
DISCORD_ALLOWED_REDIRECTS=https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://discord/callback,genki-tcg://auth/callback

# CORS
CORS_ORIGINS=https://admin.yourdomain.com,https://*.vercel.app,genki-tcg://

# Rate Limiting (optional)
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## Discord Developer Portal Setup

You also need to register the production redirect URIs in Discord:

1. Go to: https://discord.com/developers/applications/1441953820820373639/oauth2
2. Click "Add Redirect" and add:
   - `https://genki-tcg-production.up.railway.app/auth/discord/callback`
   - `https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback`
3. Click "Save Changes"

---

## Deployment Steps

1. **Set all environment variables in Railway dashboard**
2. **Restart the Railway service** (Railway should auto-restart when you add variables)
3. **Register redirect URIs in Discord Developer Portal**
4. **Test the endpoint:**
   ```bash
   curl "https://genki-tcg-production.up.railway.app/auth/discord/url" \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"redirectUri":"https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback"}'
   ```

   Expected response:
   ```json
   {
     "url": "https://discord.com/api/oauth2/authorize?client_id=1441953820820373639...",
     "state": "64-character-hex-string"
   }
   ```

5. **Update mobile app to use production:**
   - Edit `apps/mobile/.env`
   - Change to: `EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app`
   - Restart Expo dev server

---

## Security Considerations

### 🔴 CRITICAL: Do not use development secrets in production!

Your development `.env` file contains:
```bash
JWT_SECRET="5139c22e8c8182ebd1f1dbe97fe8dc6b8f773c5c76ce32f5ba28c008096d38cb"
REFRESH_TOKEN_SECRET="HdiNkjhFeuM1BbhpRQZh1UdxRqd8TbgmHtKRI3BlunANtebXATZaUtm60KdZbglQ9auNRq0iLfutLrUkmMYhvQ=="
```

**These should NEVER be used in production!** Generate new, unique secrets for Railway.

### Why this matters:
- If dev secrets leak, your production users are compromised
- Separation of environments is a security best practice
- You can rotate production secrets without affecting development

---

## Verification

After setting up Railway, verify everything works:

1. **Test auth URL endpoint:**
   ```bash
   curl "https://genki-tcg-production.up.railway.app/auth/discord/url" \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"redirectUri":"https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback"}'
   ```

2. **Check Railway logs:**
   - Look for "Discord Client ID: 1441953820820373639" on startup
   - Should not see "Discord OAuth not configured" errors

3. **Test from mobile app:**
   - Update `apps/mobile/.env` to use production URL
   - Restart Expo dev server
   - Try Discord login
   - Check Railway logs for any errors

---

## Troubleshooting

### Error: "Discord OAuth not configured"
**Cause:** Environment variables not set in Railway
**Solution:**
1. Go to Railway dashboard
2. Add `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `DISCORD_ALLOWED_REDIRECTS`
3. Restart service

### Error: "Invalid redirect URI"
**Cause:** Redirect URI not in allowed list OR not registered in Discord portal
**Solution:**
1. Check `DISCORD_ALLOWED_REDIRECTS` includes the exact URI
2. Check Discord Developer Portal has the URI registered
3. URIs must match EXACTLY (case-sensitive, no trailing slashes)

### Error: "unauthorized_client" from Discord
**Cause:** Redirect URI registered in Discord portal doesn't match exactly
**Solution:**
1. Double-check the URI in Discord portal
2. Make sure there are no trailing slashes
3. Case-sensitive match required

### Service keeps restarting
**Cause:** Invalid environment variable format
**Solution:**
1. Check Railway logs for specific error
2. Make sure no quotes around values in Railway UI
3. For comma-separated lists, no spaces after commas

---

## Railway Dashboard Access

To access your Railway dashboard:
1. Go to: https://railway.app
2. Log in with your account
3. Select the "genki-tcg-backend" project (or similar name)
4. Click on the service
5. Go to "Variables" tab
6. Add/edit environment variables

---

## Next Steps After Production Setup

1. ✅ Configure Railway environment variables
2. ✅ Register Discord redirect URIs
3. ✅ Generate production JWT secrets
4. ✅ Test production endpoint
5. ⬜ Build production mobile app with EAS
6. ⬜ Deploy admin web to Vercel with production URL
7. ⬜ Test full OAuth flow on production

---

## For Development (Current Setup)

For now, you're set up for **local development**:
- Backend: `http://localhost:3001` (running locally with `npm run dev`)
- Mobile: Points to `http://localhost:3001`
- Discord OAuth: Configured in local `.env` file

This is the recommended setup for development.
