# Day 5 & 6: Final Steps to App Store

This checklist provides step-by-step instructions to complete the final tasks before app submission.

---

## ✅ Pre-Flight Check

**Status of Days 1-4:**
- [✅] Code cleanup and quality
- [✅] Legal documents (Privacy Policy, Terms of Service)
- [✅] Settings screen implementation
- [✅] Production infrastructure
- [✅] Security and error handling

**Ready for:**
- [🟢] Day 5: App Store Assets
- [⚪] Day 6: Testing & Submission

---

## 📱 DAY 5: App Store Assets

### Task 1: Review App Icon ✅

**Status:** COMPLETED

The app icon has been reviewed:
- ✅ Located at `apps/mobile/assets/icon.png`
- ✅ Features distinctive ninja character with red circle
- ✅ Clean, recognizable design
- ✅ Works well at all sizes
- ✅ Proper contrast and branding

**No action needed** - icon is production-ready.

---

### Task 2: Verify All Asset Files

Run this command to check all required assets exist:

```bash
cd apps/mobile/assets
ls -la
```

**Required files:**
- [✅] `icon.png` - Main app icon (1024x1024)
- [✅] `adaptive-icon.png` - Android adaptive icon
- [✅] `splash.png` - Splash screen
- [✅] `favicon.png` - Web favicon
- [ ] Verify file sizes are correct

**Action:**
```bash
# Check icon dimensions
file assets/icon.png

# Should be 1024x1024 for iOS App Store requirements
```

---

### Task 3: Take App Screenshots

You need screenshots for both iOS and Android app store listings.

**Recommended screens to capture:**

1. **Home/Events Screen** - Show available tournaments
2. **Event Details** - Registration and event info
3. **Pairings Screen** - Live tournament pairings
4. **Standings** - Tournament standings
5. **Leaderboard** - Global rankings
6. **Profile/Stats** - User tournament history

**iOS Screenshot Requirements:**
- iPhone 6.7": 1290 x 2796 pixels (iPhone 14 Pro Max)
- iPhone 6.5": 1284 x 2778 pixels (iPhone 12 Pro Max)
- Minimum 3 screenshots, maximum 10

**Android Screenshot Requirements:**
- Phone: 1080 x 1920 pixels (16:9)
- Minimum 2 screenshots, maximum 8

**How to capture:**

1. **Run the app:**
   ```bash
   cd apps/mobile
   npx expo start
   ```

2. **iOS Simulator:**
   - Press `i` to open iOS simulator
   - Select iPhone 14 Pro Max or 15 Pro Max
   - Navigate to each screen
   - Press `Cmd + S` to save screenshot
   - Screenshots save to Desktop

3. **Android Emulator:**
   - Press `a` to open Android emulator
   - Navigate to each screen
   - Use emulator screenshot tool or `Cmd + S`

**Storage:**
- Create folder: `apps/mobile/store-assets/screenshots/`
- iOS: `apps/mobile/store-assets/screenshots/ios/`
- Android: `apps/mobile/store-assets/screenshots/android/`

**Action Items:**
- [ ] Create screenshots directory structure
- [ ] Capture 5-8 iOS screenshots
- [ ] Capture 5-8 Android screenshots
- [ ] Review screenshots for quality
- [ ] Ensure no test/fake data is visible

---

### Task 4: Configure Production Environment Variables

**Check current Railway deployment:**

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to backend and check status
cd apps/backend
railway status
```

**Get your production API URL:**
```bash
railway domain
```

This will output your backend URL, something like:
`https://genki-tcg-production.up.railway.app`

**Update eas.json with production URL:**

```bash
cd apps/mobile
```

Edit `eas.json` and update the production environment variables:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://YOUR-RAILWAY-URL.up.railway.app",
        "EXPO_PUBLIC_SENTRY_DSN": "your-mobile-sentry-dsn-if-configured",
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  }
}
```

**Action Items:**
- [ ] Install Railway CLI
- [ ] Get production backend URL
- [ ] Update `eas.json` with correct API URL
- [ ] Commit changes

---

### Task 5: Update App Store Metadata Placeholders

Review `APP_STORE_METADATA.md` and update any placeholder URLs:

**Items to update:**
- [ ] Support URL (currently uses GitHub issues)
- [ ] Privacy Policy URL (use your domain or GitHub Pages)
- [ ] Marketing URL (optional)
- [ ] Developer email

**Action:**
- Edit `APP_STORE_METADATA.md`
- Replace placeholder URLs with actual values
- Commit changes

---

### Task 6: Host Legal Documents Publicly

Apple and Google require publicly accessible Privacy Policy and Terms of Service URLs.

**Option A: GitHub Pages (Free, Easy)**

```bash
# In your repo root
# Legal docs are already at root level, perfect for GitHub Pages

# Enable GitHub Pages:
# 1. Go to GitHub repo settings
# 2. Pages section
# 3. Source: Deploy from branch "main"
# 4. Root directory
# 5. Save
```

Your documents will be available at:
- `https://yourusername.github.io/genki-tcg/PRIVACY_POLICY`
- `https://yourusername.github.io/genki-tcg/TERMS_OF_SERVICE`

**Option B: Your Own Domain**

Upload `PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` to:
- `https://yourdomain.com/privacy`
- `https://yourdomain.com/terms`

**Action Items:**
- [ ] Choose hosting method
- [ ] Host legal documents
- [ ] Verify URLs are publicly accessible
- [ ] Update URLs in `app.json` and `APP_STORE_METADATA.md`

---

## 🚀 DAY 6: Build & Submission

### Task 1: Install and Configure EAS CLI

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version

# Login to your Expo account (create one at https://expo.dev if needed)
eas login
```

**Action Items:**
- [ ] Install EAS CLI
- [ ] Create Expo account (if needed)
- [ ] Login to Expo

---

### Task 2: Initialize EAS Project

```bash
cd apps/mobile

# Initialize EAS (this will create/update projectId in app.json)
eas init

# Follow the prompts:
# - Select existing project or create new
# - Confirm project name "genki-tcg"
```

This updates `app.json` with your actual `projectId`.

**Action Items:**
- [ ] Run `eas init`
- [ ] Verify `app.json` now has valid `projectId`
- [ ] Commit the updated `app.json`

---

### Task 3: Configure iOS Credentials

**You'll need an Apple Developer account ($99/year).**

If you don't have one yet:
1. Go to https://developer.apple.com/
2. Enroll in Apple Developer Program
3. Wait for approval (usually 24-48 hours)

**Let EAS manage credentials (Recommended):**

```bash
eas build --platform ios --profile production
```

EAS will prompt you to:
- Login with your Apple ID
- Allow EAS to create certificates and provisioning profiles automatically

**Or manually configure:**
```bash
eas credentials
```

**Action Items:**
- [ ] Ensure Apple Developer account is active
- [ ] Run first iOS build (credentials will be created automatically)
- [ ] Save credentials backup

---

### Task 4: Configure Android Credentials

**You'll need a Google Play Developer account ($25 one-time).**

If you don't have one yet:
1. Go to https://play.google.com/console
2. Create developer account
3. Pay one-time $25 fee

**Let EAS manage keystore (Recommended):**

```bash
eas build --platform android --profile production
```

EAS will automatically create and manage your Android keystore.

**Action Items:**
- [ ] Ensure Google Play Developer account is active
- [ ] Run first Android build (keystore will be created automatically)
- [ ] Backup keystore credentials

---

### Task 5: Build Production Apps

**Build iOS:**
```bash
cd apps/mobile
eas build --platform ios --profile production
```

Build time: 15-30 minutes

**Build Android:**
```bash
eas build --platform android --profile production
```

Build time: 10-20 minutes

**Build both simultaneously:**
```bash
eas build --platform all --profile production
```

**Monitor builds:**
- Visit https://expo.dev/accounts/[your-account]/projects/genki-tcg/builds
- Or use: `eas build:list`

**Action Items:**
- [ ] Run production builds for both platforms
- [ ] Wait for builds to complete
- [ ] Download `.ipa` (iOS) and `.aab` (Android) files
- [ ] Test downloads to ensure they're not corrupted

---

### Task 6: Test Production Builds

**iOS Testing via TestFlight:**

```bash
# Submit to TestFlight for internal testing
eas submit --platform ios --latest
```

1. Go to App Store Connect (https://appstoreconnect.apple.com)
2. Select your app
3. TestFlight tab
4. Add internal testers (your email)
5. Install TestFlight app on iPhone
6. Accept invite and install build

**Android Testing via Internal Testing:**

```bash
# Submit to Google Play Internal Testing
eas submit --platform android --latest
```

1. Go to Google Play Console
2. Select your app
3. Internal Testing track
4. Create new release
5. Upload `.aab` file
6. Add internal testers
7. Share testing link

**Test checklist:**
- [ ] App installs successfully
- [ ] Login with Discord works
- [ ] Can view events
- [ ] Can view leaderboards
- [ ] Settings screen works
- [ ] Legal links open correctly
- [ ] Push notifications work (if implemented)
- [ ] No crashes during basic flow

**Action Items:**
- [ ] Submit to TestFlight
- [ ] Submit to Google Play Internal Testing
- [ ] Install and test on physical devices
- [ ] Fix any critical bugs found
- [ ] Rebuild if necessary

---

### Task 7: Prepare Store Listings

**iOS - App Store Connect:**

1. Go to https://appstoreconnect.apple.com
2. My Apps → Create New App
3. Fill in basic info:
   - Platform: iOS
   - Name: Genki TCG
   - Primary Language: English
   - Bundle ID: com.genkitcg.app
   - SKU: genki-tcg-001

4. App Information:
   - Use content from `APP_STORE_METADATA.md`
   - Upload screenshots
   - Add app description
   - Set keywords
   - Privacy Policy URL
   - Support URL

**Android - Google Play Console:**

1. Go to https://play.google.com/console
2. Create App
3. Fill in basic info:
   - App name: Genki TCG
   - Default language: English
   - App/Game: Game
   - Free/Paid: Free

4. Store Listing:
   - Use content from `APP_STORE_METADATA.md`
   - Upload screenshots
   - Upload feature graphic (1024x500)
   - Add app description
   - Privacy Policy URL
   - Support email

**Action Items:**
- [ ] Create iOS app in App Store Connect
- [ ] Fill in iOS metadata and screenshots
- [ ] Create Android app in Google Play Console
- [ ] Fill in Android metadata and screenshots
- [ ] Complete content rating questionnaire (both platforms)

---

### Task 8: Submit for Review

**iOS Submission:**

1. In App Store Connect:
   - Select your app
   - Version → + (Create new version)
   - Upload build from EAS
   - Complete all required fields
   - Save
   - Submit for Review

2. Review typically takes 1-3 days

**Android Submission:**

1. In Google Play Console:
   - Production track
   - Create new release
   - Upload `.aab` from EAS
   - Complete rollout
   - Review and rollout

2. Review typically takes a few hours to 1-2 days

**Action Items:**
- [ ] Submit iOS app for review
- [ ] Submit Android app for review
- [ ] Monitor review status daily
- [ ] Respond to any rejection feedback within 24 hours

---

## 📊 Quick Reference

### Required Accounts
- [✅] GitHub account (you have this)
- [ ] Expo account (free) - https://expo.dev
- [ ] Apple Developer ($99/year) - https://developer.apple.com
- [ ] Google Play Developer ($25 one-time) - https://play.google.com/console

### Required CLI Tools
```bash
npm install -g eas-cli          # For building apps
npm install -g @railway/cli     # For backend deployment
```

### Production URLs Needed
- [ ] Backend API URL (from Railway)
- [ ] Privacy Policy URL (GitHub Pages or your domain)
- [ ] Terms of Service URL (GitHub Pages or your domain)
- [ ] Support URL (GitHub Issues or your domain)

### Key Commands

**Start development:**
```bash
cd apps/mobile
npx expo start
```

**Build production:**
```bash
cd apps/mobile
eas build --platform all --profile production
```

**Submit to stores:**
```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

**Check build status:**
```bash
eas build:list
```

---

## 🆘 Troubleshooting

### Build fails with "Invalid credentials"
- Run `eas credentials` to reconfigure
- Verify Apple Developer account is active
- Regenerate certificates if needed

### "EXPO_PUBLIC_API_URL not set" error
- Check `eas.json` has correct production `env` variables
- Verify Railway backend is deployed and accessible

### Screenshots rejected
- Ensure no test data is visible
- Check dimensions match requirements exactly
- Remove any references to other platforms (e.g., don't show "Android" in iOS screenshots)

### App rejected for missing Privacy Policy
- Verify Privacy Policy URL is publicly accessible
- Check URL is correctly set in app.json and store listings
- Policy must be accessible without login

---

## ✅ Final Checklist

**Before Submission:**
- [ ] All builds complete successfully
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Legal documents hosted and accessible
- [ ] All placeholder URLs updated
- [ ] Screenshots captured and look professional
- [ ] Store listings complete
- [ ] Content ratings completed

**After Submission:**
- [ ] Monitor review status daily
- [ ] Check for rejection feedback
- [ ] Prepare to respond quickly to any issues
- [ ] Test live version after approval
- [ ] Monitor crash reports (Sentry)
- [ ] Check user reviews

---

## 🎉 Success!

Once both apps are approved:

1. **Announce the launch!**
   - Social media
   - Discord community
   - Email to beta testers

2. **Monitor and iterate:**
   - Watch crash reports in Sentry
   - Read user reviews
   - Plan updates based on feedback

3. **OTA Updates:**
   ```bash
   # Push updates without app store review
   eas update --branch production --message "Bug fixes"
   ```

**Congratulations on shipping to production!** 🚀

---

**Document Version:** 1.0
**Last Updated:** December 3, 2025
**Next Review:** After first submission
