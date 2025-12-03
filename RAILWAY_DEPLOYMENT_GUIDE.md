# Railway Production Deployment Guide

This guide covers deploying Genki TCG to Railway for production use.

## Prerequisites

- [Railway account](https://railway.app/) (free tier available)
- [Railway CLI](https://docs.railway.app/develop/cli) installed (optional but recommended)
- GitHub repository connected to Railway
- Sentry account for error tracking

---

## Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your `genki-tcg` repository
5. Select the branch you want to deploy (e.g., `main` or `production`)

---

## Step 2: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically provision a database
4. The `DATABASE_URL` environment variable will be automatically set

---

## Step 3: Add Redis (Optional but Recommended)

1. Click "+ New" in your project
2. Select "Database" → "Add Redis"
3. The `REDIS_URL` will be automatically set

---

## Step 4: Configure Backend Service

### Environment Variables

Add these environment variables in Railway dashboard (Settings → Variables):

```
# Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-64>
JWT_REFRESH_SECRET=<generate-different-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Discord OAuth
DISCORD_CLIENT_ID=<your-discord-client-id>
DISCORD_CLIENT_SECRET=<your-discord-client-secret>
DISCORD_REDIRECT_URI=https://your-production-url.up.railway.app/discord/callback

# Environment
NODE_ENV=production

# CORS
CORS_ORIGINS=https://your-frontend-url.up.railway.app,https://your-admin-url.up.railway.app

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Sentry Error Tracking
SENTRY_DSN=<your-backend-sentry-dsn>

# Database (automatically set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (automatically set by Railway)
REDIS_URL=${{Redis.REDIS_URL}}
```

### Build Configuration

Railway should auto-detect your monorepo. If not, configure:

**Root Directory:** `apps/backend`

**Build Command:** `npm run build`

**Start Command:** `npm run start:prod`

**Nixpacks Configuration** (optional - create `nixpacks.toml` in backend):
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm install --workspace=apps/backend --include-workspace-root"]

[phases.build]
cmds = ["npm run build --workspace=apps/backend"]

[start]
cmd = "npm run start:prod --workspace=apps/backend"
```

---

## Step 5: Run Database Migrations

After deployment, run migrations:

### Option A: Using Railway CLI
```bash
railway login
railway link <your-project-id>
railway run npm run db:migrate --workspace=apps/backend
```

### Option B: Using Railway Dashboard
1. Go to your backend service
2. Click "Settings" → "Deploy"
3. Add a custom start command temporarily:
   ```
   npx prisma migrate deploy && npm run start:prod
   ```
4. Redeploy the service
5. Migrations will run on startup

### Seed Initial Data (Optional)
```bash
railway run npm run db:seed --workspace=apps/backend
```

---

## Step 6: Configure Discord OAuth Production Redirect

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "OAuth2" → "Redirects"
4. Add your production callback URL:
   ```
   https://your-backend-url.up.railway.app/discord/callback
   ```
5. Save changes

---

## Step 7: Deploy Mobile App (Optional - for now)

The mobile app will be deployed via EAS (Expo Application Services) later.

For now, update mobile app environment variables:

**apps/mobile/.env.production:**
```
EXPO_PUBLIC_API_URL=https://your-backend-url.up.railway.app
EXPO_PUBLIC_SENTRY_DSN=<your-mobile-sentry-dsn>
EXPO_PUBLIC_ENVIRONMENT=production
```

---

## Step 8: Deploy Admin Web (Next.js)

### Create Admin Web Service

1. In Railway project, click "+ New" → "GitHub Repo"
2. Select the same repo but configure for admin web
3. Set **Root Directory:** `apps/admin-web`

### Environment Variables

```
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
NEXT_PUBLIC_SENTRY_DSN=<your-admin-sentry-dsn>
NODE_ENV=production
```

### Build Configuration

**Build Command:** `npm run build`
**Start Command:** `npm run start`

---

## Step 9: Set Up Custom Domains (Optional)

1. Go to service settings in Railway
2. Click "Settings" → "Domains"
3. Add custom domain (e.g., `api.genkitcg.com`)
4. Update DNS records as instructed by Railway
5. Update CORS_ORIGINS and DISCORD_REDIRECT_URI with new domain

---

## Step 10: Set Up Sentry

### Backend Sentry

1. Create project at [sentry.io](https://sentry.io)
2. Name: `genki-tcg-backend`
3. Platform: Node.js
4. Copy DSN and add to Railway environment variables
5. Generate Auth Token (Settings → Developer Settings → Auth Tokens)

### Mobile Sentry

1. Create project: `genki-tcg-mobile`
2. Platform: React Native
3. Copy DSN and add to mobile `.env.production`
4. Update `app.json` with organization slug

---

## Step 11: Monitor & Test

### Health Check

Visit: `https://your-backend-url.up.railway.app/health`

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### Test Key Endpoints

1. **Auth:** `POST /auth/login`
2. **Events:** `GET /events`
3. **Leaderboard:** `GET /leaderboard/lifetime?gameType=ONE_PIECE_TCG`

### Check Logs

Railway Dashboard → Service → "Deployments" → View Logs

---

## Step 12: Enable Automatic Deployments

1. Go to service settings
2. "Settings" → "Deploys"
3. Enable "Auto Deploy"
4. Select branch (e.g., `main` or `production`)
5. Every push to the branch will trigger automatic deployment

---

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check if PostgreSQL service is running
- Run migrations: `railway run npx prisma migrate deploy`

### Build Failures

- Check build logs in Railway dashboard
- Verify `package.json` scripts are correct
- Ensure all dependencies are in `package.json`, not just `devDependencies`

### CORS Errors

- Verify `CORS_ORIGINS` includes your frontend URLs
- Check that URLs don't have trailing slashes
- Test with: `curl -H "Origin: https://your-frontend.com" https://your-backend.com/health -v`

### Discord OAuth Not Working

- Verify redirect URI matches exactly (no trailing slash)
- Check `DISCORD_CLIENT_SECRET` is set correctly
- Ensure production URL is added in Discord Developer Portal

---

## Production Checklist

Before going live, verify:

- [ ] All environment variables are set
- [ ] Database migrations have run successfully
- [ ] Discord OAuth redirect URIs are configured
- [ ] Sentry is receiving error reports (test with intentional error)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Health endpoint returns 200 OK
- [ ] SSL/HTTPS is working
- [ ] Custom domains are configured (optional)
- [ ] Monitoring and alerts are set up
- [ ] Backup strategy is in place (Railway automatic backups)

---

## Cost Optimization

**Railway Free Tier:**
- $5 credit per month
- Enough for small production workloads
- Automatic sleep after inactivity (can disable with hobby plan)

**Hobby Plan ($5/month):**
- No sleep mode
- Better for always-on production apps

**Pro Plan ($20/month):**
- Increased resource limits
- Priority support
- Multiple environments

---

## Backup & Recovery

Railway provides automatic daily backups for PostgreSQL.

### Manual Backup
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup
```bash
railway run psql $DATABASE_URL < backup.sql
```

---

## Security Best Practices

1. **Rotate Secrets Regularly:** Update JWT secrets, Discord secrets quarterly
2. **Enable MFA:** On Railway and GitHub accounts
3. **Monitor Logs:** Check Sentry and Railway logs daily
4. **Rate Limiting:** Already enabled via ThrottlerModule
5. **Input Validation:** Already enabled via ValidationPipe
6. **HTTPS Only:** Enforced by Railway
7. **Environment Variables:** Never commit secrets to git

---

## Next Steps

1. Set up staging environment (separate Railway project)
2. Configure CI/CD pipeline (GitHub Actions)
3. Set up monitoring dashboards (Sentry, Railway metrics)
4. Create runbooks for common issues
5. Document incident response procedures

---

## Support Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Sentry Documentation](https://docs.sentry.io/)
- [NestJS Deployment Guide](https://docs.nestjs.com/faq/serverless)

---

**Last Updated:** December 2, 2025
