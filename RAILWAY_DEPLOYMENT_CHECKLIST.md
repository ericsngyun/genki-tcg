# Railway Production Deployment Checklist

**Deployment URL**: https://genki-tcg-production.up.railway.app

## Critical Environment Variables to Update

### 1. Discord OAuth Configuration

```bash
DISCORD_CLIENT_SECRET="mAMBirILc0xNtz3oqyNoYPEM6mTeOMdI"
```

**⚠️ CRITICAL**: Verify `DISCORD_ALLOWED_REDIRECTS` format:
```bash
# Must be SINGLE LINE, comma-separated, NO line breaks
DISCORD_ALLOWED_REDIRECTS="https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://auth/callback"
```

### 2. Production JWT Secrets (ROTATE FROM DEV)

**Current Status**: Using development secrets (INSECURE)

**New Production Secrets**:
```bash
JWT_SECRET="QmpccyoPsyd9ueDse2NKiYfYtUXUTCImfY86ZNEZaIWfYo9fqHrCU71ReUgnnQa/sdzdTXw18o5XfGiHJCx6PQ=="

REFRESH_TOKEN_SECRET="hvDMVE0dBPxg+khZYHsRnArLdL3Ef/dIurBgCkWbUKbWAawCgTdo6pvsDLq7b2gxkT+SMnGVzqsKbWxWPT2aUw=="
```

**⚠️ WARNING**: Rotating these will invalidate all existing user sessions.
- Plan: Rotate during low-traffic period
- Notify users they'll need to re-login

### 3. CORS Origins

```bash
CORS_ORIGINS="https://genki-tcg-production.up.railway.app,genki-tcg://"
```

Add admin web domain when ready:
```bash
CORS_ORIGINS="https://genki-tcg-production.up.railway.app,https://admin.genki-tcg.com,genki-tcg://"
```

### 4. Sentry Error Tracking

**Action Required**: Create Sentry project and get DSN

```bash
SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"
```

Steps:
1. Go to https://sentry.io
2. Create new project (select NestJS)
3. Copy DSN from project settings
4. Set in Railway variables

### 5. Application URLs

```bash
API_URL="https://genki-tcg-production.up.railway.app"
NODE_ENV="production"
```

## Verification Steps

After updating variables in Railway dashboard:

1. **Trigger Redeploy**: Railway auto-redeploys on variable changes
2. **Check Health Endpoint**:
   ```bash
   curl https://genki-tcg-production.up.railway.app/health
   ```
   Should return: `{"status":"ok","database":"connected"}`

3. **Test Discord OAuth**:
   - Web flow: https://genki-tcg-production.up.railway.app/auth/discord/url
   - Mobile deep link: genki-tcg://auth/callback

4. **Monitor Logs**:
   - Railway Dashboard → Deployments → View Logs
   - Check for startup errors
   - Verify "Application started successfully"

5. **Test API Endpoints**:
   ```bash
   # Health check
   curl https://genki-tcg-production.up.railway.app/health

   # Events list (should return 401 if not authenticated)
   curl https://genki-tcg-production.up.railway.app/events
   ```

## Database Considerations

**Current**: PostgreSQL on Railway (nozomi.proxy.rlwy.net:14896)

**Backup Strategy** (TODO):
- [ ] Enable Railway automated backups
- [ ] Set up daily backup script
- [ ] Test restore process
- [ ] Document recovery procedures

## Mobile App Configuration

After Railway variables are updated, update mobile app:

**File**: `apps/mobile/.env`
```bash
EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
EXPO_PUBLIC_WS_URL=wss://genki-tcg-production.up.railway.app
```

## Security Review

- [x] HTTPS enabled (Railway default)
- [x] Helmet.js configured
- [x] Rate limiting enabled
- [ ] Production JWT secrets rotated
- [ ] CORS properly restricted
- [ ] Sentry error tracking active
- [ ] Database backups configured

## Rollback Plan

If deployment fails:
1. Railway Dashboard → Deployments
2. Select previous successful deployment
3. Click "Redeploy"
4. Revert environment variables if needed

## Notes

- Railway automatically runs Prisma migrations via `start.sh`
- Connection pooling: 10 connections (Railway default)
- Memory limit: Check Railway plan limits
- Keep this document updated as configuration changes
