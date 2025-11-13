# Genki TCG - Production Deployment Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Backend Deployment](#backend-deployment)
3. [Database & Redis Hosting](#database--redis-hosting)
4. [Mobile App Deployment](#mobile-app-deployment)
5. [Admin Web Deployment](#admin-web-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Error Tracking](#monitoring--error-tracking)
8. [Cost Estimates](#cost-estimates)
9. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Architecture                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ iOS App      │────────▶│              │         │              │
│ (App Store)  │         │   Backend    │────────▶│  PostgreSQL  │
└──────────────┘         │   (Railway)  │         │  (Neon)      │
                         │              │         └──────────────┘
┌──────────────┐         │   NestJS     │
│ Android App  │────────▶│   + Socket   │────────▶│  Redis       │
│ (Play Store) │         │              │         │  (Upstash)   │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
┌──────────────┐                │                  ┌──────────────┐
│ Admin Web    │────────────────┘                  │ File Storage │
│ (Vercel)     │                                   │ (S3/R2)      │
└──────────────┘                                   └──────────────┘
```

---

## Backend Deployment

### Recommended: Railway (Best for NestJS + WebSockets)

**Why Railway:**
- ✅ Excellent WebSocket support (Socket.IO)
- ✅ Zero-config PostgreSQL & Redis
- ✅ Automatic HTTPS
- ✅ Simple deployment from GitHub
- ✅ Good free tier ($5/month credit)
- ✅ Scales easily

**Alternative Options:**
- **Render** - Good free tier, but slower cold starts
- **Fly.io** - Great for global deployments
- **AWS ECS/Fargate** - More complex, better for scale
- **Google Cloud Run** - Serverless containers
- **DigitalOcean App Platform** - Simple, predictable pricing

### Railway Deployment Steps

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### 2. Create Railway Project
```bash
cd apps/backend
railway init
```

#### 3. Add PostgreSQL & Redis Services
```bash
railway add --plugin postgresql
railway add --plugin redis
```

#### 4. Set Environment Variables
```bash
# Railway will auto-inject DATABASE_URL and REDIS_URL
# You need to add:
railway variables set JWT_SECRET=$(openssl rand -base64 64)
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set FRONTEND_URL=https://admin.yourdomain.com
railway variables set MOBILE_APP_SCHEME=genki-tcg://
```

#### 5. Create `railway.json` in Backend Root
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 6. Add Dockerfile (Alternative to Nixpacks)
```dockerfile
# apps/backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/ ./packages/

# Install dependencies
RUN npm ci

# Copy source
COPY apps/backend ./apps/backend
COPY tsconfig.json ./

# Generate Prisma client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/

# Install production dependencies only
RUN npm ci --production --workspace=apps/backend

# Copy built files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/backend

# Run migrations on startup
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

EXPOSE 3000
```

#### 7. Add Health Check Endpoint
```typescript
// apps/backend/src/app.controller.ts
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

#### 8. Deploy
```bash
railway up
```

#### 9. Get Your Backend URL
```bash
railway domain
# Will give you: https://your-app.railway.app
```

---

## Database & Redis Hosting

### Option 1: Railway (Bundled)
- **PostgreSQL**: Included with Railway
- **Redis**: Included with Railway
- **Cost**: ~$10-20/month for both
- **Pros**: Zero config, automatic backups
- **Cons**: Limited to Railway ecosystem

### Option 2: Separate Services (Recommended for Scale)

#### PostgreSQL: Neon (Serverless PostgreSQL)
```bash
# Sign up at https://neon.tech
# Create a new project
# Copy connection string

railway variables set DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"
```

**Neon Pricing:**
- Free tier: 3 GiB storage, 100 hours compute/month
- Pro: $19/month for 10 GiB, unlimited compute

**Alternatives:**
- **Supabase** - $25/month, includes auth & storage
- **PlanetScale** - MySQL-compatible, free tier available
- **AWS RDS** - $15-50/month, full control

#### Redis: Upstash (Serverless Redis)
```bash
# Sign up at https://upstash.com
# Create a Redis database
# Copy connection string

railway variables set REDIS_URL="rediss://default:xxx@us1-xxx.upstash.io:6379"
```

**Upstash Pricing:**
- Free tier: 10K commands/day
- Pay-as-you-go: $0.20 per 100K commands

**Alternatives:**
- **Redis Cloud** - $5/month for 30MB
- **AWS ElastiCache** - $15+/month

---

## Mobile App Deployment

### Prerequisites

#### 1. Create Expo Account
```bash
npm install -g eas-cli
eas login
```

#### 2. Update `app.json` EAS Project ID
```bash
cd apps/mobile
eas init
```

This will update `app.json` with your real project ID.

#### 3. Configure Environment Variables
Create `apps/mobile/.env.production`:
```bash
API_URL=https://your-backend.railway.app
WS_URL=wss://your-backend.railway.app
```

### iOS App Store Deployment

#### 1. Apple Developer Account Setup
- Cost: **$99/year**
- Sign up at: https://developer.apple.com
- Create App ID: `com.genkitcg.app`
- Create App in App Store Connect

#### 2. Configure iOS Bundle Identifier
Already set in `app.json`:
```json
"ios": {
  "bundleIdentifier": "com.genkitcg.app"
}
```

#### 3. Create EAS Build Configuration
Create `apps/mobile/eas.json`:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "API_URL": "https://your-backend.railway.app",
        "WS_URL": "wss://your-backend.railway.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-id-from-app-store-connect",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

#### 4. Build for iOS
```bash
cd apps/mobile

# First build
eas build --platform ios --profile production

# This will:
# 1. Prompt for Apple Developer credentials
# 2. Create provisioning profiles
# 3. Build the app (takes ~15 minutes)
# 4. Give you a download link
```

#### 5. Submit to App Store
```bash
# Automatic submission
eas submit --platform ios --profile production

# Or manually:
# 1. Download the .ipa file
# 2. Upload via Transporter app
# 3. Submit for review in App Store Connect
```

#### 6. App Store Review Checklist
- [ ] Privacy Policy URL (required)
- [ ] App description & screenshots
- [ ] Test account credentials for reviewers
- [ ] Export compliance (if app uses encryption - yes for HTTPS)
- [ ] Age rating
- [ ] App icon (1024x1024)

**Review Time:** 1-3 days typically

### Android Play Store Deployment

#### 1. Google Play Console Setup
- Cost: **$25 one-time fee**
- Sign up at: https://play.google.com/console
- Create a new app
- Package name: `com.genkitcg.app`

#### 2. Generate Keystore (Required for Android)
```bash
cd apps/mobile

# EAS will handle this automatically, or generate manually:
keytool -genkeypair -v -storetype PKCS12 -keystore genki-tcg.keystore \
  -alias genki-tcg -keyalg RSA -keysize 2048 -validity 10000
```

#### 3. Build for Android
```bash
# First build
eas build --platform android --profile production

# This will:
# 1. Prompt for keystore info (or create one)
# 2. Build the AAB (Android App Bundle)
# 3. Takes ~10 minutes
# 4. Give you download link
```

#### 4. Submit to Play Store
```bash
# Automatic submission
eas submit --platform android --profile production

# Or manually:
# 1. Download the .aab file
# 2. Upload to Play Console
# 3. Fill out store listing
# 4. Submit for review
```

#### 5. Play Store Listing Requirements
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (min 2, max 8)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target age group
- [ ] App category

**Review Time:** Few hours to 7 days

### Push Notifications Setup (Expo)

#### iOS APNs Setup
```bash
# EAS handles this automatically, but you need:
# 1. Apple Developer Account
# 2. App ID with Push Notifications enabled
# 3. APNs Key from Apple Developer Portal

# Configure in app.json:
"ios": {
  "pushNotificationServiceEnvironment": "production"
}
```

#### Android FCM Setup
```bash
# 1. Create Firebase project at https://console.firebase.google.com
# 2. Add Android app with package name: com.genkitcg.app
# 3. Download google-services.json

# Add to app.json:
"android": {
  "googleServicesFile": "./google-services.json"
}
```

---

## Admin Web Deployment

### Recommended: Vercel (Zero-Config Next.js)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy from Root
```bash
cd /home/user/genki-tcg
vercel --cwd apps/admin-web
```

#### 3. Configure Environment Variables in Vercel Dashboard
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

#### 4. Auto-Deploy from GitHub
```bash
# Connect GitHub repo in Vercel dashboard
# Set root directory to: apps/admin-web
# Framework preset: Next.js
# Auto-deploys on push to main
```

**Alternatives:**
- **Netlify** - Similar to Vercel
- **Cloudflare Pages** - Free, global CDN
- **AWS Amplify** - AWS ecosystem

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build all apps
        run: npm run build

  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  deploy-mobile:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS
        run: |
          cd apps/mobile
          eas build --platform ios --non-interactive --no-wait

      - name: Build Android
        run: |
          cd apps/mobile
          eas build --platform android --non-interactive --no-wait

  deploy-admin:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/admin-web
```

### Required GitHub Secrets
```bash
# Railway
RAILWAY_TOKEN          # From Railway dashboard

# Expo
EXPO_TOKEN            # Run: eas whoami --json

# Vercel
VERCEL_TOKEN          # From Vercel account settings
VERCEL_ORG_ID         # From Vercel project settings
VERCEL_PROJECT_ID     # From Vercel project settings
```

---

## Monitoring & Error Tracking

### Backend Monitoring

#### 1. Sentry (Error Tracking)
```bash
npm install @sentry/node @sentry/tracing --workspace=apps/backend
```

```typescript
// apps/backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### 2. LogTail/Better Stack (Logging)
- Free tier: 1GB/month
- Structured logs with search
- Real-time log streaming

```bash
npm install @logtail/node --workspace=apps/backend
```

#### 3. Uptime Monitoring (Better Uptime)
- Free tier: 10 monitors
- 30-second checks
- Email/SMS alerts

### Mobile App Monitoring

#### Sentry for React Native
```bash
npm install @sentry/react-native --workspace=apps/mobile
```

```typescript
// apps/mobile/App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN_MOBILE,
});
```

### Analytics

#### Expo Analytics
```bash
npm install expo-firebase-analytics --workspace=apps/mobile
```

#### PostHog (Open Source Alternative)
```bash
npm install posthog-react-native --workspace=apps/mobile
```

---

## Cost Estimates

### Startup (0-1000 users)
| Service | Provider | Cost |
|---------|----------|------|
| Backend | Railway | $20/month |
| Database | Neon Free | $0 |
| Redis | Upstash Free | $0 |
| Admin Web | Vercel | $0 |
| Mobile Hosting | Expo EAS | $0 |
| **Monitoring** | Sentry | $0 (free tier) |
| **Total Monthly** | | **$20** |
| **One-time** | Apple Dev ($99) + Google Play ($25) | **$124** |

### Growth (1000-10000 users)
| Service | Provider | Cost |
|---------|----------|------|
| Backend | Railway Pro | $50/month |
| Database | Neon Pro | $19/month |
| Redis | Upstash | $10/month |
| Admin Web | Vercel Pro | $20/month |
| Storage (S3) | AWS | $5/month |
| CDN | Cloudflare | $0 |
| **Monitoring** | Sentry Team | $26/month |
| **Total Monthly** | | **$130** |

### Scale (10000+ users)
| Service | Provider | Cost |
|---------|----------|------|
| Backend | Railway/AWS ECS | $200-500/month |
| Database | AWS RDS | $100-300/month |
| Redis | AWS ElastiCache | $50-100/month |
| Admin Web | Vercel | $20/month |
| Storage + CDN | Cloudflare R2 | $10-50/month |
| **Monitoring** | DataDog/New Relic | $100-300/month |
| **Total Monthly** | | **$480-1270** |

---

## Deployment Checklist

### Pre-Deployment

Backend:
- [ ] All environment variables documented
- [ ] Health check endpoint working
- [ ] Database migrations tested
- [ ] JWT secret generated (64+ characters)
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Password hashing verified
- [ ] Prisma client generated

Mobile:
- [ ] API URLs point to production
- [ ] Bundle identifiers configured
- [ ] App icons created (all sizes)
- [ ] Splash screen configured
- [ ] Push notification certificates ready
- [ ] Privacy policy written and hosted
- [ ] App Store screenshots prepared (iOS)
- [ ] Play Store screenshots prepared (Android)

Admin Web:
- [ ] Environment variables set
- [ ] Production build tested locally
- [ ] Analytics configured
- [ ] Error tracking enabled

### Deployment

- [ ] Backend deployed and health check returns 200
- [ ] Database migrations run successfully
- [ ] Redis connection verified
- [ ] Admin web deployed and accessible
- [ ] iOS build created successfully
- [ ] Android build created successfully
- [ ] Test all API endpoints from mobile app
- [ ] Test WebSocket connections
- [ ] Test push notifications (development)

### App Store Submission

iOS:
- [ ] App uploaded to App Store Connect
- [ ] Screenshots uploaded
- [ ] Privacy policy URL added
- [ ] Test account credentials provided
- [ ] Submitted for review

Android:
- [ ] AAB uploaded to Play Console
- [ ] Store listing complete
- [ ] Screenshots uploaded
- [ ] Content rating completed
- [ ] Published to production track

### Post-Deployment

- [ ] Monitor error rates in Sentry
- [ ] Check backend logs for issues
- [ ] Verify database connections stable
- [ ] Set up uptime monitoring
- [ ] Configure backup schedule
- [ ] Document deployment process
- [ ] Create runbook for common issues

---

## Quick Start Commands

### Deploy Everything
```bash
# 1. Backend
cd apps/backend
railway up

# 2. Admin Web
cd apps/admin-web
vercel --prod

# 3. Mobile (iOS)
cd apps/mobile
eas build --platform ios --profile production
eas submit --platform ios --profile production

# 4. Mobile (Android)
eas build --platform android --profile production
eas submit --platform android --profile production
```

### Rollback Commands
```bash
# Railway - rollback to previous deployment
railway rollback

# Vercel - promote specific deployment
vercel rollback [deployment-url]

# Mobile - submit previous build
eas submit --platform ios --id [build-id]
```

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Expo EAS Docs**: https://docs.expo.dev/eas
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines
- **Play Store Guidelines**: https://play.google.com/console/about/guides
- **Vercel Docs**: https://vercel.com/docs

---

**Next Steps:**
1. Choose your infrastructure providers
2. Set up accounts and billing
3. Configure environment variables
4. Run test deployments
5. Submit to app stores
6. Monitor and iterate
