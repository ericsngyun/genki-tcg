# Step-by-Step Staging Deployment Guide

## Part 1: Backend to Railway

### Prerequisites
- [ ] GitHub account (to link Railway)
- [ ] Credit card (for Railway - they have free trial)
- [ ] Terminal access

---

## Step 1: Set Up Railway Account

### 1.1 Create Account
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

### 1.2 Install Railway CLI
```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Verify installation
railway --version
# Should show: railway version X.X.X
```

### 1.3 Login to Railway
```bash
# Login (will open browser)
railway login

# You should see:
# 🎉 Logged in as <your-email>
```

---

## Step 2: Create Railway Project

### 2.1 Navigate to Backend Directory
```bash
cd /home/user/genki-tcg/apps/backend
```

### 2.2 Initialize Railway Project
```bash
# Create new project
railway init

# You'll be prompted:
# ? Enter project name: genki-tcg-staging
# ? Select team: (choose your personal team or create one)

# Expected output:
# ✅ Project created: genki-tcg-staging
# 🎉 Created project genki-tcg-staging
```

**Alternative: Link Existing Project**
```bash
# If you already created a project in Railway dashboard:
railway link

# Select your project from the list
```

---

## Step 3: Add PostgreSQL Database

### 3.1 Add PostgreSQL Plugin

**Option A: Interactive Add (Recommended)**
```bash
# Opens interactive menu
railway add

# Use arrow keys to navigate
# Press SPACE to select PostgreSQL
# Press ENTER to confirm

# Expected output:
# ✅ Created PostgreSQL
```

**Option B: Dashboard (Easiest)**
```bash
# Open Railway dashboard
railway open

# Then in browser:
# 1. Click "+ New" → "Database" → "Add PostgreSQL"
# 2. Wait ~30 seconds for provisioning
```

**Option C: Direct Command (If Available)**
```bash
# Some versions support this
railway add --database postgres
```

### 3.2 Verify Database Added
```bash
# Check your services
railway status

# You should see:
# Project: genki-tcg-staging
# Environment: production
# Services:
#   - backend
#   - PostgreSQL
```

**What Railway Does Automatically:**
- ✅ Creates PostgreSQL database
- ✅ Sets DATABASE_URL environment variable
- ✅ Configures connection pooling
- ✅ Sets up automatic backups

---

## Step 4: Add Redis (Optional but Recommended)

### 4.1 Add Redis Plugin

**Option A: Interactive Add (Recommended)**
```bash
# Opens interactive menu
railway add

# Use arrow keys to navigate
# Press SPACE to select Redis
# Press ENTER to confirm

# Expected output:
# ✅ Created Redis
```

**Option B: Dashboard (Easiest)**
```bash
# Open Railway dashboard (if not already open)
railway open

# Then in browser:
# 1. Click "+ New" → "Database" → "Add Redis"
# 2. Wait ~30 seconds for provisioning
```

**Option C: Direct Command (If Available)**
```bash
# Some versions support this
railway add --database redis
```

### 4.2 Verify Redis Added
```bash
railway status

# You should see:
# Services:
#   - backend
#   - PostgreSQL
#   - Redis
```

**What Railway Does:**
- ✅ Creates Redis instance
- ✅ Sets REDIS_URL environment variable
- ✅ Configures for low latency

---

## Step 5: Set Environment Variables

### 5.1 Generate JWT Secret
```bash
# Generate secure random string
openssl rand -base64 64

# Copy the output - you'll need it!
# Example output: xK8vN9mP2qR... (very long string)
```

### 5.2 Set Required Variables
```bash
# Set JWT secret (paste your generated secret)
railway variables set JWT_SECRET="<paste-your-generated-secret-here>"

# Set other required variables
railway variables set NODE_ENV=production
railway variables set PORT=3000

# Set CORS origins (we'll update this after deploying admin)
railway variables set CORS_ORIGINS="http://localhost:3000,genki-tcg://"

# Verify variables are set
railway variables

# You should see:
# DATABASE_URL=postgresql://...  (auto-set by Railway)
# REDIS_URL=redis://...          (auto-set by Railway)
# JWT_SECRET=xK8vN9mP2qR...      (your secret)
# NODE_ENV=production
# PORT=3000
# CORS_ORIGINS=http://localhost:3000,genki-tcg://
```

### 5.3 Optional: Set Rate Limiting Variables
```bash
railway variables set THROTTLE_TTL=60
railway variables set THROTTLE_LIMIT=100
```

---

## Step 6: Deploy Backend

### 6.1 Ensure You're in Backend Directory
```bash
pwd
# Should show: /home/user/genki-tcg/apps/backend
```

### 6.2 Deploy to Railway
```bash
# Deploy current directory
railway up

# You'll see:
# 🚀 Building...
# 📦 Installing dependencies...
# 🔨 Running: npm install
# 🔨 Running: npx prisma generate
# 🔨 Running: npm run build
# 🚢 Deploying...
# ✅ Deployed successfully
#
# Deployment: https://genki-tcg-staging-production.up.railway.app
```

**This will take 3-5 minutes.** Railway will:
1. Upload your code
2. Install dependencies
3. Generate Prisma client
4. Build TypeScript
5. Run database migrations (via our railway.json config)
6. Start the server

### 6.3 Watch Build Logs (Optional)
```bash
# In another terminal, watch logs in real-time
railway logs

# You should see:
# [BUILD] Installing dependencies...
# [BUILD] Generating Prisma Client...
# [BUILD] Building TypeScript...
# [DEPLOY] Running migrations...
# [DEPLOY] Starting server...
# 🚀 Genki TCG API running on http://localhost:3000
# 📝 Environment: production
```

---

## Step 7: Get Your Backend URL

### 7.1 Generate Public Domain
```bash
# Create a public URL for your backend
railway domain

# You'll be prompted:
# ? Do you want to create a new domain? (Y/n) y

# Expected output:
# ✅ Domain created
# 🌐 https://genki-tcg-staging-production.up.railway.app
```

**Copy this URL!** You'll need it for:
- Admin web configuration
- Mobile app configuration
- Testing

### 7.2 Save Your Backend URL
```bash
# Create a file to remember your URLs
cat > /home/user/genki-tcg/DEPLOYMENT_URLS.md << 'EOF'
# Staging Deployment URLs

## Backend
URL: https://genki-tcg-staging-production.up.railway.app
Health: https://genki-tcg-staging-production.up.railway.app/health

## Admin Web
URL: (will add after deployment)

## Mobile
iOS Build: (will add after build)
Android Build: (will add after build)
EOF

# Edit this file with your actual URL
```

---

## Step 8: Verify Deployment

### 8.1 Test Health Endpoint
```bash
# Test the health endpoint
curl https://genki-tcg-staging-production.up.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2025-11-13T...",
#   "database": "connected",
#   "uptime": 123.456,
#   "memory": {
#     "used": 45,
#     "total": 512
#   }
# }
```

If you see `"status": "ok"` and `"database": "connected"` → **SUCCESS!** ✅

### 8.2 Test in Browser
Open in browser:
```
https://genki-tcg-staging-production.up.railway.app/health
```

You should see JSON response with status "ok".

### 8.3 Check Database Connection
The health endpoint already tests database. But if you want to verify manually:

```bash
# Connect to Railway Postgres (optional)
railway run psql $DATABASE_URL

# You'll be in PostgreSQL shell. Try:
# \dt  (list tables)
# \q   (quit)
```

You should see your tables (User, Event, Entry, etc.)

---

## Step 9: Run Database Migrations (If Needed)

Railway should auto-run migrations from our `railway.json` config. But if needed:

```bash
# Run migrations manually
railway run npx prisma migrate deploy

# Expected output:
# Applying migration 001_init
# Applying migration 002_add_credits
# ... etc
# ✅ All migrations applied
```

---

## Step 10: Seed Database (Optional)

If you want test data in staging:

```bash
# Run seed script
railway run npm run db:seed

# This creates:
# - Test organization
# - Test users (owner, staff, players)
# - Sample event
```

---

## Step 11: Update CORS for Production

Now update CORS to allow your Railway URL:

```bash
# Add your Railway backend URL to allowed origins
railway variables set CORS_ORIGINS="http://localhost:3000,https://genki-tcg-staging-production.up.railway.app,genki-tcg://"

# This will trigger automatic redeploy
# Watch it with: railway logs
```

---

## ✅ Backend Deployment Complete!

### What You Have Now:
- ✅ Backend running on Railway
- ✅ PostgreSQL database (managed)
- ✅ Redis cache (managed)
- ✅ Automatic HTTPS
- ✅ Health checks working
- ✅ Database migrations applied
- ✅ Environment variables configured

### Your Backend URL:
```
https://genki-tcg-staging-production.up.railway.app
```

### Test It:
```bash
# Health check
curl https://genki-tcg-staging-production.up.railway.app/health

# Should return: {"status":"ok","database":"connected",...}
```

---

## 🔧 Troubleshooting

### Issue: Build Failed
```bash
# Check logs
railway logs

# Common fixes:
# 1. Missing environment variable
railway variables set JWT_SECRET="your-secret"

# 2. Redeploy
railway up --detach
```

### Issue: Database Connection Failed
```bash
# Check DATABASE_URL is set
railway variables

# Verify DATABASE_URL exists
# If not, re-add PostgreSQL:
railway add --plugin postgresql
```

### Issue: Port Binding Error
Railway automatically uses PORT environment variable. Check:
```bash
# Make sure PORT is set to 3000
railway variables set PORT=3000
```

### Issue: Migration Failed
```bash
# Reset database (CAUTION: deletes all data)
railway run npx prisma migrate reset --force

# Then redeploy
railway up
```

### Issue: Can't Access URL
Check:
1. Did you run `railway domain`?
2. Is deployment successful? Check `railway status`
3. Check logs: `railway logs`

---

## 📊 Monitoring

### View Logs
```bash
# Live logs
railway logs

# Last 100 lines
railway logs --limit 100
```

### View Metrics (Railway Dashboard)
1. Go to https://railway.app
2. Select your project
3. Click "Metrics" tab
4. See:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request counts

### View Database
```bash
# Open Prisma Studio connected to Railway DB
railway run npx prisma studio

# Opens in browser: http://localhost:5555
# You can view/edit data directly
```

---

## 💰 Cost Estimate

Railway Free Trial:
- $5 credit (lasts ~1 month for staging)
- After trial: ~$20/month for staging

What's included:
- Backend hosting
- PostgreSQL database
- Redis cache
- Automatic deployments
- HTTPS/SSL
- Metrics & logs

---

## 🎯 Next: Deploy Admin Web to Vercel

Once your backend health check returns `"status": "ok"`, you're ready to deploy the admin web!

Continue to **Part 2: Admin Web Deployment** →

---
---

# Part 2: Admin Web to Vercel

## Prerequisites
- [ ] Backend deployed to Railway (from Part 1)
- [ ] Backend health check passing
- [ ] Backend URL saved (e.g., https://genki-tcg-staging-production.up.railway.app)

---

## Step 12: Set Up Vercel Account

### 12.1 Create Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your GitHub account

**What Vercel Provides:**
- ✅ Automatic deployments from Git
- ✅ Preview deployments for every commit
- ✅ Free SSL certificates (HTTPS)
- ✅ Global CDN
- ✅ Environment variables management
- ✅ Custom domains support

### 12.2 Install Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Verify installation
vercel --version
# Should show: Vercel CLI X.X.X
```

### 12.3 Login to Vercel
```bash
# Login (will open browser)
vercel login

# You should see:
# > Success! GitHub authentication complete
```

---

## Step 13: Prepare Admin Web for Deployment

### 13.1 Navigate to Admin Web Directory
```bash
cd /home/user/genki-tcg/apps/admin-web

# Verify you're in the right place
ls -la
# Should see: next.config.js, package.json, src/, public/
```

### 13.2 Check Environment Configuration
```bash
# View current environment setup
cat .env.local 2>/dev/null || echo "No .env.local file (that's okay)"

# For Vercel, we'll set environment variables through the CLI
# instead of using .env.local
```

---

## Step 14: Configure Environment Variables

### 14.1 Set Your Backend URL
**Important:** Replace `<YOUR-RAILWAY-URL>` with your actual Railway backend URL from Part 1.

```bash
# Set the backend API URL (CRITICAL - use your Railway URL!)
# Example: https://genki-tcg-staging-production.up.railway.app
vercel env add NEXT_PUBLIC_API_URL

# You'll be prompted:
# ? What's the value of NEXT_PUBLIC_API_URL?
# Paste your Railway URL here (no trailing slash)

# ? Add NEXT_PUBLIC_API_URL to which Environments?
# Select: Production, Preview, Development (use spacebar to select all)
```

**Example:**
```
? What's the value of NEXT_PUBLIC_API_URL?
> https://genki-tcg-staging-production.up.railway.app

? Add NEXT_PUBLIC_API_URL to which Environments?
  ◉ Production
  ◉ Preview
  ◉ Development
```

### 14.2 Verify Environment Variables
```bash
# List all environment variables
vercel env ls

# You should see:
# Environment Variables
# ┌─────────────────────────┬──────────────┬─────────────┬─────────────┬─────────┐
# │ Name                    │ Development  │ Preview     │ Production  │ Created │
# ├─────────────────────────┼──────────────┼─────────────┼─────────────┼─────────┤
# │ NEXT_PUBLIC_API_URL     │ Set          │ Set         │ Set         │ Just now│
# └─────────────────────────┴──────────────┴─────────────┴─────────────┴─────────┘
```

---

## Step 15: Deploy to Vercel

### 15.1 Ensure You're in Admin Web Directory
```bash
pwd
# Should show: /home/user/genki-tcg/apps/admin-web
```

### 15.2 Initial Deployment
```bash
# Deploy to Vercel (first time)
vercel

# You'll be prompted with several questions:
```

**Question 1: Set up and deploy?**
```
? Set up and deploy "~/genki-tcg/apps/admin-web"? (Y/n)
> Y
```

**Question 2: Which scope?**
```
? Which scope do you want to deploy to?
> <Your Vercel Username> (or select your team)
```

**Question 3: Link to existing project?**
```
? Link to existing project? (y/N)
> N
```

**Question 4: Project name?**
```
? What's your project's name?
> genki-tcg-admin-staging
```

**Question 5: Directory location?**
```
? In which directory is your code located?
> ./
```

**Vercel will detect Next.js automatically:**
```
Auto-detected Project Settings (Next.js):
- Build Command: next build
- Output Directory: .next
- Development Command: next dev
```

**Question 6: Override settings?**
```
? Want to override the settings? (y/N)
> N
```

**Deployment Process:**
```
🔍  Inspect: https://vercel.com/your-user/genki-tcg-admin-staging/xxxxx
✅  Preview: https://genki-tcg-admin-staging-xxxxx.vercel.app
📝  Deployed to production. Run `vercel --prod` to overwrite later.
```

**This will take 1-2 minutes.** Vercel will:
1. Upload your code
2. Install dependencies
3. Build Next.js application
4. Deploy to global CDN
5. Generate preview URL

### 15.3 Save Your Admin URL
**Copy the Preview URL!** You'll need it for testing.

```bash
# Update your deployment URLs file
cat >> /home/user/genki-tcg/DEPLOYMENT_URLS.md << 'EOF'

## Admin Web
URL: https://genki-tcg-admin-staging-xxxxx.vercel.app
Status: Deployed to Vercel

EOF

# Replace xxxxx with your actual URL
```

---

## Step 16: Update Backend CORS

### 16.1 Add Vercel URL to Backend CORS
Now that you have your Vercel URL, add it to your backend's allowed origins:

```bash
# Navigate back to backend directory
cd /home/user/genki-tcg/apps/backend

# Get your current CORS origins
railway variables

# Update CORS_ORIGINS to include your Vercel URL
# Replace <YOUR-VERCEL-URL> with your actual Vercel URL
railway variables set CORS_ORIGINS="http://localhost:3000,https://<YOUR-VERCEL-URL>,https://*.vercel.app,genki-tcg://"

# Example:
# railway variables set CORS_ORIGINS="http://localhost:3000,https://genki-tcg-admin-staging-xxxxx.vercel.app,https://*.vercel.app,genki-tcg://"
```

**Note:** Including `https://*.vercel.app` allows all Vercel preview deployments.

### 16.2 Watch Backend Redeploy
```bash
# Railway will automatically redeploy with new CORS settings
# Watch the logs to confirm
railway logs

# Wait for:
# [DEPLOY] Starting server...
# 🚀 Genki TCG API running on http://localhost:3000
# 🌍 CORS origins: http://localhost:3000, https://genki-tcg-admin-staging-xxxxx.vercel.app, https://*.vercel.app, genki-tcg://
```

---

## Step 17: Verify Admin Web Deployment

### 17.1 Test in Browser
1. Open your Vercel URL in browser:
   ```
   https://genki-tcg-admin-staging-xxxxx.vercel.app
   ```

2. You should see the login page

3. Try logging in with test credentials (if you seeded the database)

**Expected Behavior:**
- ✅ Login page loads
- ✅ No CORS errors in console (F12 → Console)
- ✅ Can submit login form
- ✅ Network requests go to Railway backend

### 17.2 Check Browser Console
```
Press F12 → Console tab

You should NOT see:
❌ "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
❌ "Failed to fetch"
❌ "Network request failed"

You should see:
✅ No CORS errors
✅ API requests completing successfully
✅ No 403 Forbidden errors
```

### 17.3 Test Authentication Flow
```bash
# Test signup (if you haven't seeded the database)
1. Go to signup page
2. Enter email, name, password
3. Enter your organization's invite code
4. Submit
5. Should redirect to dashboard

# Test login
1. Go to login page
2. Enter credentials
3. Should redirect to dashboard
4. Should see your organization's data
```

---

## Step 18: Configure Production Domain (Optional)

### 18.1 Add Custom Domain (Optional)
If you own a domain, you can add it:

```bash
# Add custom domain
vercel domains add admin.yourdomain.com

# Vercel will provide DNS records to configure
# Example:
# Add these records to your DNS provider:
# Type: CNAME
# Name: admin
# Value: cname.vercel-dns.com
```

For staging, the Vercel-provided URL (*.vercel.app) is sufficient.

---

## Step 19: Set Up Automatic Deployments (Optional)

### 19.1 Connect to GitHub
If you want automatic deployments on every push:

1. Go to https://vercel.com/dashboard
2. Select your project: `genki-tcg-admin-staging`
3. Click "Settings" → "Git"
4. Click "Connect Git Repository"
5. Select your GitHub repository
6. Select branch: `claude/genki-tcg-architecture-011CV4dSmBPdRvPHLPvEA9cv` (or your staging branch)
7. Click "Connect"

**Now:**
- Every push to your branch → automatic preview deployment
- You can promote previews to production

---

## ✅ Admin Web Deployment Complete!

### What You Have Now:
- ✅ Admin web running on Vercel
- ✅ Connected to Railway backend
- ✅ Automatic HTTPS
- ✅ Global CDN distribution
- ✅ Environment variables configured
- ✅ CORS properly configured
- ✅ Authentication working

### Your Admin URL:
```
https://genki-tcg-admin-staging-xxxxx.vercel.app
```

### Test It:
1. Open admin URL in browser
2. Login with test credentials
3. Create a test event
4. Verify data shows up in backend database

---

## 🔧 Troubleshooting

### Issue: CORS Errors in Browser Console
```bash
# Check backend CORS settings
cd /home/user/genki-tcg/apps/backend
railway variables

# Verify CORS_ORIGINS includes your Vercel URL
# If not, add it:
railway variables set CORS_ORIGINS="http://localhost:3000,https://your-vercel-url.vercel.app,https://*.vercel.app,genki-tcg://"

# Wait for backend to redeploy (watch logs)
railway logs
```

### Issue: "Failed to fetch" Errors
**Problem:** Admin can't connect to backend

**Check:**
1. Is backend URL correct?
   ```bash
   # Check environment variable
   vercel env ls

   # Should show NEXT_PUBLIC_API_URL with your Railway URL
   ```

2. Is backend running?
   ```bash
   # Test backend health
   curl https://genki-tcg-staging-production.up.railway.app/health

   # Should return: {"status":"ok"}
   ```

3. Update environment variable if wrong:
   ```bash
   # Remove old value
   vercel env rm NEXT_PUBLIC_API_URL

   # Add correct value
   vercel env add NEXT_PUBLIC_API_URL
   # Enter your Railway URL

   # Redeploy
   vercel --prod
   ```

### Issue: Build Failed
```bash
# Check build logs
vercel logs

# Common fixes:
# 1. TypeScript errors
cd /home/user/genki-tcg/apps/admin-web
npm run build  # Test build locally

# 2. Missing dependencies
npm install

# 3. Redeploy
vercel --force
```

### Issue: Environment Variables Not Working
```bash
# Verify env vars are set for all environments
vercel env ls

# If missing, add them:
vercel env add NEXT_PUBLIC_API_URL
# Select: Production, Preview, Development

# Redeploy to apply
vercel --prod
```

### Issue: 404 on Routes
**Problem:** Next.js pages not found

**Solution:**
```bash
# Ensure you're deploying from the correct directory
cd /home/user/genki-tcg/apps/admin-web
pwd  # Should show: /home/user/genki-tcg/apps/admin-web

# Redeploy
vercel --force
```

---

## 📊 Testing Checklist

Before moving to mobile deployment, verify:

- [ ] Admin web loads in browser
- [ ] No CORS errors in console
- [ ] Can login with test credentials
- [ ] Can create a new event
- [ ] Can view events list
- [ ] Backend API calls work (check Network tab)
- [ ] Authentication persists on refresh
- [ ] Can logout and login again

---

## 💰 Cost Estimate

Vercel Free Plan (Hobby):
- Unlimited deployments
- Automatic HTTPS
- 100GB bandwidth/month
- Preview deployments
- **Cost:** $0/month

Vercel Pro (if needed later):
- $20/month per member
- Unlimited bandwidth
- Team collaboration
- Analytics

For staging: **Free plan is sufficient** ✅

---

## 🎯 Next: Deploy Mobile Apps

Once your admin web can successfully communicate with the backend, you're ready to build mobile preview apps!

Continue to **Part 3: Mobile Apps Deployment** →

---
---

# Part 3: Mobile Apps to Expo EAS

## Prerequisites
- [ ] Backend deployed to Railway (from Part 1)
- [ ] Admin web deployed to Vercel (from Part 2)
- [ ] Backend URL saved
- [ ] Apple Developer account (for iOS builds) - $99/year
- [ ] Google Play Console account (for Android builds) - $25 one-time

**Note:** You can build preview apps without publishing to app stores first!

---

## Step 20: Set Up Expo Account

### 20.1 Create Expo Account
1. Go to https://expo.dev
2. Click "Sign Up"
3. Sign up with GitHub (recommended) or email
4. Verify your email

**What Expo Provides:**
- ✅ Cloud build service (EAS Build)
- ✅ Over-the-air updates (EAS Update)
- ✅ Push notifications
- ✅ App submission service (EAS Submit)
- ✅ Development builds
- ✅ Free tier: 30 builds/month

### 20.2 Install EAS CLI
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
# Should show: eas-cli/X.X.X

# Login to Expo
eas login

# You'll be prompted:
# ? Email or username: <your-expo-email>
# ? Password: <your-password>
#
# ✅ Logged in as <your-username>
```

### 20.3 Verify Login
```bash
# Check who you're logged in as
eas whoami

# Should show: <your-expo-username>
```

---

## Step 21: Configure Mobile App

### 21.1 Navigate to Mobile Directory
```bash
cd /home/user/genki-tcg/apps/mobile

# Verify you're in the right place
ls -la
# Should see: app.json, package.json, App.tsx, app/, assets/
```

### 21.2 Check Current Configuration
```bash
# View current app.json
cat app.json | grep -A5 "expo"

# View current EAS configuration (if exists)
cat eas.json 2>/dev/null || echo "eas.json doesn't exist yet (we'll create it)"
```

---

## Step 22: Initialize EAS

### 22.1 Configure EAS Build
```bash
# Initialize EAS (this creates eas.json if it doesn't exist)
eas build:configure

# You'll be prompted:
# ? Select a platform: › - Use arrow-keys. Return to submit.
# ❯ iOS
#   Android
#   All
# Select: All (press space to select both, then Enter)
```

This creates `eas.json`:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 22.2 Update EAS Configuration for Staging
Let's add environment-specific configurations:

```bash
# Update eas.json with staging profile
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3001"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://genki-tcg-staging-production.up.railway.app"
      }
    },
    "staging": {
      "extends": "preview",
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://genki-tcg-staging-production.up.railway.app"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-production-backend.up.railway.app"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

# IMPORTANT: Replace the Railway URL with your actual backend URL!
```

---

## Step 23: Update App Configuration

### 23.1 Check app.json
```bash
# View current app.json
cat app.json
```

### 23.2 Ensure app.json Has Required Fields
Your `app.json` should have:
- `expo.name` - App display name
- `expo.slug` - URL-safe name
- `expo.version` - App version (e.g., "1.0.0")
- `expo.ios.bundleIdentifier` - iOS bundle ID (e.g., "com.genki.tcg")
- `expo.android.package` - Android package name (e.g., "com.genki.tcg")

**Example app.json:**
```json
{
  "expo": {
    "name": "Genki TCG",
    "slug": "genki-tcg",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.genki.tcg",
      "supportsTablet": true
    },
    "android": {
      "package": "com.genki.tcg",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-will-be-added-automatically"
      }
    }
  }
}
```

---

## Step 24: Build iOS Preview App

### 24.1 Build for iOS (Preview/Staging)
```bash
# Ensure you're in mobile directory
cd /home/user/genki-tcg/apps/mobile

# Build iOS preview
eas build --platform ios --profile preview

# You'll be prompted:
```

**Question 1: Generate a new Apple provisioning profile?**
```
? Would you like to automatically create an iOS provisioning profile? (Y/n)
> Y
```

**Question 2: Apple ID**
```
? What is your Apple ID?
> your-apple-id@email.com

# You'll need to authenticate with your Apple Developer account
```

**Build Process:**
```
✔ Build credentials
✔ Project uploaded to EAS
✔ Build started

Build details: https://expo.dev/accounts/<your-account>/projects/genki-tcg/builds/<build-id>

⠋ Building iOS app...

This will take 10-15 minutes ⏱️
```

**What Happens:**
1. Code uploaded to Expo servers
2. Dependencies installed
3. iOS app compiled
4. Code signed with your Apple Developer certificate
5. IPA file generated

### 24.2 Wait for iOS Build
You can:
- **Option A:** Wait in terminal (shows progress)
- **Option B:** Visit the build URL and monitor in browser
- **Option C:** Close terminal and check later with `eas build:list`

### 24.3 Download iOS Build
```bash
# Once build completes, you'll see:
# ✅ Build finished
# 📱 Install: https://expo.dev/artifacts/eas/<artifact-id>

# Save this URL! You can install directly from it.
```

---

## Step 25: Build Android Preview App

### 25.1 Build for Android (Preview/Staging)
```bash
# Build Android preview
eas build --platform android --profile preview

# You'll be prompted:
```

**Question: Generate a new Android keystore?**
```
? Would you like to automatically create a new keystore? (Y/n)
> Y

✅ Keystore generated and stored securely by EAS
```

**Build Process:**
```
✔ Build credentials
✔ Project uploaded to EAS
✔ Build started

Build details: https://expo.dev/accounts/<your-account>/projects/genki-tcg/builds/<build-id>

⠋ Building Android app...

This will take 10-15 minutes ⏱️
```

### 25.2 Wait for Android Build
Similar to iOS, you can monitor progress in terminal or browser.

### 25.3 Download Android Build
```bash
# Once build completes:
# ✅ Build finished
# 📱 Install: https://expo.dev/artifacts/eas/<artifact-id>

# This is an APK file you can install directly on Android devices
```

---

## Step 26: Install Preview Builds

### 26.1 iOS Installation (TestFlight Optional)

**Option A: Direct Install (Internal Testing)**
1. Open the install URL on your iPhone
   ```
   https://expo.dev/artifacts/eas/<artifact-id>
   ```
2. Tap "Install"
3. Approve the profile installation
4. App installs directly to your device

**Option B: TestFlight (Recommended for Multiple Testers)**
```bash
# Submit to TestFlight
eas submit --platform ios --profile preview

# You'll need:
# - Apple Developer account
# - App Store Connect app created
# - Follow the prompts
```

### 26.2 Android Installation

**Option A: Direct APK Install**
1. Open the install URL on your Android device
   ```
   https://expo.dev/artifacts/eas/<artifact-id>
   ```
2. Download the APK
3. Allow installation from unknown sources (if prompted)
4. Install the APK

**Option B: Google Play Internal Testing**
```bash
# Submit to Google Play Internal Testing
eas submit --platform android --profile preview

# You'll need:
# - Google Play Console account
# - App created in Play Console
# - Follow the prompts
```

---

## Step 27: Test Mobile Apps

### 27.1 Update DEPLOYMENT_URLS.md
```bash
# Add mobile app URLs
cat >> /home/user/genki-tcg/DEPLOYMENT_URLS.md << 'EOF'

## Mobile Apps

### iOS Preview
Build URL: https://expo.dev/artifacts/eas/<ios-artifact-id>
Install: Open URL on iPhone, tap "Install"

### Android Preview
Build URL: https://expo.dev/artifacts/eas/<android-artifact-id>
Install: Download APK and install

### Testing Credentials
Email: (add test email)
Password: (add test password)
Org Code: (add test org invite code)

EOF
```

### 27.2 Test Mobile App Flow
On your device:

1. **Open the app**
   - Launch Genki TCG from home screen

2. **Test authentication**
   - Tap "Sign Up" or "Login"
   - Enter credentials
   - Should connect to Railway backend

3. **Test event creation (owner/staff)**
   - Navigate to events
   - Create a new event
   - Verify it appears

4. **Test event registration (player)**
   - Browse events
   - Register for an event
   - Mark as paid (if staff)
   - Check in

5. **Test real-time features**
   - Open app on two devices
   - Make changes on one
   - Verify updates on the other (via WebSocket)

### 27.3 Check Network Requests
Use a network debugging tool to verify:
- ✅ API requests go to Railway backend
- ✅ Authentication works
- ✅ CORS is properly configured
- ✅ WebSocket connections establish

---

## Step 28: Manage Builds

### 28.1 View All Builds
```bash
# List all builds
eas build:list

# You'll see:
# ┌──────────────┬──────────┬───────────┬──────────────┬──────────────┐
# │ Build ID     │ Platform │ Profile   │ Status       │ Created      │
# ├──────────────┼──────────┼───────────┼──────────────┼──────────────┤
# │ abc123...    │ iOS      │ preview   │ FINISHED     │ 2 hours ago  │
# │ def456...    │ Android  │ preview   │ FINISHED     │ 1 hour ago   │
# └──────────────┴──────────┴───────────┴──────────────┴──────────────┘
```

### 28.2 View Build Details
```bash
# View specific build
eas build:view <build-id>

# Or visit in browser:
# https://expo.dev/accounts/<your-account>/projects/genki-tcg/builds
```

### 28.3 Cancel a Build
```bash
# If a build is taking too long or you made a mistake
eas build:cancel <build-id>
```

---

## ✅ Mobile Apps Deployment Complete!

### What You Have Now:
- ✅ iOS preview app (IPA)
- ✅ Android preview app (APK)
- ✅ Apps connected to Railway backend
- ✅ Apps configured for staging environment
- ✅ Can install on physical devices
- ✅ Ready for internal testing

### Your Mobile App URLs:
```
iOS: https://expo.dev/artifacts/eas/<ios-artifact-id>
Android: https://expo.dev/artifacts/eas/<android-artifact-id>
```

### Test Them:
1. Install on your device
2. Open the app
3. Sign up or login
4. Test full tournament workflow
5. Verify real-time features work

---

## 🔧 Troubleshooting

### Issue: Build Failed - iOS Code Signing
```bash
# Check build logs
eas build:view <build-id>

# Common fix: Regenerate credentials
eas credentials --platform ios

# Select: "Remove provisioning profile"
# Then rebuild:
eas build --platform ios --profile preview --clear-cache
```

### Issue: Build Failed - Android Keystore
```bash
# Check credentials
eas credentials --platform android

# If needed, generate new keystore:
# Select: "Remove keystore"
# Then rebuild:
eas build --platform android --profile preview --clear-cache
```

### Issue: App Can't Connect to Backend
**Problem:** Network requests failing

**Check:**
1. Is backend URL correct in eas.json?
   ```bash
   cat eas.json | grep EXPO_PUBLIC_API_URL
   ```

2. Is backend running?
   ```bash
   curl https://genki-tcg-staging-production.up.railway.app/health
   ```

3. Is CORS configured for mobile?
   ```bash
   # Check backend CORS includes "genki-tcg://"
   cd /home/user/genki-tcg/apps/backend
   railway variables | grep CORS_ORIGINS
   ```

4. Rebuild with correct URL:
   ```bash
   # Update eas.json with correct URL
   # Then rebuild
   eas build --platform all --profile preview
   ```

### Issue: "Unable to Install" on iOS
**Problem:** Can't install IPA on device

**Solutions:**
1. **Device not registered:**
   ```bash
   # Register device
   eas device:create

   # Follow prompts to add device UDID
   # Then rebuild
   ```

2. **Provisioning profile expired:**
   ```bash
   # Regenerate profile
   eas credentials --platform ios
   # Remove and regenerate provisioning profile
   # Rebuild
   ```

3. **Use TestFlight instead:**
   ```bash
   eas submit --platform ios
   # Submit to TestFlight for easier distribution
   ```

### Issue: "App Not Installed" on Android
**Problem:** APK won't install

**Solutions:**
1. **Enable unknown sources:**
   - Settings → Security → Unknown sources → Enable

2. **Uninstall old version:**
   - If you have an old version installed, uninstall it first

3. **Download again:**
   - Sometimes download corrupts, try downloading APK again

### Issue: Build Takes Too Long
**Normal build times:**
- iOS: 10-20 minutes
- Android: 10-15 minutes

**If stuck longer:**
```bash
# Cancel and retry with cache clear
eas build:cancel <build-id>
eas build --platform <ios|android> --profile preview --clear-cache
```

---

## 📊 Testing Checklist

Before moving to production, verify:

### Backend Connection
- [ ] App connects to Railway backend
- [ ] API requests succeed (check logs)
- [ ] CORS configured correctly
- [ ] Authentication works

### Core Features
- [ ] User signup works
- [ ] User login works
- [ ] Can create events (owner/staff)
- [ ] Can register for events (players)
- [ ] Can check in to events
- [ ] Can view standings
- [ ] Push notifications work (if implemented)

### Real-Time Features
- [ ] WebSocket connections establish
- [ ] Live updates appear
- [ ] Timer updates work
- [ ] Pairings update in real-time

### Cross-Platform
- [ ] iOS app works
- [ ] Android app works
- [ ] Both platforms use same backend
- [ ] Data syncs between platforms

---

## 💰 Cost Estimate

### Expo EAS (Build Service)

**Free Plan:**
- 30 builds/month
- Unlimited updates
- Basic support
- **Cost:** $0/month

**Production Plan:**
- Unlimited builds
- Priority support
- Team collaboration
- **Cost:** $29/month (only needed if you exceed 30 builds)

### Apple Developer

**Required for iOS:**
- App Store submission
- TestFlight distribution
- **Cost:** $99/year

### Google Play Console

**Required for Android:**
- Play Store submission
- Internal testing
- **Cost:** $25 one-time

### Total Staging Cost:
- **Expo:** $0/month (free tier sufficient)
- **Apple:** $99/year (required for iOS)
- **Google:** $25 one-time (required for Android)

**First Year Total:** $124 (for app store accounts only)

---

## 🎯 Next Steps After Preview

### Option 1: Beta Testing (Recommended)
```
1. Share install URLs with 5-10 beta testers
2. Collect feedback for 1-2 weeks
3. Fix critical bugs
4. Rebuild if needed
5. Move to production
```

### Option 2: Submit to App Stores
```
1. Test thoroughly in preview
2. Update version to 1.0.0
3. Build production builds:
   eas build --platform all --profile production
4. Submit to app stores:
   eas submit --platform ios
   eas submit --platform android
5. Wait for review (1-7 days)
6. Launch! 🚀
```

### Option 3: Over-the-Air Updates
```
# Make small changes without rebuilding
eas update --branch preview --message "Fix login bug"

# Users get updates automatically next time they open app
# No need to rebuild or resubmit to app stores!
```

---

## 📱 Distribution Options Summary

### Internal Testing (Current)
- ✅ Direct install via URL
- ✅ No app store approval needed
- ✅ Fast iteration
- ❌ Limited to registered devices (iOS)
- ❌ Manual distribution

### TestFlight (iOS) / Internal Testing (Android)
- ✅ Easy distribution to testers
- ✅ Automatic updates
- ✅ Feedback collection
- ✅ No app store approval for TestFlight
- ❌ TestFlight: max 10,000 testers
- ❌ Internal Testing: manual APK distribution

### App Store / Play Store (Production)
- ✅ Public distribution
- ✅ Automatic updates
- ✅ Professional credibility
- ✅ Payment processing (if needed)
- ❌ Requires approval (1-7 days)
- ❌ Must follow store guidelines
- ❌ $99/year (Apple) + $25 one-time (Google)

---

## ✅ STAGING DEPLOYMENT COMPLETE!

**Congratulations!** 🎉 You now have a fully functional staging environment:

### What You've Deployed:

**Backend (Railway):**
- ✅ NestJS API running
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Automatic HTTPS
- ✅ Health checks
- URL: https://genki-tcg-staging-production.up.railway.app

**Admin Web (Vercel):**
- ✅ Next.js admin panel
- ✅ Connected to backend
- ✅ Automatic HTTPS
- ✅ Global CDN
- URL: https://genki-tcg-admin-staging-xxxxx.vercel.app

**Mobile Apps (Expo EAS):**
- ✅ iOS preview app
- ✅ Android preview app
- ✅ Connected to backend
- ✅ Push notifications ready
- URLs: https://expo.dev/artifacts/eas/<artifact-id>

### Total Staging Cost:
- **Monthly:** $0 (all free tiers)
- **One-time:** $124 (app store accounts)

### Ready For:
- ✅ Internal testing
- ✅ Beta testing with real users
- ✅ Tournament dry runs
- ✅ User feedback collection
- ✅ Performance testing

### Next Steps:
1. **Test Everything:** Run full tournament workflow
2. **Invite Beta Testers:** 5-10 tournament organizers
3. **Collect Feedback:** 1-2 weeks of real usage
4. **Fix Issues:** Address bugs and UX problems
5. **Deploy to Production:** When ready!

---

## 📚 Deployment Resources

### Documentation
- `DEPLOYMENT_QUICKSTART.md` - Quick reference guide
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `CURRENT_STATUS_AND_PRIORITIES.md` - Project status
- `BACKEND_ARCHITECTURE.md` - Technical architecture

### URLs to Save
```bash
# Create a quick reference file
cat > /home/user/genki-tcg/STAGING_URLS.txt << 'EOF'
STAGING ENVIRONMENT URLS

Backend (Railway):
- API: https://genki-tcg-staging-production.up.railway.app
- Health: https://genki-tcg-staging-production.up.railway.app/health
- Dashboard: https://railway.app

Admin Web (Vercel):
- URL: https://genki-tcg-admin-staging-xxxxx.vercel.app
- Dashboard: https://vercel.com/dashboard

Mobile Apps (Expo EAS):
- iOS Install: https://expo.dev/artifacts/eas/<ios-artifact-id>
- Android Install: https://expo.dev/artifacts/eas/<android-artifact-id>
- Dashboard: https://expo.dev

Monitoring:
- Railway Logs: railway logs
- Vercel Logs: vercel logs
- Expo Builds: eas build:list

Commands:
- Backend Deploy: railway up
- Admin Deploy: vercel
- Mobile iOS Build: eas build --platform ios --profile preview
- Mobile Android Build: eas build --platform android --profile preview
EOF

# Replace xxxxx and artifact-ids with your actual values
```

---

## 🚀 You're Ready to Test!

**Your staging environment is live.** Start testing with real users and gather feedback.

**When you're ready for production**, follow the same steps but use production profiles and production backend URL.

**Questions?** Check the troubleshooting sections or deployment documentation.

**Good luck with your launch!** 🎉
