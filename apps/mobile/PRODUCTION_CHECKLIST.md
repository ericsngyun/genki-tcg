# Genki TCG Mobile App - Production Readiness Checklist

## 📱 App Store Submission Checklist

### ✅ COMPLETED - Critical Fixes Applied

- [x] **Rating Numbers Hidden** - Users now only see rank position (#1, #2, etc.), not internal rating numbers
- [x] **Version Consistency** - All version numbers unified to 0.1.0 across app.json, login, and settings
- [x] **EAS Configuration** - Updated with environment variable placeholders instead of hardcoded values
- [x] **Settings URLs** - Updated placeholder URLs with appropriate alerts/email contacts
- [x] **Test Suite** - Created Jest configuration and initial test suites for critical functionality

---

## 🚨 CRITICAL - Must Complete Before Submission

### App Store Connect & Play Console Setup

- [ ] **Apple App Store Connect**
  - [ ] Create App Store Connect account
  - [ ] Set up app listing
  - [ ] Configure APPLE_ID environment variable
  - [ ] Configure ASC_APP_ID (App Store Connect App ID)
  - [ ] Configure APPLE_TEAM_ID

- [ ] **Google Play Console**
  - [ ] Create Google Play Console account
  - [ ] Set up app listing
  - [ ] Generate service account key
  - [ ] Save as `google-service-account.json`
  - [ ] Configure GOOGLE_SERVICE_ACCOUNT_KEY_PATH

### Legal Requirements

- [ ] **Privacy Policy**
  - [ ] Draft comprehensive privacy policy
  - [ ] Cover: data collection, storage, third-party services, user rights
  - [ ] Host on your website
  - [ ] Update settings.tsx with actual URL

- [ ] **Terms of Service**
  - [ ] Draft terms of service
  - [ ] Cover: acceptable use, disclaimers, liability limitations
  - [ ] Host on your website
  - [ ] Update settings.tsx with actual URL

### App Store Assets

- [ ] **iOS App Store**
  - [ ] App icon (1024x1024)
  - [ ] Screenshots for all device sizes:
    - iPhone 6.7" (1290 x 2796)
    - iPhone 6.5" (1284 x 2778)
    - iPhone 5.5" (1242 x 2208)
    - iPad Pro 12.9" (2048 x 2732)
  - [ ] App description (max 4000 characters)
  - [ ] Keywords (max 100 characters)
  - [ ] Promotional text (max 170 characters)
  - [ ] Support URL
  - [ ] Marketing URL (optional)

- [ ] **Android Play Store**
  - [ ] App icon (512x512)
  - [ ] Feature graphic (1024x500)
  - [ ] Screenshots for phone and tablet (2-8 images)
    - Phone: 320-3840px on short side
    - Tablet: 1800px on short side
  - [ ] Short description (max 80 characters)
  - [ ] Full description (max 4000 characters)
  - [ ] App category
  - [ ] Content rating questionnaire

### Security & Permissions

- [ ] **iOS Info.plist** - Add usage descriptions:
  ```xml
  <key>NSCameraUsageDescription</key>
  <string>We need camera access to scan QR codes for event check-in</string>
  <key>NSPhotoLibraryUsageDescription</key>
  <string>Select photos for your profile avatar</string>
  <key>NSNotificationsUsageDescription</key>
  <string>Receive tournament updates and match notifications</string>
  ```

- [ ] **Android Permissions** - Verify in AndroidManifest.xml:
  - INTERNET (already included)
  - CAMERA (if using QR scanning)
  - NOTIFICATIONS
  - ACCESS_NETWORK_STATE

### Testing

- [ ] **Expand Test Coverage** - Current: Basic unit tests only
  - [ ] Integration tests for API flows
  - [ ] Component tests for all screens
  - [ ] E2E tests for critical user journeys:
    - [ ] Login → Register for event → Check-in
    - [ ] Report match result → Confirm result
    - [ ] View standings → View pairings
  - [ ] Target: Minimum 70% code coverage

- [ ] **Device Testing**
  - [ ] iPhone SE (small screen)
  - [ ] iPhone 14 Pro (notch)
  - [ ] iPhone 14 Pro Max (large screen)
  - [ ] iPad (tablet layout)
  - [ ] Android phone (various manufacturers)
  - [ ] Android tablet

- [ ] **Network Conditions**
  - [ ] Test on slow 3G
  - [ ] Test offline handling
  - [ ] Test API timeout scenarios
  - [ ] Test token refresh during poor connection

---

## ⚠️ HIGH PRIORITY - Recommended Before Launch

### Monitoring & Analytics

- [ ] **Sentry** - Error tracking (already integrated, verify)
  - [ ] Confirm Sentry DSN is set
  - [ ] Test error reporting
  - [ ] Set up alerts for critical errors

- [ ] **Analytics** (Recommended: Mixpanel or Amplitude)
  - [ ] Track user registration
  - [ ] Track event registration
  - [ ] Track match reporting
  - [ ] Track screen views
  - [ ] Track errors and crashes

### Performance

- [ ] **Optimize Bundle Size**
  - [ ] Run `expo-doctor` for health check
  - [ ] Analyze bundle with `npx react-native-bundle-visualizer`
  - [ ] Remove unused dependencies
  - [ ] Enable Hermes engine (if not already)

- [ ] **Image Optimization**
  - [ ] Compress all assets
  - [ ] Use WebP format where possible
  - [ ] Implement lazy loading for game images

### User Experience

- [ ] **Error Boundary** - Catch and handle crashes gracefully
  ```tsx
  // Add to app/_layout.tsx
  import { ErrorBoundary } from 'react-error-boundary';
  ```

- [ ] **Loading States** - Ensure all async operations show loading
  - [x] Events list loading
  - [x] Profile loading
  - [x] Leaderboard loading
  - [ ] Match details loading

- [ ] **Empty States** - User-friendly messages when no data
  - [x] No events available
  - [x] No ratings yet
  - [ ] No matches played
  - [ ] No notifications

### Backend Coordination

- [ ] **API Versioning** - Ensure mobile app handles API version changes
  - [ ] Add version header to requests
  - [ ] Handle deprecated endpoints gracefully

- [ ] **Push Notification Testing**
  - [ ] Test on physical iOS device (doesn't work on simulator)
  - [ ] Test on physical Android device
  - [ ] Verify deep linking works (tap notification → open app to correct screen)

---

## 📝 MEDIUM PRIORITY - Post-Launch Enhancements

### Features to Consider

- [ ] **Biometric Authentication** - Face ID / Touch ID
- [ ] **Dark/Light Mode Toggle** - Currently dark only
- [ ] **Language Support** - Internationalization (i18n)
- [ ] **Offline Queue** - Queue actions when offline, sync when online
- [ ] **In-App Updates** - Prompt users to update when new version available
- [ ] **Rating Prompt** - Ask satisfied users to rate the app
- [ ] **Onboarding Tutorial** - First-time user walkthrough

### Code Quality

- [ ] **TypeScript Strict Mode** - Enable stricter type checking
- [ ] **ESLint Rules** - Enforce code style consistency
- [ ] **Accessibility** - Add accessibility labels for screen readers
- [ ] **Performance Profiling** - Use React DevTools Profiler
- [ ] **Code Splitting** - Lazy load screens to reduce initial bundle

---

## 🔒 SECURITY CHECKLIST

- [x] Tokens stored in secure storage (iOS Keychain, Android Keystore)
- [x] No hardcoded secrets in code
- [x] HTTPS enforced for all API calls
- [ ] **Certificate Pinning** (Recommended for production)
- [ ] **Code Obfuscation** (Recommended)
- [ ] **Root/Jailbreak Detection** (Optional, for high-security needs)
- [ ] **API Request Signing** (Optional, for sensitive operations)

---

## 📊 METRICS TO MONITOR POST-LAUNCH

### App Store Metrics
- [ ] Downloads per day
- [ ] Conversion rate (downloads → registrations)
- [ ] Daily/Weekly/Monthly active users
- [ ] Retention rate (Day 1, Day 7, Day 30)
- [ ] Session duration
- [ ] Crash-free rate (target: >99.5%)

### User Engagement
- [ ] Event registrations per user
- [ ] Match reports completed
- [ ] Notification open rate
- [ ] Leaderboard views
- [ ] Profile updates

### Technical Health
- [ ] API response times
- [ ] Failed API requests
- [ ] Socket connection stability
- [ ] Push notification delivery rate
- [ ] App size on device

---

## 🎯 LAUNCH READINESS GATE

**Before submitting to app stores, confirm ALL critical items are complete:**

### iOS App Store
1. ✅ All assets prepared and uploaded
2. ✅ Privacy policy and terms hosted and linked
3. ✅ Test flight beta testing completed (minimum 1 week)
4. ✅ App Store review guidelines compliance verified
5. ✅ APPLE_ID, ASC_APP_ID, APPLE_TEAM_ID configured

### Google Play Store
1. ✅ All assets prepared and uploaded
2. ✅ Privacy policy and terms hosted and linked
3. ✅ Internal testing track completed (minimum 14 days, 20 testers)
4. ✅ Content rating completed
5. ✅ Service account key configured

### Technical Validation
1. ✅ Test coverage >70%
2. ✅ No P0/P1 bugs in tracker
3. ✅ Performance benchmarks met (app launches <3s on mid-range device)
4. ✅ Sentry error tracking active and tested
5. ✅ Push notifications tested on physical devices

---

## 📞 SUPPORT READINESS

- [ ] Set up support email: support@genkitcg.com
- [ ] Set up bug report email: bugs@genkitcg.com
- [ ] Create FAQ document
- [ ] Prepare response templates for common issues
- [ ] Designate support team member for first week after launch

---

## 🚀 POST-SUBMISSION TASKS

### Immediately After Submission
- [ ] Monitor app review status daily
- [ ] Respond to any app review feedback within 24 hours
- [ ] Prepare press release / launch announcement
- [ ] Update website with app store links (when approved)

### First Week Post-Launch
- [ ] Monitor crash reports hourly
- [ ] Track user feedback in app stores
- [ ] Respond to all reviews (positive and negative)
- [ ] Fix critical bugs with hotfix release
- [ ] Celebrate launch with team! 🎉

---

**Last Updated**: 2025-12-18
**Version**: 0.1.0 (Alpha)
**Audited By**: Claude Code Assistant
