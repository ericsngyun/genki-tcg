# Railway Environment Variables - Update Guide

**Railway Dashboard**: https://railway.app/dashboard
**Project**: Genki TCG Production

---

## 🔴 CRITICAL - Update These Now

### 1. Discord Client Secret (Updated)
```
DISCORD_CLIENT_SECRET=mAMBirILc0xNtz3oqyNoYPEM6mTeOMdI
```
**Why**: You changed the Discord client secret, this needs to match.

---

### 2. JWT Secrets (Production - ROTATE FROM DEV)
```
JWT_SECRET=QmpccyoPsyd9ueDse2NKiYfYtUXUTCImfY86ZNEZaIWfYo9fqHrCU71ReUgnnQa/sdzdTXw18o5XfGiHJCx6PQ==
```

```
REFRESH_TOKEN_SECRET=hvDMVE0dBPxg+khZYHsRnArLdL3Ef/dIurBgCkWbUKbWAawCgTdo6pvsDLq7b2gxkT+SMnGVzqsKbWxWPT2aUw==
```
**Why**: Using development secrets in production is a security risk.

**⚠️ WARNING**: Updating these will log out all users. Do this during low-traffic hours.

---

### 3. Discord Allowed Redirects (CRITICAL FORMAT)
```
DISCORD_ALLOWED_REDIRECTS=https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://auth/callback
```

**⚠️ CRITICAL**:
- Must be **SINGLE LINE**
- **NO LINE BREAKS**
- **NO SPACES** around commas
- Copy exactly as shown above

---

## 🟡 IMPORTANT - Set These Up

### 4. Sentry Error Tracking (New)
```
SENTRY_DSN=https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT_ID
```

**How to get this**:
1. Go to https://sentry.io
2. Create new project → Select "NestJS"
3. Copy the DSN from Settings → Client Keys (DSN)
4. Paste into Railway

**Why**: Enables production error tracking and monitoring.

---

## 🟢 VERIFY - Should Already Be Set

### 5. Database URL (Auto-injected by Railway)
```
DATABASE_URL=postgresql://...
```
**Action**: Leave as-is (Railway manages this automatically)

---

### 6. Application Settings
```
NODE_ENV=production
API_URL=https://genki-tcg-production.up.railway.app
PORT=3001
```
**Action**: Verify these are set (Railway should auto-set PORT)

---

### 7. CORS Origins
```
CORS_ORIGINS=https://genki-tcg-production.up.railway.app,genki-tcg://
```
**Action**: Add your admin web domain when ready:
```
CORS_ORIGINS=https://genki-tcg-production.up.railway.app,https://admin.yourdomain.com,genki-tcg://
```

---

### 8. JWT Expiration (Should be set)
```
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=7d
```
**Action**: Verify these exist

---

### 9. Discord OAuth (Should be set)
```
DISCORD_CLIENT_ID=1441953820820373639
```
**Action**: Verify this is correct

---

## 📋 Step-by-Step Update Process

### Method 1: Railway Dashboard (Recommended)
1. Go to https://railway.app/dashboard
2. Select your Genki TCG project
3. Click on your service (backend)
4. Go to "Variables" tab
5. For each variable above:
   - Click "+ New Variable"
   - Enter name and value exactly as shown
   - Click "Add"
6. Railway will auto-redeploy after changes

### Method 2: Railway CLI
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Set variables (one at a time)
railway variables set DISCORD_CLIENT_SECRET="mAMBirILc0xNtz3oqyNoYPEM6mTeOMdI"
railway variables set JWT_SECRET="QmpccyoPsyd9ueDse2NKiYfYtUXUTCImfY86ZNEZaIWfYo9fqHrCU71ReUgnnQa/sdzdTXw18o5XfGiHJCx6PQ=="
railway variables set REFRESH_TOKEN_SECRET="hvDMVE0dBPxg+khZYHsRnArLdL3Ef/dIurBgCkWbUKbWAawCgTdo6pvsDLq7b2gxkT+SMnGVzqsKbWxWPT2aUw=="

# CRITICAL: Set this on ONE LINE
railway variables set DISCORD_ALLOWED_REDIRECTS="https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://auth/callback"

# After setting up Sentry project
railway variables set SENTRY_DSN="your-sentry-dsn-here"
```

---

## ✅ Verification Checklist

After updating variables, verify:

```bash
# 1. Health check
curl https://genki-tcg-production.up.railway.app/health
# Expected: {"status":"ok","database":"connected"}

# 2. Check Railway logs
railway logs
# Look for: "Application started successfully"

# 3. Test Discord OAuth (in browser)
# Visit: https://genki-tcg-production.up.railway.app/auth/discord/url
# Should redirect to Discord login

# 4. Check Sentry (after setup)
# Go to Sentry dashboard
# Trigger test error (optional)
# Verify error appears in Sentry
```

---

## 🔒 Security Notes

1. **Never commit these to git** - They're secrets
2. **Rotate JWT secrets** - Invalidates all sessions (notify users)
3. **Discord redirects** - Must match Discord Developer Portal exactly
4. **Sentry DSN** - Not super sensitive but don't expose publicly

---

## 🆘 Troubleshooting

**If deployment fails after updating**:
1. Check Railway logs: `railway logs`
2. Common issues:
   - DISCORD_ALLOWED_REDIRECTS has line breaks → Fix: Copy from this doc exactly
   - JWT_SECRET too short → Use the ones provided above
   - Missing DATABASE_URL → Railway should auto-inject this

**Rollback Plan**:
1. Railway Dashboard → Deployments
2. Select previous successful deployment
3. Click "Redeploy"
4. Revert environment variables to previous values

---

## 📊 Summary Table

| Variable | Action Required | Priority |
|----------|----------------|----------|
| DISCORD_CLIENT_SECRET | ✅ Update to new value | 🔴 Critical |
| JWT_SECRET | ✅ Update to production value | 🔴 Critical |
| REFRESH_TOKEN_SECRET | ✅ Update to production value | 🔴 Critical |
| DISCORD_ALLOWED_REDIRECTS | ⚠️ Verify format (no line breaks) | 🔴 Critical |
| SENTRY_DSN | ➕ Add after creating Sentry project | 🟡 Important |
| DATABASE_URL | ✓ Auto-managed by Railway | 🟢 Verify |
| NODE_ENV | ✓ Should be "production" | 🟢 Verify |
| API_URL | ✓ Should be Railway URL | 🟢 Verify |
| CORS_ORIGINS | ✓ Update when adding admin domain | 🟢 Verify |

---

**Next Steps**:
1. Update variables 1-4 immediately (Critical)
2. Set up Sentry project and add DSN (Important)
3. Verify deployment with checklist above
4. Monitor Railway logs for any errors
