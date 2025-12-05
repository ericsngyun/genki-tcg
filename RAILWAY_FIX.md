# Railway DISCORD_ALLOWED_REDIRECTS Fix

## The Problem
Railway backend is rejecting mobile callback URI with 400 error.

## Test Results (Just Now)
- ❌ Mobile: `https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback` → 400 Error
- ✅ Web: `https://genki-tcg-production.up.railway.app/auth/discord/callback` → Works!

This confirms the mobile callback URL is NOT in the allowed list.

## Fix Instructions

### Step 1: Go to Railway Dashboard
1. Open https://railway.app
2. Select your project: `genki-tcg-production`
3. Click on your **backend service**
4. Go to **Variables** tab

### Step 2: Update DISCORD_ALLOWED_REDIRECTS

**DELETE the current value** and paste this exact string (copy from below):

```
http://localhost:3000,http://localhost:3001,http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://discord/callback,genki-tcg://auth/callback
```

**IMPORTANT CHECKS:**
- [ ] No line breaks in the middle of URLs
- [ ] All commas are present (7 commas total, 8 URLs)
- [ ] No extra spaces
- [ ] Includes both `/callback` AND `/mobile-callback` for production

### Step 3: Save and Deploy
1. Click **Save** or **Update Variables**
2. Railway will automatically redeploy (watch the deployment logs)
3. Wait 1-2 minutes for deployment to complete

### Step 4: Verify It Worked

Run this command to test:

```bash
curl -X POST "https://genki-tcg-production.up.railway.app/auth/discord/url" \
  -H "Content-Type: application/json" \
  -d '{"redirectUri":"https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback"}'
```

**Expected Response (should get a URL, not an error):**
```json
{
  "url": "https://discord.com/api/oauth2/authorize?client_id=...",
  "state": "..."
}
```

**If you still get 400 error:**
- The variable wasn't saved correctly
- Railway didn't redeploy
- There's a typo in the URL

## Common Mistakes to Avoid

1. **Line breaks:** Railway's text area sometimes adds line breaks when pasting long values
2. **Extra spaces:** Spaces around commas or URLs will break it
3. **Missing URLs:** Must include BOTH `/callback` AND `/mobile-callback`
4. **Not waiting for deploy:** Railway needs 1-2 minutes to redeploy after changing variables

## Alternative: Use Railway CLI

If the web UI keeps adding line breaks, use the CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Set the variable (all on one line)
railway variables --set DISCORD_ALLOWED_REDIRECTS="http://localhost:3000,http://localhost:3001,http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://discord/callback,genki-tcg://auth/callback"
```

## Verification Checklist

After updating:
- [ ] Tested with curl command (got URL, not error)
- [ ] Mobile app Discord OAuth opens popup
- [ ] No more 400 errors in mobile logs
- [ ] Can successfully authenticate via Discord on iOS

## Need Help?

If still not working after following these steps:
1. Screenshot the Railway variable value (blur sensitive parts)
2. Copy the exact error message from mobile logs
3. Run the curl test and share the response
