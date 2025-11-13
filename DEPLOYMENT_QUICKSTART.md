# Quick Start: Deploy Genki TCG to Production

This guide gets you from zero to production in ~2 hours.

## Prerequisites Checklist

### Accounts You Need (Some are free, some paid)
- [ ] GitHub account (free)
- [ ] Railway account (free tier, credit card for production)
- [ ] Expo account (free)
- [ ] Apple Developer ($99/year) - for iOS
- [ ] Google Play Console ($25 one-time) - for Android
- [ ] Vercel account (free tier works)

### Local Setup
```bash
# Install required CLIs
npm install -g @railway/cli eas-cli vercel

# Verify installations
railway --version
eas --version
vercel --version
```

---

## Step 1: Deploy Backend (15 minutes)

### 1.1 Create Railway Project
```bash
cd apps/backend

# Login to Railway
railway login

# Create new project
railway init

# Link to existing project (if you already created one)
# railway link
```

### 1.2 Add PostgreSQL Database
```bash
# Add PostgreSQL plugin
railway add --plugin postgresql

# Railway automatically sets DATABASE_URL
```

### 1.3 Add Redis (Optional but recommended)
```bash
# Add Redis plugin
railway add --plugin redis

# Railway automatically sets REDIS_URL
```

### 1.4 Set Environment Variables
```bash
# Generate a secure JWT secret
openssl rand -base64 64

# Set it in Railway
railway variables set JWT_SECRET="paste-the-generated-secret-here"

# Set other required variables
railway variables set NODE_ENV=production
railway variables set PORT=3000

# IMPORTANT: You'll update this after deploying admin web
railway variables set FRONTEND_URL=https://placeholder.com
```

### 1.5 Deploy
```bash
# From apps/backend directory
railway up

# Get your backend URL
railway domain

# Example output: https://genki-tcg-backend-production.up.railway.app
```

### 1.6 Verify Deployment
```bash
# Test health endpoint
curl https://your-backend-url.railway.app/health

# Should return: {"status":"ok","timestamp":"...","database":"connected",...}
```

**✅ Backend is live!** Save your backend URL - you'll need it for mobile and admin web.

---

## Step 2: Deploy Admin Web (10 minutes)

### 2.1 Login to Vercel
```bash
cd apps/admin-web
vercel login
```

### 2.2 Deploy
```bash
# First deployment
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: genki-tcg-admin
# - Directory: ./
# - Override settings? No

# Once deployed, promote to production
vercel --prod
```

### 2.3 Set Environment Variables
```bash
# Add your backend URL
vercel env add NEXT_PUBLIC_API_URL production

# Paste: https://your-backend-url.railway.app
```

### 2.4 Redeploy with Environment Variable
```bash
vercel --prod
```

### 2.5 Update Backend CORS
```bash
# Get your Vercel URL (e.g., https://genki-tcg-admin.vercel.app)
# Update Railway backend environment variable

railway variables set FRONTEND_URL=https://your-admin-url.vercel.app
```

**✅ Admin web is live!** You can now log in and manage tournaments.

---

## Step 3: Build Mobile Apps (20 minutes setup + 15 min builds)

### 3.1 Setup Expo Project
```bash
cd apps/mobile

# Login to Expo
eas login

# Initialize EAS
eas init

# This updates app.json with your project ID
```

### 3.2 Update EAS Configuration
Edit `apps/mobile/eas.json` and update:
```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://your-backend-url.railway.app",
        "WS_URL": "wss://your-backend-url.railway.app"
      }
    }
  }
}
```

### 3.3 Build iOS (if you have Apple Developer account)
```bash
# First build - EAS will ask for Apple credentials
eas build --platform ios --profile production

# Wait ~15 minutes
# EAS will output a build URL when done
```

### 3.4 Build Android
```bash
# Build for Android
eas build --platform android --profile production

# Wait ~10 minutes
# EAS will create a keystore automatically (first time only)
```

**✅ Mobile builds complete!** Download the files or prepare for app store submission.

---

## Step 4: Submit to App Stores (Manual - 30 minutes)

### 4.1 iOS App Store

#### Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Genki TCG
   - Primary Language: English
   - Bundle ID: com.genkitcg.app (must match app.json)
   - SKU: genki-tcg-001

#### Upload Build
```bash
# Option 1: Automatic submission (easiest)
eas submit --platform ios --profile production

# Option 2: Manual upload
# 1. Download .ipa from EAS build page
# 2. Use Transporter app to upload
```

#### Complete App Store Listing
1. Add app icon (1024×1024)
2. Add screenshots (required sizes for iPhone and iPad)
3. Write app description
4. Add privacy policy URL
5. Set content rating
6. Submit for review

**Review time:** 1-3 days typically

### 4.2 Google Play Store

#### Create App in Play Console
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in details:
   - App name: Genki TCG
   - Default language: English
   - App or game: App
   - Free or paid: Free

#### Upload Build
```bash
# Automatic submission
eas submit --platform android --profile production

# Or manually upload the .aab file from EAS build page
```

#### Complete Play Store Listing
1. Create store listing:
   - Short description
   - Full description
   - App icon (512×512)
   - Feature graphic (1024×500)
   - Screenshots (min 2)
2. Select app category
3. Create content rating
4. Set up pricing & distribution
5. Submit for review

**Review time:** Few hours to 7 days

---

## Step 5: Setup Monitoring (15 minutes)

### 5.1 Sentry (Error Tracking)
```bash
# Sign up at https://sentry.io
# Create new project for Node.js

# Add to backend
cd apps/backend
npm install @sentry/node @sentry/tracing

# Add SENTRY_DSN to Railway
railway variables set SENTRY_DSN="your-sentry-dsn"
```

### 5.2 Uptime Monitoring
Sign up for Better Uptime (free tier):
1. Go to https://betterstack.com/uptime
2. Add monitor for: `https://your-backend-url.railway.app/health`
3. Set check interval: 30 seconds
4. Add notification email

**✅ You're now monitoring production!**

---

## Step 6: Setup CI/CD (15 minutes)

### 6.1 Add GitHub Secrets
Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:
```bash
# Railway
RAILWAY_TOKEN - Get from: railway whoami --json

# Vercel
VERCEL_TOKEN - Get from: https://vercel.com/account/tokens
VERCEL_ORG_ID - In vercel.json after first deployment
VERCEL_PROJECT_ID - In vercel.json after first deployment

# Expo
EXPO_TOKEN - Get from: eas whoami --json
```

### 6.2 Enable GitHub Actions
The workflow file is already created at `.github/workflows/ci-cd.yml`

Push to main branch to trigger:
```bash
git push origin main
```

**✅ Auto-deployments are enabled!** Every push to `main` deploys automatically.

---

## Production URLs Checklist

After deployment, you should have:

- [ ] Backend API: `https://__________.railway.app`
- [ ] Admin Web: `https://__________.vercel.app`
- [ ] iOS Build: `https://expo.dev/builds/__________`
- [ ] Android Build: `https://expo.dev/builds/__________`
- [ ] Health Check: `https://__________.railway.app/health` returns 200
- [ ] Monitoring: Set up on Better Uptime
- [ ] Error Tracking: Sentry project created

---

## Common Issues & Solutions

### Backend won't start
```bash
# Check logs
railway logs

# Common fixes:
# 1. DATABASE_URL not set → railway add --plugin postgresql
# 2. JWT_SECRET not set → railway variables set JWT_SECRET="..."
# 3. Migrations failed → railway run npx prisma migrate deploy
```

### Mobile build fails
```bash
# Check build logs
eas build:list

# Common fixes:
# 1. Apple credentials invalid → eas credentials
# 2. Bundle ID mismatch → check app.json
# 3. Network timeout → retry: eas build --platform ios
```

### CORS errors in admin web
```bash
# Update Railway CORS settings
railway variables set FRONTEND_URL=https://your-actual-vercel-url.vercel.app

# Restart backend
railway up --detach
```

---

## Cost Calculator

### Minimum (Free/Low Cost - 0-100 users)
- Railway Free Tier: $0 (500 hours free/month)
- Vercel Free: $0
- Expo EAS: $0 (builds are free for open source/personal)
- **Total: $0/month** + $124 one-time (app store fees)

### Production (100-1000 users)
- Railway: $20/month
- Vercel: $0 (free tier sufficient)
- Expo: $0
- Monitoring: $0 (free tiers)
- **Total: ~$20/month**

### Scale (1000+ users)
- Railway/Cloud hosting: $50-200/month
- Database: $20-50/month
- Redis: $10-20/month
- Monitoring: $25-50/month
- CDN/Storage: $10-30/month
- **Total: ~$115-350/month**

---

## Next Steps After Deployment

1. **Set up backups**
   ```bash
   # Railway auto-backs up Postgres
   # But export a manual backup:
   railway run -- npx prisma db pull
   ```

2. **Configure custom domains** (optional)
   - Backend: Add custom domain in Railway dashboard
   - Admin: Add custom domain in Vercel dashboard
   - Update environment variables accordingly

3. **Set up email notifications** (future)
   - Sign up for SendGrid or Mailgun
   - Add SMTP credentials to Railway

4. **Enable push notifications** (future)
   - Get Expo push token
   - Implement server-side push logic

5. **Add analytics** (optional)
   - Google Analytics for web
   - PostHog or Mixpanel for mobile

---

## Support

- Railway: https://railway.app/help
- Expo: https://expo.dev/support
- Vercel: https://vercel.com/support
- App Store: https://developer.apple.com/contact/
- Play Store: https://support.google.com/googleplay/android-developer/

---

**You're done! 🎉** Your tournament management platform is now live in production.
