# Fixes Summary - December 4, 2025

## Issues Fixed

### 1. ✅ Discord OAuth Popup Auto-Close
**Problem:** After successful login, user had to manually click link in popup to return to app

**Fix:** Updated backend redirect logic to detect mobile vs web and automatically:
- Open deep link immediately on mobile
- Close popup after 500ms
- No manual click required

**File:** `apps/backend/src/auth/auth.controller.ts:285-333`

---

### 2. ✅ Tournament History Data Not Loading
**Problem:** Profile screen showed empty tournament history

**Fix:** Created missing backend endpoint `/events/me/history` that returns:
- Completed tournaments player participated in
- Match records (wins-losses-draws)
- Placement (if available)
- Tournament date and game type

**Files:**
- `apps/backend/src/events/events.controller.ts:103-115` (endpoint)
- `apps/backend/src/events/events.service.ts:732-809` (service method)

---

### 3. ✅ Logout Error (400 Bad Request)
**Problem:** Logout still worked but showed error in logs

**Fix:** Mobile app now sends `refreshToken` in logout request body (backend requires it to revoke the token properly)

**File:** `apps/mobile/lib/api.ts:156-172`

---

### 4. ✅ Login Page Redesign
**Problem:** Login page was cluttered with both Discord and email login visible at once

**Fix:** Redesigned login page to show only one method at a time:
- Discord login shown by default
- Muted "Use email instead" button below to swap
- Cleaner, less cluttered interface

**File:** `apps/mobile/app/login.tsx:566-664`

---

## What You Need to Do

### 1. Redeploy Backend to Railway

The tournament history and logout fixes require backend redeployment:

```bash
git add .
git commit -m "fix: add tournament history endpoint and fix logout error"
git push
```

Railway will auto-deploy, or you can manually trigger deployment in Railway dashboard.

### 2. Test All Fixes on Mobile

**Test Discord OAuth:**
1. Open mobile app
2. Tap "Continue with Discord"
3. Authorize on Discord
4. ✅ Should automatically redirect back to app (no manual click needed)
5. ✅ Should successfully login and show events screen

**Test Logout:**
1. Login to app
2. Go to Settings → Logout
3. ✅ Should logout without errors in logs

**Test Tournament History:**
1. Login to app
2. Go to Profile → History tab
3. ✅ Should show completed tournaments (if any exist)

**Test New Login Design:**
1. Open login screen
2. ✅ Should see only Discord login button
3. Tap "Use email instead"
4. ✅ Should show email/password form
5. Tap "Use Discord instead"
6. ✅ Should switch back to Discord button

---

## Deployment Notes

### Local Backend
- Restarted with new endpoints
- Connected to Railway Postgres
- Ready for testing

### Railway Backend
- **Needs redeployment** to get tournament history endpoint
- Environment variables are already configured correctly
- No env var changes needed

### Mobile App
- Reload Expo to see login page redesign
- All API changes are backward compatible

---

## Summary

All 4 issues have been resolved:
- ✅ Discord OAuth auto-closes popup
- ✅ Tournament history endpoint added
- ✅ Logout error fixed
- ✅ Login page redesigned

**Next step:** Redeploy backend to Railway and test on iOS!
