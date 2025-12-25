# Genki TCG - Deployment Playbook

**Owner:** Engineering Team
**Last Updated:** December 20, 2025
**Version:** 1.0

> **Purpose:** This is your single source of truth for deploying updates to production. Follow these procedures exactly to ensure safe, reliable deployments.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Mobile App Updates](#mobile-app-updates)
3. [Backend Updates](#backend-updates)
4. [Admin Web Updates](#admin-web-updates)
5. [Version Management](#version-management)
6. [Pre-Deployment Checklist](#pre-deployment-checklist)
7. [Rollback Procedures](#rollback-procedures)
8. [Emergency Procedures](#emergency-procedures)
9. [Common Scenarios](#common-scenarios)

---

## Quick Reference

### Decision Tree: Which Deployment Type?

```
Is this a MOBILE change?
├─ YES → Does it change native code or require new permissions?
│   ├─ YES → [MOBILE: Full Build & Submit] (1-7 days)
│   └─ NO → [MOBILE: OTA Update] (minutes)
│
├─ Is this a BACKEND change?
│   └─ YES → [BACKEND: Railway Deploy] (5-10 minutes)
│
└─ Is this an ADMIN WEB change?
    └─ YES → [ADMIN: Vercel Deploy] (2-5 minutes)
```

### Deployment Speed Reference

| Component | Type | Time to Production | App Store Review |
|-----------|------|-------------------|------------------|
| Mobile (OTA) | JavaScript only | **2-5 minutes** | ✅ No |
| Mobile (Full) | Native code/permissions | **1-7 days** | ⏳ Yes |
| Backend | API changes | **5-10 minutes** | ✅ No |
| Admin Web | Frontend changes | **2-5 minutes** | ✅ No |

---

## Mobile App Updates

### TYPE 1: OTA Update (Over-The-Air) ⚡

**Use when:**
- Bug fixes in JavaScript code
- UI/UX improvements
- New screens or features (JS only)
- API endpoint changes
- Text/content updates
- Styling changes
- Business logic updates

**DO NOT use for:**
- ❌ Native code changes
- ❌ New permissions
- ❌ SDK upgrades
- ❌ New native modules

#### Procedure: OTA Update

**Location:** `/Users/ericyun/code-stuff/genki-tcg/apps/mobile`

```bash
# 1. Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# 2. Test locally first
cd apps/mobile
npx expo start
# Press 'i' for iOS simulator
# Test your changes thoroughly

# 3. Publish OTA update
npx eas-cli update --branch production --message "Brief description of changes"

# Example messages:
# "Fixed event registration bug"
# "Updated leaderboard sorting logic"
# "Improved tournament details UI"
```

**Timeline:**
- Deploy: ~2 minutes
- Users receive: Next app restart (usually within 24 hours)

**Verification:**
```bash
# Check update status
npx eas-cli update:list --branch production

# View which users have received update
# Go to: https://expo.dev/accounts/genki-group/projects/genki/updates
```

**What happens:**
1. Update is built and published to Expo CDN
2. Users open app
3. App checks for updates
4. Downloads new JS bundle in background
5. Update applies on next app restart
6. Old version still works during download

---

### TYPE 2: Full Build & App Store Submission 📦

**Use when:**
- Upgrading Expo SDK (e.g., 54 → 55)
- Adding new native modules/packages
- Requesting new iOS permissions
- Changing app icon or bundle ID
- Major version releases
- Native code modifications
- Every 2-4 weeks (to keep builds fresh)

#### Procedure: Full Build & Submit

**Location:** `/Users/ericyun/code-stuff/genki-tcg/apps/mobile`

```bash
# STEP 1: Update version number
# Edit apps/mobile/app.json
```

**Update version in `app.json`:**
```json
{
  "expo": {
    "version": "1.1.0"  // Increment: 1.0.0 → 1.1.0
  }
}
```

**Version increment rules:**
- Patch (1.0.0 → 1.0.1): Bug fixes only
- Minor (1.0.0 → 1.1.0): New features, backward compatible
- Major (1.0.0 → 2.0.0): Breaking changes or major overhaul

```bash
# STEP 2: Commit version change
git add apps/mobile/app.json
git commit -m "chore(mobile): bump version to 1.1.0"
git push origin main

# STEP 3: Build for iOS
cd apps/mobile
npx eas-cli build --platform ios --profile production

# Wait ~15-20 minutes for build to complete
# You'll get a URL to track progress

# STEP 4: Submit to App Store Connect
npx eas-cli submit --platform ios --latest

# This uploads to App Store Connect automatically
# Wait ~10-15 minutes for processing

# STEP 5: Update App Store Connect metadata (if needed)
# Go to: https://appstoreconnect.apple.com
# Navigate to: Your App → Version
# Update "What's New" section with release notes
# Click "Submit for Review"
```

**Timeline:**
- Build: 15-20 minutes
- Submit: 10-15 minutes
- App Store review: 1-7 days (typically 24-48 hours)
- **Total:** 1-7 days

**Release Notes Template:**

```markdown
What's New in Version 1.1.0:

🐛 Bug Fixes
• Fixed event registration error
• Improved tournament standings accuracy

✨ New Features
• Added tournament history view
• Enhanced leaderboard filtering

⚡ Improvements
• Faster app loading
• Smoother animations
```

**Verification After Approval:**
```bash
# 1. Download from App Store on test device
# 2. Verify version number in Settings
# 3. Test critical flows:
#    - Login
#    - Event registration
#    - Leaderboard viewing
#    - Push notifications
```

---

## Backend Updates

**Deployment:** Automatic via Railway on `git push`

**Location:** `/Users/ericyun/code-stuff/genki-tcg/apps/backend`

### Procedure: Backend Deploy

```bash
# STEP 1: Make your changes locally
cd apps/backend

# STEP 2: Test locally
npm run dev

# Test your changes thoroughly:
# - API endpoints work
# - Database queries correct
# - No breaking changes

# STEP 3: Run tests
npm run test
npm run test:cov

# Ensure all tests pass
# Coverage should be >70%

# STEP 4: Commit and push
git add .
git commit -m "feat(backend): add new tournament feature"
git push origin main

# STEP 5: Monitor Railway deployment
# Go to: https://railway.app/dashboard
# Select: Genki TCG Backend
# Click: Deployments
# Wait for "Success" status (~5-10 minutes)

# STEP 6: Verify deployment
curl https://api.genkitcg.app/health
# Should return: {"status":"ok","database":"connected"}

# Test critical endpoints:
curl https://api.genkitcg.app/api/events
curl https://api.genkitcg.app/api/leaderboard
```

**Breaking Changes Checklist:**

If your backend change is breaking (changes API contract):

- [ ] Version the API endpoint (e.g., `/api/v2/events`)
- [ ] Keep old endpoint working for 30 days minimum
- [ ] Update mobile app to use new endpoint
- [ ] Deploy mobile OTA update or full build
- [ ] Monitor usage of old endpoint
- [ ] Deprecate old endpoint after 30 days

**Database Migrations:**

```bash
# Railway runs migrations automatically on deploy
# Migrations are in: apps/backend/prisma/migrations

# To create a new migration:
npx prisma migrate dev --name descriptive_name

# This creates migration file and updates schema
# Commit the migration file:
git add prisma/migrations
git commit -m "feat(db): add tournament_type column"
git push origin main
```

**Timeline:**
- Deploy: 5-10 minutes
- Available: Immediately after deploy succeeds

**Rollback:** See [Rollback Procedures](#rollback-procedures)

---

## Admin Web Updates

**Deployment:** Automatic via Vercel on `git push`

**Location:** `/Users/ericyun/code-stuff/genki-tcg/apps/admin-web`

### Procedure: Admin Web Deploy

```bash
# STEP 1: Make your changes locally
cd apps/admin-web

# STEP 2: Test locally
npm run dev
# Open: http://localhost:3000
# Test your changes thoroughly

# STEP 3: Build to verify no errors
npm run build
# Should complete without errors

# STEP 4: Commit and push
git add .
git commit -m "feat(admin): add new tournament management feature"
git push origin main

# STEP 5: Monitor Vercel deployment
# Go to: https://vercel.com/dashboard
# Or check: https://admin.genkitcg.app
# Wait ~2-5 minutes for deployment

# STEP 6: Verify deployment
# Open: https://admin.genkitcg.app
# Test critical flows:
#   - Login
#   - Create event
#   - Manage tournament
#   - View reports
```

**Timeline:**
- Deploy: 2-5 minutes
- Available: Immediately after deploy succeeds

**Rollback:** See [Rollback Procedures](#rollback-procedures)

---

## Version Management

### Mobile App Versioning

**Format:** `MAJOR.MINOR.PATCH` (Semantic Versioning)

**In `apps/mobile/app.json`:**
```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"  // Auto-incremented by EAS
    },
    "android": {
      "versionCode": 1   // Auto-incremented by EAS
    }
  }
}
```

**When to increment:**

| Change Type | Version | Example | Requires Store Submit |
|-------------|---------|---------|----------------------|
| Bug fix (OTA) | Patch | 1.0.0 → 1.0.1 | Optional |
| New feature (OTA) | Minor | 1.0.0 → 1.1.0 | Recommended |
| Native code change | Minor/Major | 1.0.0 → 1.1.0 | **Required** |
| Breaking changes | Major | 1.0.0 → 2.0.0 | **Required** |

**Build Number:**
- Auto-incremented by EAS on each build
- Don't manually change this
- Used internally by iOS/Android

### Backend Versioning

**In `apps/backend/package.json`:**
```json
{
  "version": "0.1.3"
}
```

**API Versioning:**
- Keep API backward compatible when possible
- For breaking changes, version the endpoint: `/api/v2/...`
- Document breaking changes in CHANGELOG.md

### Changelog Maintenance

**File:** `/CHANGELOG.md` (create if doesn't exist)

**Format:**
```markdown
# Changelog

## [1.1.0] - 2025-12-20

### Added
- Tournament history view in mobile app
- New leaderboard filtering options

### Fixed
- Event registration error on iOS
- Standings calculation bug

### Changed
- Improved tournament details UI
- Updated Discord OAuth flow

## [1.0.0] - 2025-12-15

### Added
- Initial release
- Tournament management
- Leaderboards and rankings
- Credits system
```

**Update this file** before every major release.

---

## Pre-Deployment Checklist

### Before ANY Deployment

- [ ] Code reviewed (if working with team)
- [ ] Tests passing locally
- [ ] No console errors or warnings
- [ ] Tested on development environment
- [ ] Environment variables correct for production
- [ ] No hardcoded development URLs or credentials

### Before Mobile OTA Update

- [ ] Changes are JavaScript only (no native code)
- [ ] Tested on iOS simulator
- [ ] No new permissions required
- [ ] API endpoints are compatible
- [ ] No breaking changes
- [ ] Update message is descriptive

### Before Mobile Full Build & Submit

- [ ] Version number incremented in `app.json`
- [ ] Release notes prepared
- [ ] Screenshots updated (if UI changed significantly)
- [ ] Tested on physical device via TestFlight
- [ ] Privacy policy updated (if data collection changed)
- [ ] All new features fully tested

### Before Backend Deploy

- [ ] All tests passing (`npm run test`)
- [ ] Database migrations tested locally
- [ ] Breaking changes documented
- [ ] API versioned (if breaking)
- [ ] Environment variables set in Railway
- [ ] Rollback plan ready

### Before Admin Web Deploy

- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript errors resolved
- [ ] Tested all changed pages
- [ ] API endpoints compatible
- [ ] Mobile app compatible (if API changed)

---

## Rollback Procedures

### Mobile App Rollback

#### OTA Update Rollback

```bash
# List recent updates
npx eas-cli update:list --branch production

# Rollback to previous update
npx eas-cli update:republish --group <update-group-id>

# Or publish a specific previous update
npx eas-cli update:republish --update-id <previous-update-id>
```

**Note:** Users will get the rollback on next app restart.

#### App Store Build Rollback

**Cannot rollback an App Store version once live.**

**Options:**
1. **Hotfix:** Build and submit a new version immediately (fastest: use OTA if possible)
2. **Remove from sale:** Temporarily remove app from App Store (drastic)

**Prevention is key:** Always test thoroughly before submitting.

### Backend Rollback

**Via Railway Dashboard:**

1. Go to: https://railway.app/dashboard
2. Select: Genki TCG Backend
3. Click: Deployments
4. Find previous successful deployment
5. Click: "..." → "Redeploy"
6. Confirm rollback

**Via Git:**

```bash
# Find the commit to rollback to
git log --oneline

# Revert to specific commit
git revert <commit-hash>
git push origin main

# Or hard reset (use with caution)
git reset --hard <commit-hash>
git push --force origin main
```

**Database Migration Rollback:**

```bash
# If migration caused issues
cd apps/backend

# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Then push a new migration to fix
npx prisma migrate dev --name fix_migration_issue
git add prisma/migrations
git commit -m "fix(db): rollback problematic migration"
git push origin main
```

### Admin Web Rollback

**Via Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Select: Genki TCG Admin
3. Click: Deployments
4. Find previous successful deployment
5. Click: "..." → "Promote to Production"
6. Confirm rollback

**Timeline:** ~1-2 minutes

---

## Emergency Procedures

### Critical Bug in Production

**Priority:** P0 (Fix immediately)

```bash
# STEP 1: Assess impact
# - How many users affected?
# - Is data at risk?
# - Can users still use core features?

# STEP 2: Quick fix

# For Mobile (if JS bug):
# Fix code → Push OTA update (5 minutes)
cd apps/mobile
# Fix the bug
npx eas-cli update --branch production --message "HOTFIX: Critical bug fix"

# For Backend:
# Fix code → Push to Railway (10 minutes)
cd apps/backend
# Fix the bug
git add .
git commit -m "hotfix: critical production bug"
git push origin main
# Monitor Railway deployment

# For Admin Web:
# Fix code → Push to Vercel (5 minutes)
cd apps/admin-web
# Fix the bug
git add .
git commit -m "hotfix: critical admin bug"
git push origin main
# Monitor Vercel deployment

# STEP 3: Verify fix in production

# STEP 4: Communicate
# - Update status page (if you have one)
# - Notify users via push notification (if needed)
# - Post-mortem: Document what happened and how to prevent
```

### Database Corruption or Data Loss

**Priority:** P0 (Restore immediately)

```bash
# STEP 1: Stop writes (if needed)
# Go to Railway → Backend → Settings
# Temporarily set DATABASE_URL to read-only replica (if configured)

# STEP 2: Restore from backup
# Railway → PostgreSQL → Backups
# Click most recent backup
# Click "Restore"

# STEP 3: Verify data integrity
# Run queries to check data
# Test critical flows

# STEP 4: Resume writes
# Restore DATABASE_URL to primary database

# STEP 5: Post-mortem
# Document what caused the issue
# Implement prevention measures
```

### API Rate Limit Exceeded

```bash
# STEP 1: Check Railway metrics
# Railway → Backend → Metrics
# Identify spike in requests

# STEP 2: Temporary mitigation
# Increase rate limits in code if legitimate traffic:
# apps/backend/src/app.module.ts
# Update ThrottlerModule settings

# STEP 3: Block malicious IPs (if attack)
# Add IP blocking middleware
# Or use Railway's edge network rules

# STEP 4: Scale up (if needed)
# Railway → Backend → Settings → Scale Plan
```

---

## Common Scenarios

### Scenario 1: Fixed a Bug in Mobile App

**Bug:** Event registration fails on iOS

**Solution:**

```bash
# Option A: OTA Update (if JS bug) - 5 minutes
cd apps/mobile
# Fix the bug in code
npx eas-cli update --branch production --message "Fix event registration bug"

# Option B: Full Build (if native bug) - 1-7 days
# Increment version in app.json
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
# Submit for review
```

**Choose:** Option A whenever possible (much faster)

---

### Scenario 2: Added New Feature to Mobile App

**Feature:** Tournament history view (JavaScript only)

**Solution:**

```bash
# Option A: OTA Update - Users get it in minutes
cd apps/mobile
# Implement feature
npx eas-cli update --branch production --message "Add tournament history view"

# Option B: Full Build - Users get it in 1-7 days
# Use this if you want to coordinate with App Store release
# Increment version to 1.1.0
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```

**Recommendation:** Use OTA for quick rollout, Full Build every 2-4 weeks for major releases

---

### Scenario 3: API Endpoint Changed

**Change:** Updated `/api/events` response format

**Solution:**

```bash
# STEP 1: Make endpoint backward compatible
# Add new fields but keep old ones
# Example:
# Old: { "name": "..." }
# New: { "name": "...", "displayName": "..." }

# STEP 2: Deploy backend
cd apps/backend
git add .
git commit -m "feat(api): add displayName field to events"
git push origin main

# STEP 3: Update mobile app to use new field
cd apps/mobile
# Update code to use displayName
npx eas-cli update --branch production --message "Use new displayName field"

# STEP 4: After 30 days, deprecate old field
# Remove old "name" field from API
# All users should have updated by then
```

---

### Scenario 4: Database Schema Change

**Change:** Add new column to Events table

**Solution:**

```bash
cd apps/backend

# STEP 1: Create migration
npx prisma migrate dev --name add_tournament_type

# This creates migration file and updates schema

# STEP 2: Test migration locally
npm run test

# STEP 3: Commit and push
git add prisma/migrations prisma/schema.prisma
git commit -m "feat(db): add tournament_type column to events"
git push origin main

# Railway will run migration automatically on deploy

# STEP 4: Verify in production
# Railway → Logs
# Look for: "✅ Database migrations completed"
```

---

### Scenario 5: Urgent Security Patch

**Issue:** Security vulnerability discovered

**Solution:**

```bash
# IMMEDIATE ACTION

# For Mobile (if applicable):
cd apps/mobile
# Apply security patch
npx eas-cli update --branch production --message "SECURITY: Apply critical patch"
# Deploys in 5 minutes

# For Backend:
cd apps/backend
# Apply security patch
git add .
git commit -m "security: apply critical security patch"
git push origin main
# Deploys in 10 minutes

# For Admin Web:
cd apps/admin-web
# Apply security patch
git add .
git commit -m "security: apply critical security patch"
git push origin main
# Deploys in 5 minutes

# FOLLOW-UP
# 1. Notify users if data was compromised
# 2. Force password reset if needed
# 3. Document incident
# 4. Implement monitoring to prevent future issues
```

---

## Testing Strategy

### Mobile Testing

**Before OTA Update:**
```bash
# Run on simulator
npx expo start
# Press 'i' for iOS

# Test checklist:
# - App launches successfully
# - Navigation works
# - API calls succeed
# - Changed features work
# - No console errors
```

**Before Full Build:**
```bash
# Test on physical device via TestFlight
# Install from TestFlight
# Run through entire app
# Test on different iOS versions if possible
```

### Backend Testing

```bash
cd apps/backend

# Run unit tests
npm run test

# Run with coverage
npm run test:cov
# Ensure coverage >70%

# Test API endpoints manually
curl -X POST https://api.genkitcg.app/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event"}'
```

### Integration Testing

**Test full flow:**
1. Create event in admin web
2. View event in mobile app
3. Register for event in mobile app
4. Verify in backend logs
5. Check in database

---

## Monitoring & Observability

### What to Monitor

**Mobile App:**
- Crash rate (should be <1%)
- OTA update adoption (70%+ within 24 hours)
- API error rate
- User engagement metrics

**Backend:**
- Response time (should be <200ms p95)
- Error rate (should be <0.1%)
- Database connection pool usage
- Memory usage

**Admin Web:**
- Page load time
- JavaScript errors
- API call failures

### Where to Monitor

**Mobile:**
- Expo dashboard: https://expo.dev
- App Store Connect: https://appstoreconnect.apple.com

**Backend:**
- Railway dashboard: https://railway.app/dashboard
- Sentry (when configured): https://sentry.io

**Admin Web:**
- Vercel dashboard: https://vercel.com/dashboard

---

## Deployment Schedule Recommendations

### Recommended Cadence

**Mobile:**
- **OTA Updates:** As needed (multiple times per week)
- **Full Builds:** Every 2-4 weeks
- **Major Versions:** Every 2-3 months

**Backend:**
- **Updates:** Daily to weekly
- **Major Changes:** Every 2-4 weeks
- **Breaking Changes:** Coordinated with mobile releases

**Admin Web:**
- **Updates:** Daily to weekly
- **As needed:** No restrictions

### Best Times to Deploy

**Avoid:**
- ❌ Friday afternoons (can't fix issues over weekend)
- ❌ Right before holidays
- ❌ During major events or tournaments
- ❌ Late at night (unless emergency)

**Prefer:**
- ✅ Tuesday-Thursday mornings
- ✅ When team is available to monitor
- ✅ After thorough testing
- ✅ During low-traffic periods

---

## Communication

### User Communication

**For major updates:**
- Push notification: "New features available!"
- In-app message on first launch
- Social media announcement (if applicable)

**For breaking changes:**
- Email to all users (if you have emails)
- In-app modal explaining changes
- Grace period for old version

**For outages:**
- Status page update
- Push notification if >30 min outage
- Follow-up when resolved

### Team Communication

**Before deploy:**
- Notify team in Slack/Discord
- Share what's being deployed
- Expected impact and timeline

**After deploy:**
- Confirm deployment success
- Share metrics/results
- Note any issues

---

## Key Contacts & Resources

### Services

| Service | Purpose | URL | Credentials |
|---------|---------|-----|-------------|
| Railway | Backend hosting | https://railway.app | yunseric@gmail.com |
| Vercel | Admin web hosting | https://vercel.com | yunseric@gmail.com |
| Expo | Mobile builds | https://expo.dev | yunseric@gmail.com |
| App Store Connect | iOS distribution | https://appstoreconnect.apple.com | yunseric@gmail.com |
| GitHub | Code repository | https://github.com | - |

### Documentation

- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Update: https://docs.expo.dev/eas-update/introduction/
- Railway Docs: https://docs.railway.app/
- Vercel Docs: https://vercel.com/docs

---

## Appendix: Command Reference

### Mobile Commands

```bash
# OTA update
npx eas-cli update --branch production --message "..."

# Build for iOS
npx eas-cli build --platform ios --profile production

# Submit to App Store
npx eas-cli submit --platform ios --latest

# List updates
npx eas-cli update:list --branch production

# List builds
npx eas-cli build:list

# Check build status
npx eas-cli build:view <build-id>
```

### Backend Commands

```bash
# Run locally
npm run dev

# Run tests
npm run test
npm run test:cov

# Database migrations
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma studio

# Generate Prisma client
npx prisma generate
```

### Admin Web Commands

```bash
# Run locally
npm run dev

# Build
npm run build

# Test build
npm run start
```

### Git Commands

```bash
# Commit changes
git add .
git commit -m "feat: description"
git push origin main

# Check status
git status
git log --oneline

# Revert changes
git revert <commit-hash>
git reset --hard <commit-hash>  # Careful!
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-20 | 1.0 | Initial playbook created |

---

**Questions or Issues?**

If you encounter issues not covered in this playbook:
1. Check the official documentation links above
2. Review recent deploys for similar issues
3. Check service status pages
4. Contact senior engineer

**Keep this document updated** as you learn from each deployment!
