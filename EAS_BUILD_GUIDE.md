# EAS Build & Deployment Guide

Complete guide for building and deploying Genki TCG mobile app using Expo Application Services (EAS).

---

## Prerequisites

- [Expo account](https://expo.dev/) (free tier available)
- [EAS CLI](https://docs.expo.dev/build/setup/) installed
- Apple Developer Account ($99/year) for iOS
- Google Play Developer Account ($25 one-time) for Android
- Node.js >= 20.x installed

---

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

---

## Step 2: Login to Expo

```bash
eas login
```

Enter your Expo account credentials.

---

## Step 3: Configure EAS Project

### Link Project to Expo

```bash
cd apps/mobile
eas init
```

This creates/updates the `projectId` in `app.json`.

### Create EAS Configuration

Create `eas.json` in `apps/mobile`:

```json
{
  "cli": {
    "version": ">= 5.9.0"
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
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-production-api.up.railway.app",
        "EXPO_PUBLIC_SENTRY_DSN": "your-mobile-sentry-dsn",
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## Step 4: Configure iOS Credentials

### Option A: Let EAS Manage Credentials (Recommended)

EAS will automatically create and manage:
- Distribution Certificate
- Provisioning Profile
- Push Notification Key

```bash
eas build --platform ios --profile production
```

EAS will prompt you to create credentials automatically.

### Option B: Use Existing Credentials

If you have existing credentials:

```bash
eas credentials
```

Follow prompts to upload:
1. Distribution Certificate (.p12 file)
2. Provisioning Profile (.mobileprovision file)
3. Push Notification Key (.p8 file)

### Generate iOS Credentials Manually

#### 1. Distribution Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles → Certificates
3. Click "+" to create new certificate
4. Select "Apple Distribution"
5. Create CSR (Certificate Signing Request):
   ```bash
   openssl req -new -newkey rsa:2048 -nodes -keyout ios_distribution.key -out ios_distribution.csr
   ```
6. Upload CSR, download certificate (.cer)
7. Convert to .p12:
   ```bash
   openssl x509 -in ios_distribution.cer -inform DER -out ios_distribution.pem -outform PEM
   openssl pkcs12 -export -inkey ios_distribution.key -in ios_distribution.pem -out ios_distribution.p12
   ```

#### 2. App Identifier

1. Certificates, Identifiers & Profiles → Identifiers
2. Click "+" to register App ID
3. Bundle ID: `com.genkitcg.app`
4. Enable capabilities:
   - Push Notifications
   - Associated Domains (if using deep links)

#### 3. Provisioning Profile

1. Certificates, Identifiers & Profiles → Profiles
2. Click "+" to create new profile
3. Select "App Store"
4. Select your App ID
5. Select your Distribution Certificate
6. Name: "Genki TCG Production"
7. Download `.mobileprovision` file

#### 4. Push Notification Key

1. Certificates, Identifiers & Profiles → Keys
2. Click "+" to create new key
3. Enable "Apple Push Notifications service (APNs)"
4. Download `.p8` file
5. Note the Key ID

---

## Step 5: Configure Android Credentials

### Option A: Let EAS Manage Credentials (Recommended)

```bash
eas build --platform android --profile production
```

EAS will create and manage:
- Keystore
- Upload Key

### Option B: Use Existing Keystore

If you have an existing keystore:

```bash
eas credentials
```

Upload your:
- Keystore file (.jks or .keystore)
- Keystore password
- Key alias
- Key password

### Generate Android Keystore Manually

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore genki-tcg.keystore -alias genki-tcg -keyalg RSA -keysize 2048 -validity 10000
```

Enter keystore password and key information.

**⚠️ IMPORTANT:** Backup your keystore securely! If you lose it, you cannot update your app.

---

## Step 6: Build Production Apps

### Build iOS

```bash
cd apps/mobile
eas build --platform ios --profile production
```

This will:
1. Upload your code to EAS servers
2. Install dependencies
3. Run native build process
4. Sign with your credentials
5. Generate `.ipa` file

Build time: 15-30 minutes

### Build Android

```bash
eas build --platform android --profile production
```

This will:
1. Upload your code to EAS servers
2. Install dependencies
3. Run Gradle build
4. Sign with your keystore
5. Generate `.aab` (App Bundle) file

Build time: 10-20 minutes

### Build Both Platforms Simultaneously

```bash
eas build --platform all --profile production
```

---

## Step 7: Test Builds

### iOS Internal Testing

1. Download `.ipa` from EAS build page
2. Install via TestFlight:
   ```bash
   eas submit --platform ios --latest
   ```
3. Invite internal testers in App Store Connect

### Android Internal Testing

1. Download `.aab` from EAS build page
2. Upload to Google Play Console → Internal Testing
3. Share testing link with team

---

## Step 8: Submit to App Stores

### iOS Submission

```bash
eas submit --platform ios --latest
```

Or manually:
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Create new version
4. Upload build from EAS
5. Fill in metadata (use APP_STORE_METADATA.md)
6. Submit for review

**Review Time:** 1-3 days typically

### Android Submission

```bash
eas submit --platform android --latest
```

Or manually:
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Create new release in Production track
4. Upload `.aab` from EAS
5. Fill in metadata (use APP_STORE_METADATA.md)
6. Submit for review

**Review Time:** A few hours to 1-2 days

---

## Step 9: Over-The-Air (OTA) Updates

After app store approval, push updates without resubmission:

```bash
eas update --branch production --message "Bug fixes and improvements"
```

**When to use OTA:**
- Bug fixes
- Content updates
- Minor UI changes

**When NOT to use OTA:**
- Native code changes
- New permissions
- Major version updates

---

## Troubleshooting

### Build Fails

**Check build logs:**
```bash
eas build:list
```

Click on build ID to view detailed logs.

**Common issues:**
- Missing environment variables
- Outdated dependencies (`npm update`)
- TypeScript errors (`npm run type-check`)
- Invalid credentials

### iOS Review Rejection

Common reasons:
- Missing privacy policy
- Incomplete metadata
- Crashes during review
- Misleading screenshots

**Fix and resubmit:**
1. Address reviewer feedback
2. Increment build number in `app.json`
3. Build and submit again

### Android Review Rejection

Common reasons:
- Missing privacy policy
- Incomplete store listing
- Security issues
- Misleading content

**Fix and resubmit:**
1. Address policy violation
2. Update store listing
3. Create new release

---

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/eas-build.yml`:

```yaml
name: EAS Build
on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Install dependencies
        run: npm install
      - name: Build on EAS
        run: eas build --platform all --non-interactive --no-wait
```

---

## Cost Estimation

### EAS Build Credits
- **Free Tier:** Limited builds per month
- **Production Plan ($29/month):**
  - Unlimited builds
  - Faster build times
  - Priority support

### App Store Costs
- **Apple Developer:** $99/year (required for iOS)
- **Google Play:** $25 one-time (required for Android)

### Total Monthly Cost
- EAS: $0-29/month
- Apple: ~$8/month ($99/year)
- Google: ~$2 first year, then free
- **Total: $10-39/month**

---

## Best Practices

1. **Version Management**
   - Increment version for app store releases
   - Increment build number for each build
   - Use semantic versioning (X.Y.Z)

2. **Environment Variables**
   - Never commit secrets to git
   - Use different values for dev/staging/prod
   - Store in `eas.json` under build profiles

3. **Testing**
   - Test on physical devices before submission
   - Use TestFlight/Internal Testing for beta
   - Test OTA updates thoroughly

4. **Monitoring**
   - Enable Sentry for crash reporting
   - Monitor app store reviews
   - Check analytics regularly

5. **Documentation**
   - Keep credentials backed up securely
   - Document build process changes
   - Maintain changelog for releases

---

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

---

## Support

**Issues:**
- EAS Build: https://github.com/expo/eas-cli/issues
- Expo Forums: https://forums.expo.dev/

**Contact:**
- Email: support@yourdomain.com
- GitHub: https://github.com/yourusername/genki-tcg

---

**Last Updated:** December 2, 2025
**Next Review:** Before first production build
