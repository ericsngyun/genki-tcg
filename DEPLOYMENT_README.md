# Deployment Documentation Index

> **For AI Assistants & Developers:** This index provides quick access to all deployment-related documentation for the Genki TCG project.

---

## 📚 Core Documentation

### 1. **DEPLOYMENT_PLAYBOOK.md** - Main Reference
**Purpose:** Complete deployment procedures for all components
**Use when:** Planning or executing any deployment
**Contains:**
- Mobile app updates (OTA & Full Build)
- Backend deployments
- Admin web deployments
- Version management
- Rollback procedures
- Emergency procedures
- Common scenarios

**Quick Link:** [→ View Playbook](./DEPLOYMENT_PLAYBOOK.md)

---

### 2. **QUICK_DEPLOY_REFERENCE.md** - Cheat Sheet
**Purpose:** One-page reference for common deployment commands
**Use when:** Need quick command reference
**Contains:**
- Command snippets for each deployment type
- Quick rollback commands
- Emergency hotfix procedures
- Important links

**Quick Link:** [→ View Reference](./QUICK_DEPLOY_REFERENCE.md)

---

### 3. **APP_STORE_METADATA.md** - App Store Assets
**Purpose:** Complete App Store Connect metadata
**Location:** `apps/mobile/APP_STORE_METADATA.md`
**Contains:**
- App descriptions
- Keywords
- Screenshots requirements
- Privacy policy
- Release notes
- App review information

**Quick Link:** [→ View Metadata](./apps/mobile/APP_STORE_METADATA.md)

---

### 4. **PRIVACY_POLICY.md** - User Privacy
**Purpose:** Privacy policy for App Store and users
**Location:** `apps/mobile/PRIVACY_POLICY.md`
**Contains:**
- Data collection practices
- Third-party services
- User rights
- GDPR/CCPA compliance

**Quick Link:** [→ View Privacy Policy](./apps/mobile/PRIVACY_POLICY.md)

---

## 🛠️ Automation Scripts

### Mobile OTA Update
```bash
./scripts/mobile-ota-update.sh "Bug fix description"
```
**Purpose:** Automated OTA update with safety checks
**Time:** 2-5 minutes
**File:** [scripts/mobile-ota-update.sh](./scripts/mobile-ota-update.sh)

### Mobile Full Build
```bash
./scripts/mobile-full-build.sh
```
**Purpose:** Interactive full build & submit process
**Time:** 15-20 minutes + review time
**File:** [scripts/mobile-full-build.sh](./scripts/mobile-full-build.sh)

### Deployment Verification
```bash
./scripts/verify-deployment.sh
```
**Purpose:** Verify all services are healthy
**Time:** 10 seconds
**File:** [scripts/verify-deployment.sh](./scripts/verify-deployment.sh)

---

## 🔄 Deployment Workflows

### Quick Decision Matrix

| Scenario | Action | Command | Review Time |
|----------|--------|---------|-------------|
| Bug fix (JS) | OTA Update | `./scripts/mobile-ota-update.sh "Fix"` | None |
| New feature (JS) | OTA Update | `./scripts/mobile-ota-update.sh "Feature"` | None |
| Native code change | Full Build | `./scripts/mobile-full-build.sh` | 1-7 days |
| Backend update | Git Push | `git push origin main` | None |
| Admin update | Git Push | `git push origin main` | None |

---

## 📋 Pre-Deployment Checklists

### Mobile (OTA)
- [ ] Changes are JavaScript only
- [ ] Tested locally
- [ ] No breaking API changes
- [ ] Update message is descriptive

### Mobile (Full Build)
- [ ] Version incremented in app.json
- [ ] Release notes prepared
- [ ] Tested on physical device
- [ ] Screenshots updated (if UI changed)

### Backend
- [ ] Tests passing
- [ ] Database migrations tested
- [ ] No breaking API changes (or versioned)
- [ ] Environment variables set

### Admin Web
- [ ] Build succeeds locally
- [ ] TypeScript errors resolved
- [ ] Compatible with current backend

---

## 🚨 Emergency Procedures

### Critical Bug in Production

**Mobile (JS bug):**
```bash
./scripts/mobile-ota-update.sh "HOTFIX: Critical bug fix"
```

**Backend:**
```bash
git commit -m "hotfix: critical bug" && git push origin main
```

**Rollback Mobile:**
```bash
npx eas-cli update:republish --update-id <previous-id>
```

**Rollback Backend:**
- Railway Dashboard → Deployments → Redeploy previous

---

## 📊 Monitoring & Verification

### Health Checks

**Backend:**
```bash
curl https://api.genkitcg.app/health
```

**Admin Web:**
```bash
curl https://admin.genkitcg.app
```

**All Services:**
```bash
./scripts/verify-deployment.sh
```

### Dashboards

- **Railway (Backend):** https://railway.app/dashboard
- **Vercel (Admin):** https://vercel.com/dashboard
- **Expo (Mobile):** https://expo.dev
- **App Store Connect:** https://appstoreconnect.apple.com

---

## 🔢 Version Management

### Current Versions

Check current versions:
```bash
# Mobile
cat apps/mobile/app.json | grep version

# Backend
cat apps/backend/package.json | grep version

# Admin Web
cat apps/admin-web/package.json | grep version
```

### Version Increment Rules

**Mobile:**
- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): New features
- **Major** (1.0.0 → 2.0.0): Breaking changes

**Backend/Admin:**
- Follow semantic versioning
- Update package.json manually
- Tag releases with git tags

---

## 🎯 Common Scenarios

### 1. Fixed Bug in Mobile App
→ [Scenario 1: Bug Fix](./DEPLOYMENT_PLAYBOOK.md#scenario-1-fixed-a-bug-in-mobile-app)

### 2. Added New Feature
→ [Scenario 2: New Feature](./DEPLOYMENT_PLAYBOOK.md#scenario-2-added-new-feature-to-mobile-app)

### 3. API Endpoint Changed
→ [Scenario 3: API Change](./DEPLOYMENT_PLAYBOOK.md#scenario-3-api-endpoint-changed)

### 4. Database Schema Change
→ [Scenario 4: Database Migration](./DEPLOYMENT_PLAYBOOK.md#scenario-4-database-schema-change)

### 5. Security Patch
→ [Scenario 5: Security](./DEPLOYMENT_PLAYBOOK.md#scenario-5-urgent-security-patch)

---

## 🤖 For AI Coding Assistants

### Context for AI Models

When helping with deployments, always:

1. **Check deployment type needed:**
   - Read change type (JS vs native, breaking vs non-breaking)
   - Recommend appropriate deployment method
   - Refer to relevant playbook section

2. **Verify prerequisites:**
   - Check version numbers
   - Ensure tests pass
   - Verify environment compatibility

3. **Provide exact commands:**
   - Use automation scripts when available
   - Include verification steps
   - Reference rollback procedures

4. **Safety first:**
   - Always suggest testing locally first
   - Recommend deployment during low-traffic times
   - Provide rollback instructions upfront

### Quick AI References

**For deployment questions:**
- Primary: `DEPLOYMENT_PLAYBOOK.md`
- Quick ref: `QUICK_DEPLOY_REFERENCE.md`
- Scripts: `scripts/*.sh`

**For App Store questions:**
- Metadata: `apps/mobile/APP_STORE_METADATA.md`
- Privacy: `apps/mobile/PRIVACY_POLICY.md`

**For architecture questions:**
- Backend: `BACKEND_ARCHITECTURE.md`
- Mobile: `apps/mobile/MOBILE_SETUP_GUIDE.md`
- Production: `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

---

## 📖 Additional Documentation

- **Setup Guides:**
  - [Developer Setup](./DEVELOPER_SETUP_GUIDE.md)
  - [Environment Setup](./ENVIRONMENT_SETUP.md)
  - [Railway Setup](./RAILWAY_PRODUCTION_SETUP.md)

- **Architecture:**
  - [Backend Architecture](./BACKEND_ARCHITECTURE.md)
  - [Production Architecture](./PRODUCTION_ARCHITECTURE.md)

- **Testing:**
  - [Testing Guide](./TESTING_GUIDE.md)
  - [Security Audit](./SECURITY_AUDIT.md)

---

## 🔐 Credentials & Access

**Required Access:**
- GitHub repository (code push)
- Railway dashboard (backend deploys)
- Vercel dashboard (admin deploys)
- Expo account (mobile builds)
- Apple Developer account (App Store)

**Environment Variables:**
- Railway: Backend environment variables
- Vercel: Admin environment variables
- EAS: Mobile build credentials (managed automatically)

**Secrets Location:**
- Backend: Railway dashboard
- Admin: Vercel dashboard
- Mobile: EAS credentials storage
- **NEVER** commit secrets to git

---

## 📞 Support & Troubleshooting

### Common Issues

**Build failures:**
→ Check build logs on respective platform dashboard

**Deployment hangs:**
→ Check service status pages for Railway/Vercel/Expo

**Database migration fails:**
→ See [Database Migrations](./DEPLOYMENT_PLAYBOOK.md#database-migrations)

**OTA update not received:**
→ Users must restart app; wait 24 hours for full adoption

### Getting Help

1. Check this documentation index
2. Review relevant playbook section
3. Check service status pages
4. Review recent deployments for patterns
5. Consult team/senior engineer

---

## 📝 Keep Documentation Updated

After each significant deployment or if you learn something new:

1. Update relevant playbook section
2. Add to common scenarios if applicable
3. Update version numbers in this index
4. Commit documentation changes

**Documentation is code** - treat it with the same care!

---

**Last Updated:** December 20, 2025
**Maintained By:** Engineering Team
**Version:** 1.0
