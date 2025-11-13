# Railway Deployment Guide

## ✅ Build Status
The application now builds successfully! If the healthcheck is failing, you need to configure environment variables.

## 🔧 Required Environment Variables

Configure these in your Railway project settings:

### Essential (Required for Basic Operation)

```bash
# Database - Railway will auto-provide this if you add a PostgreSQL plugin
DATABASE_URL=postgresql://user:password@host:5432/genki_tcg?sslmode=require

# JWT Secret - Generate with: openssl rand -base64 64
JWT_SECRET=YOUR_64_CHARACTER_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d

# Application Settings
NODE_ENV=production
PORT=3000

# CORS - Add your frontend URLs (comma-separated)
CORS_ORIGINS=https://your-admin-domain.com,https://your-app-domain.com,genki-tcg://
```

### Optional (For Enhanced Features)

```bash
# Redis (for caching and rate limiting)
REDIS_URL=rediss://default:password@host:6379

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

## 📋 Setup Steps

### 1. Add PostgreSQL Database

In Railway:
1. Go to your project
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically set `DATABASE_URL` in your backend service

### 2. Generate JWT Secret

Run this command locally to generate a secure secret:
```bash
openssl rand -base64 64
```

Copy the output and add it to Railway as `JWT_SECRET`.

### 3. Configure Environment Variables

In Railway dashboard:
1. Go to your backend service
2. Click **"Variables"** tab
3. Add each variable from the "Essential" section above
4. Click **"Deploy"** to restart with new variables

### 4. Set CORS Origins

Update `CORS_ORIGINS` to include your actual frontend domains:
```bash
# Example
CORS_ORIGINS=https://admin.mydomain.com,https://app.mydomain.com,genki-tcg://
```

## 🔍 Troubleshooting

### Healthcheck Failing?

**Check deployment logs** in Railway:
1. Click on your backend service
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. Check the **"Deploy Logs"** for errors

Common issues:
- ❌ Missing `DATABASE_URL` → Add PostgreSQL database
- ❌ Missing `JWT_SECRET` → Generate and add it
- ❌ Database connection error → Check `DATABASE_URL` format includes `?sslmode=require`
- ❌ Port issues → Ensure `PORT=3000` is set (or let Railway auto-set it)

### Application Logs

To see why the app is failing:
```bash
# In Railway, view real-time logs:
# Click service → "Deployments" → Latest deployment → "View Logs"
```

Look for:
- Database connection errors
- Missing environment variable warnings
- Port binding errors
- Prisma migration errors

### Database Migrations

The Dockerfile automatically runs migrations on startup:
```bash
npx prisma migrate deploy && node dist/main
```

If migrations fail:
1. Check `DATABASE_URL` is correct
2. Ensure database is accessible
3. Check migration files in `apps/backend/prisma/migrations`

## 🚀 Deployment Workflow

1. **Push to branch** → Railway auto-detects and builds
2. **Build succeeds** → Railway creates Docker image
3. **Migrations run** → Database schema updated
4. **App starts** → Listens on port 3000
5. **Healthcheck passes** → `/health` endpoint responds
6. **Deployment succeeds** → App is live!

## 📊 Architecture

```
┌─────────────────┐
│  Railway Build  │
├─────────────────┤
│ 1. Install deps │
│ 2. Gen Prisma   │
│ 3. Build TS     │
│ 4. Create image │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Railway Deploy  │
├─────────────────┤
│ 1. Run migrations│
│ 2. Start app    │
│ 3. Bind port    │
│ 4. Healthcheck  │
└─────────────────┘
```

## 🔐 Security Checklist

Before going live:
- [ ] Generate strong `JWT_SECRET` (64+ characters)
- [ ] Use `sslmode=require` in `DATABASE_URL`
- [ ] Set specific `CORS_ORIGINS` (no wildcards in production)
- [ ] Enable Railway's built-in DDoS protection
- [ ] Review Prisma migrations before deploy
- [ ] Set up monitoring (Sentry recommended)

## 📞 Support

If healthcheck is still failing after setting environment variables, check:
1. Railway deployment logs for specific errors
2. Database connectivity
3. Prisma client generation
4. Application startup logs
