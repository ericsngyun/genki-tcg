# Pre-Submission Checklist for App Store & Play Store

**Status:** ⚠️ INCOMPLETE - Follow this checklist before submitting to app stores
**Last Updated:** December 16, 2024

---

## ✅ Completed Items

These items have been fixed and are ready:

- [x] Privacy Policy created (`PRIVACY_POLICY.md` and `apps/admin-web/public/legal/privacy.html`)
- [x] Terms of Service created (`TERMS_OF_SERVICE.md` and `apps/admin-web/public/legal/terms.html`)
- [x] Settings.tsx updated with proper URLs (`https://genkitcg.com/privacy` and `https://genkitcg.com/terms`)
- [x] Push notification environment variable validation added
- [x] Admin gate password protection implemented
- [x] Backend security (IDOR, rate limiting, JWT, CORS) implemented

---

## 🚨 CRITICAL - Must Complete Before Submission

### 1. Mobile App Configuration (app.json)

**File:** `apps/mobile/app.json`

**Current Issues:**
```json
Line 46: "organization": "your-org-slug"    // ❌ PLACEHOLDER
Line 57: "projectId": "your-project-id"     // ❌ PLACEHOLDER
```

**Action Required:**
1. Get Sentry organization slug from https://sentry.io/settings/
2. Get Expo project ID from https://expo.dev
3. Update `apps/mobile/app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "@sentry/react-native/expo",
           {
             "organization": "genki-tcg",  // ← Replace with your Sentry org slug
             "project": "genki-tcg-mobile"
           }
         ]
       ],
       "extra": {
         "eas": {
           "projectId": "abc12345-1234-1234-1234-123456789abc"  // ← Replace with real project ID
         }
       }
     }
   }
   ```

---

### 2. EAS Build Configuration (eas.json)

**File:** `apps/mobile/eas.json`

**Current Issues:**
```json
Line 44: "appleId": "your-apple-id@email.com"                    // ❌ PLACEHOLDER
Line 45: "ascAppId": "REPLACE_WITH_APP_STORE_CONNECT_APP_ID"    // ❌ PLACEHOLDER
Line 46: "appleTeamId": "REPLACE_WITH_APPLE_TEAM_ID"            // ❌ PLACEHOLDER
```

**Action Required:**

#### For iOS:
1. Create app in App Store Connect: https://appstoreconnect.apple.com
2. Get your Apple ID email (iCloud account email)
3. Get App ID from App Store Connect → My Apps → [Your App] → App Information
4. Get Team ID from https://developer.apple.com/account → Membership Details

#### For Android:
1. Create app in Google Play Console: https://play.google.com/console
2. Create a service account: https://cloud.google.com/iam/docs/creating-managing-service-accounts
3. Download service account JSON file
4. Save as `apps/mobile/google-service-account.json`

#### Update eas.json:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your.real.email@gmail.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

### 3. Push Notifications Setup

**File:** `apps/mobile/.env`

**Current Issue:**
- EXPO_PUBLIC_PROJECT_ID not set

**Action Required:**
1. Go to https://expo.dev/accounts/[your-account]/projects
2. Select "genki-tcg" project (or create it)
3. Go to Settings
4. Copy the Project ID
5. Update `apps/mobile/.env`:
   ```bash
   EXPO_PUBLIC_PROJECT_ID=your-actual-project-id-here
   ```
6. Also add to `apps/mobile/eas.json` production env:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_PROJECT_ID": "your-actual-project-id-here"
         }
       }
     }
   }
   ```

---

### 4. Backend Production Secrets

**File:** Railway Environment Variables

**Current Issues:**
- JWT_SECRET using placeholder value
- REFRESH_TOKEN_SECRET using placeholder value
- DISCORD_CLIENT_SECRET not set for production

**Action Required:**

#### Step 1: Generate Secrets
```bash
# Run these commands in Git Bash or terminal:
openssl rand -base64 64
# Copy output → This is your JWT_SECRET

openssl rand -base64 64
# Copy output → This is your REFRESH_TOKEN_SECRET (MUST BE DIFFERENT!)
```

#### Step 2: Get Discord Credentials
1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to OAuth2 → General
4. Copy Client ID and Client Secret

#### Step 3: Set in Railway
1. Go to https://railway.app/dashboard
2. Select "genki-tcg-production" service
3. Click "Variables" tab
4. Add/Update:
   ```
   JWT_SECRET=<paste first generated secret>
   REFRESH_TOKEN_SECRET=<paste second generated secret>
   DISCORD_CLIENT_ID=<from Discord developer portal>
   DISCORD_CLIENT_SECRET=<from Discord developer portal>
   NODE_ENV=production
   ```

**⚠️ SECURITY WARNING:** Never commit these secrets to git!

---

### 5. Host Legal Documents

**Files:**
- `apps/admin-web/public/legal/privacy.html`
- `apps/admin-web/public/legal/terms.html`

**Current Status:** ✅ Created, but need hosting

**Action Required:**

#### Option A: Host on Admin Web (Recommended)
1. Deploy admin web to Vercel/Netlify
2. Legal docs will be available at:
   - https://admin.genkitcg.com/legal/privacy.html
   - https://admin.genkitcg.com/legal/terms.html
3. Update mobile app settings if domain differs from genkitcg.com

#### Option B: Create Dedicated Legal Pages
1. Create a simple static site (e.g., using GitHub Pages)
2. Host at https://genkitcg.com/privacy and https://genkitcg.com/terms
3. No changes needed to mobile app (already configured)

**Verify:**
- [ ] Privacy Policy is publicly accessible
- [ ] Terms of Service is publicly accessible
- [ ] URLs in mobile app settings.tsx match hosted URLs

---

### 6. App Store Assets

**Missing:**
- App screenshots
- App icon (1024x1024 for iOS)
- App icon (512x512 for Android)
- App description (short and long)
- Support URL
- Test account credentials

**Action Required:**

#### App Icons
- Create 1024x1024 PNG (no transparency) for iOS
- Create 512x512 PNG for Android
- Replace `apps/mobile/assets/icon.png`
- Run `eas build` to regenerate with new icon

#### Screenshots
Minimum required:
- iPhone 6.7" (Pro Max): 3 screenshots minimum
- iPhone 6.5" (Plus): 3 screenshots minimum
- iPad Pro 12.9": 2 screenshots (if supporting iPad)
- Android: 1080x1920 or similar

Recommended screens to capture:
1. Login screen
2. Events list
3. Event details with QR code
4. Live pairings
5. Live standings
6. Leaderboard
7. Profile with tier badge
8. Match details

#### App Description

**Short Description** (80 characters max):
```
Tournament management for TCG players and organizers
```

**Full Description** (4000 characters max) - See template in `APP_STORE_LAUNCH_READINESS.md` lines 503-538

#### Support Contact
- Email: support@genkitcg.com
- Website: https://genkitcg.com/support

#### Test Account
Create a test account for app reviewers:
- Email: reviewer@genkitcg.com
- Password: [Create secure password]
- Include test instructions

---

### 7. Database Reset

**⚠️ DO THIS LAST - Right before final submission**

**Why:** Your production database currently contains test data

**Action Required:**
1. Follow `DATABASE_RESET_PROCEDURE.md` step-by-step
2. Create backup first!
3. Delete and recreate PostgreSQL service in Railway
4. Verify migrations run automatically
5. Seed initial data: `POST /api/seed`
6. Verify: `GET /api/events` should return `{"data":[],"total":0}`

**Timing:** Do this AFTER all code is final and deployed

---

## 📝 Medium Priority

### 8. Admin Web Deployment

**Current Status:** Not deployed

**Action Required:**
1. Connect GitHub repo to Vercel
2. Set root directory: `apps/admin-web`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app`
4. Deploy
5. Update backend CORS_ORIGINS in Railway to include Vercel URL
6. Update DISCORD_ALLOWED_REDIRECTS to include Vercel URL

---

### 9. Missing Mobile Features

**Current Status:** Backend ready, UI missing

**Features:**
1. Match result reporting (6-8 hours)
2. Real-time WebSocket updates (6-8 hours)
3. Decklist submission (4-6 hours)
4. Push notifications wiring (4-6 hours)

**Total:** 20-28 hours of development

**Decision:** Decide if these are required for v1.0 launch or can be v1.1

---

### 10. Test Coverage

**Current:** 6.15% (very low)
**Target:** 70%+
**Estimated Work:** 27-36 hours

**Action Required:**
1. Start Docker: `docker-compose -f docker-compose.dev.yml up -d`
2. Run tests: `cd apps/backend && npm run test:cov`
3. Write missing tests for critical paths

---

## ✅ Final Pre-Submission Checklist

Run through this before submission:

### Configuration
- [ ] All placeholder values in `app.json` replaced
- [ ] All placeholder values in `eas.json` replaced
- [ ] EXPO_PUBLIC_PROJECT_ID set in .env and eas.json
- [ ] Production secrets generated and set in Railway
- [ ] Discord OAuth credentials set for production
- [ ] Privacy Policy and Terms publicly accessible
- [ ] URLs in app match hosted legal documents

### Assets
- [ ] App icon 1024x1024 (iOS)
- [ ] App icon 512x512 (Android)
- [ ] Minimum 8 screenshots prepared
- [ ] App description written (short + long)
- [ ] Support email/URL configured
- [ ] Test account created with instructions

### Backend
- [ ] All Railway environment variables set
- [ ] Database reset completed (LAST STEP!)
- [ ] Backend health check returns 200
- [ ] Discord OAuth login works
- [ ] API endpoints respond correctly

### Builds & Testing
- [ ] Build iOS: `eas build --platform ios --profile production`
- [ ] Build Android: `eas build --platform android --profile production`
- [ ] Test iOS build on physical device
- [ ] Test Android build on physical device
- [ ] All features work (login, events, pairings, standings)
- [ ] Push notifications work
- [ ] No crashes or critical bugs

### Submission
- [ ] Submit iOS: `eas submit --platform ios --profile production`
- [ ] Submit Android: `eas submit --platform android --profile production`
- [ ] Monitor submission status
- [ ] Respond to any reviewer feedback

---

## 🔗 Quick Reference Links

- **Expo Dashboard:** https://expo.dev
- **App Store Connect:** https://appstoreconnect.apple.com
- **Google Play Console:** https://play.google.com/console
- **Discord Developer Portal:** https://discord.com/developers/applications
- **Railway Dashboard:** https://railway.app/dashboard
- **Sentry:** https://sentry.io

---

## 📧 Support

If you get stuck on any step:
1. Check the detailed documentation in `APP_STORE_LAUNCH_READINESS.md`
2. Check `DATABASE_RESET_PROCEDURE.md` for database steps
3. Check `DEPLOYMENT_GUIDE.md` for deployment steps

---

**Estimated Time to Complete All Tasks:** 72-103 hours
**Recommended Timeline:** 4 weeks
**Target Launch:** Mid-January 2026

Good luck with your launch! 🚀
