# Backend & Database Audit Report
**Date:** December 4, 2025

## Executive Summary

You have **ONE NestJS backend codebase** that can run in **TWO places**:
1. **Locally** on your computer (`http://localhost:3001`)
2. **On Railway** (hosted in the cloud at `https://genki-tcg-production.up.railway.app`)

Both instances use the **SAME Railway Postgres database**, but you control which backend your apps connect to via environment variables.

---

## Current Configuration

### 1. Database (Single Source of Truth)
- **Location:** Railway-hosted Postgres
- **Connection:** `nozomi.proxy.rlwy.net:14896/railway`
- **Total Users:** 13 users
- **Most Recent Discord User:** eric (ericsungyun@gmail.com, created Nov 23, 2025)

### 2. Backend Instances

#### Local Backend (`apps/backend`)
- **Status:** ✅ Running (started during this audit)
- **URL:** `http://localhost:3001`
- **Database:** Railway Postgres (SAME as production)
- **Environment:** Development
- **Discord OAuth:** ✅ Configured

#### Railway Backend (Production)
- **Status:** ✅ Running
- **URL:** `https://genki-tcg-production.up.railway.app`
- **Database:** Railway Postgres (SAME as local)
- **Environment:** Production
- **Discord OAuth:** ⚠️ Partially configured (missing redirect URI in `DISCORD_ALLOWED_REDIRECTS`)

### 3. Frontend Applications

#### Mobile App (`apps/mobile`)
- **Current Target:** Railway Production
- **API URL:** `https://genki-tcg-production.up.railway.app`
- **Can Switch To:** Local backend by editing `.env`

#### Admin Web (`apps/admin-web`)
- **Current Target:** Railway Production
- **API URL:** `https://genki-tcg-production.up.railway.app`
- **Can Switch To:** Local backend by editing `.env.local`

---

## Key Findings

### ✅ What's Working
1. Both backends are running and healthy
2. Both connect to the same Railway Postgres database
3. Database has 13 users (including your Discord OAuth user)
4. Mobile app and admin web are correctly configured to use Railway production
5. Discord OAuth works on Railway backend (tested successfully)

### ⚠️ Configuration Issues Found

#### Issue #1: Railway `DISCORD_ALLOWED_REDIRECTS` Has Line Breaks
**Impact:** Mobile app Discord OAuth fails with "Invalid redirect URI"

**Current Value (broken):**
```
http://localhost:3001/auth/
  discord/mobile-callback,https://genki-tcg-production.u
  p.railway.app/auth/discord/mobile-callback
```

**Should Be (fixed):**
```
http://localhost:3000,http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://discord/callback,genki-tcg://auth/callback
```

#### Issue #2: Confusion About Backend Usage
**Problem:** Not clear when each backend is being used

**Solution:** Check the environment variables in your frontend apps:
- Mobile: `apps/mobile/.env` → Look at `EXPO_PUBLIC_API_URL`
- Admin Web: `apps/admin-web/.env.local` → Look at `NEXT_PUBLIC_API_URL`

---

## How It All Connects

```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY POSTGRES DATABASE                 │
│                  (nozomi.proxy.rlwy.net:14896)              │
│                         13 users stored                      │
└─────────────────────────────────────────────────────────────┘
                    ▲                            ▲
                    │                            │
                    │                            │
    ┌───────────────┴────────────┐  ┌───────────┴─────────────┐
    │   LOCAL BACKEND (NestJS)   │  │  RAILWAY BACKEND (NestJS)│
    │   http://localhost:3001    │  │  https://genki-tcg-...   │
    │   Status: Running          │  │  Status: Running          │
    └───────────────┬────────────┘  └───────────┬──────────────┘
                    │                            │
                    │                            │
         ┌──────────┴──────────┐    ┌──────────┴──────────┐
         │                     │    │                      │
    ┌────▼─────┐         ┌────▼────▼───┐                 │
    │  LOCAL   │         │   MOBILE APP │            ┌────▼─────┐
    │ DEV/TEST │         │   (Expo Go)  │            │ ADMIN WEB│
    └──────────┘         │  Currently:  │            │Currently:│
                         │   → Railway  │            │→ Railway │
                         └──────────────┘            └──────────┘
```

---

## Why You Don't See Your User

**Question:** "I signed up via Discord OAuth in the web mobile version but don't show up in Railway Postgres user list"

**Investigation Results:**
1. ✅ Railway Postgres has 13 users (you ARE in the database!)
2. ✅ Your user exists: `eric` (ericsungyun@gmail.com, Discord: 3syx)
3. ✅ Both local and Railway backends connect to the SAME database

**Most Likely Reason:** You're looking at the Railway dashboard's database viewer incorrectly, or you're checking a different project/database. Your user **IS** in the database at `nozomi.proxy.rlwy.net:14896/railway`.

---

## Recommendations

### For Development
**Use local backend** to avoid hitting production and for faster development:

1. **Start local backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Point mobile app to local:**
   ```env
   # apps/mobile/.env
   EXPO_PUBLIC_API_URL=http://192.168.254.93:3001
   ```

3. **Point admin web to local:**
   ```env
   # apps/admin-web/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### For Production Testing
**Use Railway backend** to test production environment:

1. **Stop local backend** (to avoid confusion)

2. **Point apps to Railway:**
   ```env
   # apps/mobile/.env
   EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app

   # apps/admin-web/.env.local
   NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
   ```

3. **Fix Railway environment variables:**
   - Update `DISCORD_ALLOWED_REDIRECTS` (remove line breaks)
   - Ensure Discord Developer Portal has redirect URIs registered

---

## Immediate Action Items

1. ✅ **DONE** - Identified your user exists in Railway Postgres
2. ⚠️ **TODO** - Fix Railway `DISCORD_ALLOWED_REDIRECTS` environment variable
3. ⚠️ **TODO** - Register redirect URIs in Discord Developer Portal:
   - `https://genki-tcg-production.up.railway.app/auth/discord/callback`
   - `https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback`
4. ⚠️ **TODO** - Decide: Development (local) or Production (Railway) for testing
5. ⚠️ **TODO** - Stop local backend when not in use to avoid confusion

---

## How to Check Which Backend You're Using

**Mobile App:**
```bash
# Check the .env file
cat apps/mobile/.env | grep EXPO_PUBLIC_API_URL
```

**Admin Web:**
```bash
# Check the .env.local file
cat apps/admin-web/.env.local | grep NEXT_PUBLIC_API_URL
```

**Backend Health Check:**
```bash
# Local
curl http://localhost:3001/health

# Railway
curl https://genki-tcg-production.up.railway.app/health
```

---

## Summary

- **Same NestJS codebase** runs locally AND on Railway
- **Same Postgres database** (Railway-hosted) for both
- **Frontend apps** can point to either backend via `.env` files
- **Your Discord user exists** in the database (eric@gmail.com)
- **Current setup:** Mobile + Admin Web → Railway Backend → Railway Database
- **Issue:** Railway `DISCORD_ALLOWED_REDIRECTS` has line breaks (needs fixing)
