# Genki TCG - Quick Deployment Setup Guide

Complete deployment guide for all Genki TCG services with the new landing page.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Website Deployment](#website-deployment)
- [Admin Portal Deployment](#admin-portal-deployment)
- [Backend Deployment](#backend-deployment)
- [Mobile App Deployment](#mobile-app-deployment)
- [Cost Summary](#cost-summary)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Architecture Overview

```
genkitcg.app          → Main website (Next.js static export on Vercel)
admin.genkitcg.app    → Admin portal (Next.js on Vercel)
api.genkitcg.app      → Backend API (NestJS on Railway)
iOS/Android Apps      → Mobile apps (Expo/React Native)
```

---

## Website Deployment

### Prerequisites
- Vercel account (free tier)
- Domain: genkitcg.app purchased and ready
- GitHub repository connected

### Step 1: Deploy to Vercel

```bash
cd apps/website
vercel --prod
```

### Step 2: Configure Vercel Project

**Project Settings:**
- Framework Preset: **Next.js**
- Root Directory: **apps/website**
- Build Command: **npm run build**
- Output Directory: **out**
- Install Command: **npm install**
- Environment Variables: **None required** (static site)

### Step 3: Domain Configuration

**DNS Records to add at your domain registrar:**

| Type  | Name  | Value                | Purpose        |
|-------|-------|---------------------|----------------|
| A     | @     | 76.76.21.21         | Root domain    |
| CNAME | www   | cname.vercel-dns.com| WWW subdomain  |
| CNAME | admin | cname.vercel-dns.com| Admin portal   |

**OR use CNAME for root (if supported):**

| Type  | Name | Value              |
|-------|------|--------------------|
| CNAME | @    | cname.vercel-dns.com |

### Step 4: Verify Deployment

1. Wait 5-10 minutes for DNS propagation
2. Vercel will automatically issue SSL certificate
3. Site will be live at: https://www.genkitcg.app

**Test checklist:**
- [ ] Homepage loads with new landing page
- [ ] 3D logo displays correctly
- [ ] All navigation links work
- [ ] Mobile responsive design works
- [ ] SSL certificate active (https://)
- [ ] www redirects properly

---

## Admin Portal Deployment

### Step 1: Deploy Admin Portal

```bash
cd apps/admin-web
vercel --prod
```

### Step 2: Configure Vercel Project

**Project Settings:**
- Framework Preset: **Next.js**
- Root Directory: **apps/admin-web**
- Build Command: **npm run build**
- Output Directory: **.next**
- Install Command: **npm install**

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Step 3: Add Domain

1. In Vercel dashboard for admin project, go to **Settings** → **Domains**
2. Add domain: `admin.genkitcg.app`
3. DNS record (already added above) will point to this project

---

## Backend Deployment

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Initialize Railway Project

```bash
cd apps/backend
railway init
```

### Step 3: Add Database Services

```bash
railway add --plugin postgresql
railway add --plugin redis
```

### Step 4: Set Environment Variables

```bash
# Railway auto-injects DATABASE_URL and REDIS_URL
# Set these manually:
railway variables set JWT_SECRET=$(openssl rand -base64 64)
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set FRONTEND_URL=https://admin.genkitcg.app
railway variables set WEBSITE_URL=https://www.genkitcg.app,https://admin.genkitcg.app
railway variables set MOBILE_APP_SCHEME=genki-tcg://
```

### Step 5: Deploy Backend

```bash
railway up
```

### Step 6: Get Backend URL

```bash
railway domain
# Returns: https://your-app.railway.app
```

### Step 7: Update Admin & Mobile Apps

After deployment, update the API URL in:

**Admin Web (`apps/admin-web`):**
```bash
# Update Vercel environment variable
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

**Mobile App (`apps/mobile/.env.production`):**
```bash
EXPO_PUBLIC_API_URL=https://your-app.railway.app
EXPO_PUBLIC_APP_NAME=Genki TCG
```

---

## Mobile App Deployment

### Prerequisites

```bash
npm install -g eas-cli
eas login
```

### Step 1: Initialize EAS

```bash
cd apps/mobile
eas init
```

This updates `app.json` with your project ID.

### Step 2: Configure Environment

Create `apps/mobile/.env.production`:

```bash
EXPO_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
EXPO_PUBLIC_APP_NAME=Genki TCG
```

### Step 3: iOS Deployment

**Requirements:**
- Apple Developer Account ($99/year)
- App ID: `com.genkitcg.app`

**Build and Submit:**

```bash
cd apps/mobile

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

**App Store Requirements:**
- [ ] Privacy Policy URL: https://www.genkitcg.app/privacy
- [ ] Terms of Service URL: https://www.genkitcg.app/terms
- [ ] Support URL: https://www.genkitcg.app/support
- [ ] App screenshots
- [ ] Test account credentials
- [ ] App icon (1024x1024)

**Review Time:** 1-3 days typically

### Step 4: Android Deployment

**Requirements:**
- Google Play Console Account ($25 one-time)
- Package name: `com.genkitcg.app`

**Build and Submit:**

```bash
cd apps/mobile

# Build for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

**Play Store Requirements:**
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (min 2, max 8)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Store listing complete

**Review Time:** Few hours to 7 days

---

## Cost Summary

### Monthly Costs

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Website | Vercel | Hobby | **$0** |
| Admin Portal | Vercel | Hobby | **$0** |
| Backend | Railway | Starter | **$20** |
| Database | Neon | Free Tier | **$0** |
| Redis | Upstash | Free Tier | **$0** |
| Mobile Hosting | Expo EAS | Free | **$0** |
| **Total Monthly** | | | **$20** |

### One-Time/Annual Costs

| Service | Cost | Frequency |
|---------|------|-----------|
| Domain (genkitcg.app) | $12 | Annual |
| Apple Developer | $99 | Annual |
| Google Play | $25 | One-time |
| **First Year Total** | **$136** | |

**Total First Year:** $136 (one-time) + ($20 × 12 months) = **$376**

**Ongoing Annual:** $111/year + ($20 × 12) = **$351/year**

---

## Post-Deployment Checklist

### Website & Admin
- [ ] Website loads at https://www.genkitcg.app
- [ ] New landing page displays correctly
- [ ] 3D logo renders properly
- [ ] All navigation links work
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Mobile responsive design works
- [ ] SSL certificate active
- [ ] Admin portal accessible at https://admin.genkitcg.app
- [ ] Admin can login successfully

### Backend
- [ ] Backend deployed and health check returns 200
- [ ] Database migrations run successfully
- [ ] Redis connection verified
- [ ] CORS configured for production domains
- [ ] JWT authentication working
- [ ] API endpoints responding correctly

### Mobile Apps
- [ ] iOS build created successfully
- [ ] Android build created successfully
- [ ] API URLs point to production backend
- [ ] WebSocket connections work
- [ ] Push notifications configured (if applicable)
- [ ] App submitted to App Store
- [ ] App submitted to Play Store

### Monitoring
- [ ] Vercel Analytics enabled for website
- [ ] Railway logs accessible
- [ ] Error tracking configured (Sentry optional)
- [ ] Uptime monitoring setup (optional)

---

## Quick Redeploy Commands

### After making changes to website:
```bash
cd apps/website && vercel --prod
```

### After making changes to admin portal:
```bash
cd apps/admin-web && vercel --prod
```

### After making changes to backend:
```bash
cd apps/backend && railway up
```

### After making changes to mobile app:
```bash
cd apps/mobile
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

## Troubleshooting

### DNS Not Propagating
```bash
# Check DNS propagation
nslookup genkitcg.app

# Or use: https://www.whatsmydns.net/
```
Wait 24-48 hours for full global propagation.

### Build Failures
1. Check Vercel/Railway build logs
2. Run `npm run build` locally to debug
3. Verify all environment variables are set

### SSL Certificate Issues
1. Remove and re-add domain in Vercel
2. Verify DNS records are correct
3. Wait 10-15 minutes and retry

### 404 Errors
1. Check `next.config.mjs` has `output: 'export'` (for website)
2. Verify `vercel.json` rewrites are configured
3. Redeploy the project

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Expo EAS Docs:** https://docs.expo.dev/eas
- **App Store Guidelines:** https://developer.apple.com/app-store/review/guidelines
- **Play Store Guidelines:** https://play.google.com/console/about/guides

---

**Ready to deploy?** Start with the website, then backend, then mobile apps! 🚀
