# Genki TCG - Project Knowledge Base

> **For AI Coding Assistants:** This file provides essential context about the Genki TCG project structure, architecture, and deployment processes.

---

## Project Overview

**Name:** Genki TCG
**Type:** Tournament management platform for Trading Card Games
**Stack:** Monorepo (npm workspaces)
**Domains:**
- Backend API: `https://api.genkitcg.app`
- Admin Dashboard: `https://admin.genkitcg.app`
- Mobile App: iOS (App Store) + Android (future)

---

## Architecture

### Monorepo Structure

```
genki-tcg/
├── apps/
│   ├── backend/          # NestJS API (Railway)
│   ├── admin-web/        # Next.js dashboard (Vercel)
│   └── mobile/           # React Native (Expo)
├── packages/
│   ├── shared-types/     # TypeScript types
│   └── tournament-logic/ # Swiss pairing algorithms
├── scripts/              # Deployment automation
└── docs/                 # Documentation
```

### Technology Stack

**Mobile (apps/mobile):**
- Framework: Expo SDK 54
- Language: TypeScript + React Native 0.81.5
- State: React hooks
- Auth: Discord OAuth
- Build: EAS Build
- Updates: EAS Update (OTA)
- Bundle ID: `app.genkitcg`
- Current Version: 1.0.0

**Backend (apps/backend):**
- Framework: NestJS 10.x
- Language: TypeScript
- Database: PostgreSQL (Railway)
- Cache: Redis (Railway)
- ORM: Prisma 5.8.x
- Auth: JWT + Discord OAuth
- Deploy: Railway (auto-deploy on push)
- API: `https://api.genkitcg.app`

**Admin Web (apps/admin-web):**
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- UI: Tailwind + shadcn/ui
- Auth: Discord OAuth via backend
- Deploy: Vercel (auto-deploy on push)
- URL: `https://admin.genkitcg.app`

---

## Deployment Information

### Mobile App Deployments

**Two deployment types:**

1. **OTA (Over-The-Air) Update** - No App Store review
   - Use for: JS changes, bug fixes, UI updates
   - Time: 2-5 minutes
   - Command: `./scripts/mobile-ota-update.sh "message"`
   - Docs: [DEPLOYMENT_PLAYBOOK.md § Mobile OTA](../DEPLOYMENT_PLAYBOOK.md#type-1-ota-update-over-the-air-)

2. **Full Build** - Requires App Store review
   - Use for: Native code, permissions, SDK upgrades
   - Time: 1-7 days (includes review)
   - Command: `./scripts/mobile-full-build.sh`
   - Docs: [DEPLOYMENT_PLAYBOOK.md § Full Build](../DEPLOYMENT_PLAYBOOK.md#type-2-full-build--app-store-submission-)

### Backend Deployments

**Auto-deploy on git push to main:**
- Platform: Railway
- Trigger: Git push to `main` branch
- Time: 5-10 minutes
- Migrations: Run automatically on deploy
- Docs: [DEPLOYMENT_PLAYBOOK.md § Backend](../DEPLOYMENT_PLAYBOOK.md#backend-updates)

### Admin Web Deployments

**Auto-deploy on git push to main:**
- Platform: Vercel
- Trigger: Git push to `main` branch
- Time: 2-5 minutes
- Docs: [DEPLOYMENT_PLAYBOOK.md § Admin Web](../DEPLOYMENT_PLAYBOOK.md#admin-web-updates)

---

## Key Decisions & Constraints

### Mobile App

**Architecture:**
- ✅ New Architecture enabled (required for react-native-reanimated 4.x)
- ✅ Expo Router for navigation
- ✅ Sentry removed (caused build issues - can be re-added later)
- ❌ No Sentry currently (removed to fix pod install errors)

**Important Files:**
- `app.json` - Expo configuration, version number, bundle ID
- `eas.json` - Build profiles, environment variables
- `metro.config.js` - Metro bundler config for monorepo

**Version Management:**
- Semantic versioning (MAJOR.MINOR.PATCH)
- Update in `app.json` → `expo.version`
- Build number auto-incremented by EAS

### Backend

**Database:**
- PostgreSQL on Railway
- Prisma ORM
- Migrations in `prisma/migrations/`
- Auto-run on deploy

**Important Patterns:**
- All services use dependency injection
- IDOR protection via `orgId` filtering
- Rate limiting: 100 req/min global, 10 req/min auth
- JWT: 15min access + 7day refresh tokens

**Environment Variables:**
- Set in Railway dashboard
- Never commit to git
- Required: DATABASE_URL, JWT_SECRET, DISCORD_CLIENT_SECRET

### Admin Web

**Routing:**
- Next.js App Router
- All routes under `app/`
- Server Components by default

**Authentication:**
- Discord OAuth via backend
- JWT stored in httpOnly cookies
- Role-based access control (OWNER, STAFF)

---

## Development Workflows

### Making Changes

**Mobile JavaScript changes:**
```bash
# 1. Make changes in apps/mobile
# 2. Test locally: npx expo start
# 3. Deploy OTA: ./scripts/mobile-ota-update.sh "message"
```

**Mobile native changes:**
```bash
# 1. Make changes in apps/mobile
# 2. Update version in app.json
# 3. Build: ./scripts/mobile-full-build.sh
# 4. Wait for App Store review
```

**Backend changes:**
```bash
# 1. Make changes in apps/backend
# 2. Test: npm run test
# 3. Commit & push: git push origin main
# 4. Railway auto-deploys
```

**Admin changes:**
```bash
# 1. Make changes in apps/admin-web
# 2. Test: npm run dev
# 3. Commit & push: git push origin main
# 4. Vercel auto-deploys
```

### Database Migrations

```bash
cd apps/backend
npx prisma migrate dev --name migration_name
git add prisma/migrations
git commit -m "feat(db): description"
git push origin main  # Railway runs migration
```

---

## Common Tasks

### Update Mobile App Version

```bash
# Edit apps/mobile/app.json
# Change: "version": "1.0.0" → "1.1.0"
./scripts/mobile-full-build.sh
```

### Add New API Endpoint

```bash
cd apps/backend
# Create controller, service, DTOs
# Test locally
npm run test
git push origin main
```

### Fix Production Bug

**Mobile (JS bug):**
```bash
./scripts/mobile-ota-update.sh "HOTFIX: bug description"
# Users get fix on next app restart
```

**Backend:**
```bash
# Fix code
git commit -m "hotfix: bug description"
git push origin main
# Deploy in 5-10 minutes
```

### Rollback Deployment

**Mobile OTA:**
```bash
npx eas-cli update:republish --update-id <previous-id>
```

**Backend:**
- Railway → Deployments → Redeploy previous

**Admin:**
- Vercel → Deployments → Promote to Production

---

## Testing

### Mobile Testing

```bash
cd apps/mobile
npx expo start
# Press 'i' for iOS simulator
# Test changes
```

### Backend Testing

```bash
cd apps/backend
npm run test           # Unit tests
npm run test:cov       # With coverage
npm run test:e2e       # E2E tests
```

### Integration Testing

```bash
# Verify all services
./scripts/verify-deployment.sh
```

---

## Environment Variables

### Mobile (eas.json)
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.genkitcg.app"
      }
    }
  }
}
```

### Backend (Railway Dashboard)
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `JWT_SECRET`: JWT signing key
- `REFRESH_TOKEN_SECRET`: Refresh token key
- `DISCORD_CLIENT_SECRET`: Discord OAuth
- `NODE_ENV`: production

### Admin (Vercel Dashboard)
- `NEXT_PUBLIC_API_URL`: https://api.genkitcg.app

---

## Important Constraints

### What NOT to Do

❌ **Never commit:**
- Environment variables
- API keys or secrets
- Database credentials
- JWT secrets

❌ **Never deploy:**
- Without testing locally first
- Breaking changes without API versioning
- On Friday afternoon (can't fix over weekend)
- Database migrations without backup

❌ **Never in mobile app:**
- Change bundle ID (`app.genkitcg`) without major version
- Add new permissions without full build
- Upgrade Expo SDK with OTA update

### What to ALWAYS Do

✅ **Always:**
- Test locally before deploying
- Run `npm run test` before backend deploy
- Increment version for full mobile builds
- Document breaking changes
- Have rollback plan ready
- Verify deployment with health checks

---

## Quick References

**Documentation:**
- Deployment: `DEPLOYMENT_PLAYBOOK.md`
- Quick ref: `QUICK_DEPLOY_REFERENCE.md`
- App Store: `apps/mobile/APP_STORE_METADATA.md`

**Scripts:**
- OTA update: `./scripts/mobile-ota-update.sh`
- Full build: `./scripts/mobile-full-build.sh`
- Verify: `./scripts/verify-deployment.sh`

**Dashboards:**
- Railway: https://railway.app/dashboard
- Vercel: https://vercel.com/dashboard
- Expo: https://expo.dev
- App Store: https://appstoreconnect.apple.com

---

## For AI Assistants

### When helping with this project:

1. **Always check deployment type needed** before suggesting commands
2. **Reference documentation** instead of guessing procedures
3. **Verify changes are safe** (no secrets, breaking changes documented)
4. **Suggest testing** before any deployment
5. **Provide rollback commands** alongside deploy commands
6. **Check constraints** (bundle ID, versioning, etc.)

### Quick Decision Tree

```
User wants to deploy changes →
├─ Mobile JS only? → OTA Update
├─ Mobile native? → Full Build
├─ Backend? → Git push (auto-deploy)
└─ Admin? → Git push (auto-deploy)
```

### Documentation Priority

1. `DEPLOYMENT_PLAYBOOK.md` - Complete procedures
2. `QUICK_DEPLOY_REFERENCE.md` - Command reference
3. `project-knowledge.md` - This file (context)
4. Specific guides (APP_STORE_METADATA.md, etc.)

---

**Last Updated:** December 20, 2025
**For Questions:** See DEPLOYMENT_README.md
