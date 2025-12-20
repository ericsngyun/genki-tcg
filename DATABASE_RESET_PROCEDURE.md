# Database Reset Procedure for Production Launch

**Project:** Genki TCG
**Last Updated:** December 15, 2025
**Status:** Ready for Production Launch
**Purpose:** Clean slate for App Store/Play Store launch

---

## ⚠️ CRITICAL WARNING

This procedure will **permanently delete all data** from your production database. This includes:
- All users and authentication data
- All tournaments, matches, and results
- All credits and transaction history
- All ratings and leaderboard data
- All notifications and audit logs

**Only perform this procedure if you are absolutely certain you want to start fresh.**

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Access to Railway dashboard (https://railway.app/dashboard)
- [ ] Confirmed this is what you want to do (no going back!)
- [ ] Reviewed and backed up any test data you might want to reference later
- [ ] All team members are aware this is happening
- [ ] At least 30 minutes of uninterrupted time

---

## 🔴 Option 1: Complete Database Reset (Recommended for Fresh Start)

### Method A: Via Railway Dashboard (Easiest)

This creates a brand new database with no data.

**Steps:**

1. **Create Backup First (Safety Net)**
   ```
   1. Go to Railway dashboard → Your Project → PostgreSQL service
   2. Click "Backups" tab
   3. Click "Create Backup"
   4. Label: "pre-production-reset-2025-12-15"
   5. Wait for backup to complete
   ```

2. **Delete and Recreate Database**
   ```
   Option A: Delete and recreate PostgreSQL service
   ------------------------------------------------
   1. Go to Railway dashboard → Your Project
   2. Click on PostgreSQL service
   3. Go to Settings tab
   4. Scroll to bottom → "Delete Service"
   5. Type the service name to confirm
   6. Click "Delete Service"

   7. Create new PostgreSQL service:
      - Click "+ New" button
      - Select "Database" → "PostgreSQL"
      - Wait for provisioning (~2-3 minutes)

   8. Copy the new DATABASE_URL:
      - Click on PostgreSQL service
      - Click "Connect" tab
      - Copy the "Database URL" value
   ```

   **OR**

   ```
   Option B: Drop and recreate schema (keeps service)
   --------------------------------------------------
   This is less clean but faster. See Method B below.
   ```

3. **Update Backend Environment Variables**
   ```
   1. Go to Railway dashboard → Your Project → Backend service
   2. Click "Variables" tab
   3. Update DATABASE_URL with new value (if you recreated service)
   4. Verify all other variables are set (see REQUIRED VARIABLES below)
   5. Click "Deploy" or wait for auto-redeploy
   ```

4. **Run Database Migrations**
   ```
   The backend automatically runs migrations on startup via the
   start.sh script, so you don't need to do anything manually!

   Verify migrations ran successfully:
   1. Go to Railway dashboard → Backend service
   2. Click "Deployments" tab
   3. View logs for latest deployment
   4. Look for: "✅ Database migrations completed"
   ```

5. **Seed Initial Data**
   ```
   You have two options for seeding:

   Option A: Use the built-in seed endpoint (Recommended)
   -------------------------------------------------------
   1. Wait for backend deployment to complete
   2. Get your production API URL from Railway
   3. Make a POST request to seed the database:

      curl -X POST https://your-api.railway.app/api/seed \
        -H "Content-Type: application/json" \
        -H "x-api-key: YOUR_ADMIN_API_KEY"

   Option B: Run seed script manually (Advanced)
   -----------------------------------------------
   1. Clone repository locally
   2. Install dependencies: npm install
   3. Set DATABASE_URL to production:
      export DATABASE_URL="postgresql://..."
   4. Run: npm run db:seed --workspace=@genki-tcg/backend

   ⚠️ WARNING: Option B will seed from your local machine to production!
   ```

6. **Verify Fresh Database**
   ```
   Test the following endpoints to ensure everything works:

   1. Health check:
      curl https://your-api.railway.app/health

      Expected: {"status":"ok","database":"connected"}

   2. Events endpoint:
      curl https://your-api.railway.app/api/events

      Expected: {"data":[],"total":0} (empty at first)

   3. Try logging in via Discord OAuth on mobile/admin-web
   ```

---

### Method B: Drop and Recreate Schema (Keeps Railway Service)

This approach drops all tables and recreates them, but keeps the same PostgreSQL service.

**Steps:**

1. **Connect to Production Database**
   ```bash
   # Install psql if needed (PostgreSQL client)
   # On Windows: Download from https://www.postgresql.org/download/windows/
   # On Mac: brew install postgresql
   # On Linux: sudo apt-get install postgresql-client

   # Get DATABASE_URL from Railway dashboard
   # Go to PostgreSQL service → Connect tab → Copy "Database URL"

   # Connect to database
   psql "postgresql://postgres:password@hostname:port/database"
   ```

2. **Drop All Tables**
   ```sql
   -- ⚠️ WARNING: This deletes EVERYTHING!
   -- Copy and paste this entire block:

   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;

   -- Exit psql
   \q
   ```

3. **Redeploy Backend to Run Migrations**
   ```
   1. Go to Railway dashboard → Backend service
   2. Click "Deployments" tab
   3. Find latest deployment
   4. Click "..." menu → "Redeploy"
   5. Wait for deployment to complete
   6. Check logs for "✅ Database migrations completed"
   ```

4. **Seed Initial Data** (see Option A or B above in Method A, Step 5)

---

## 🟡 Option 2: Selective Data Deletion (Keep Some Data)

If you want to keep test tournaments for reference but reset users:

**NOT RECOMMENDED for App Store launch - better to start completely fresh!**

But if needed:

```sql
-- Connect to database first (see Method B, Step 1)

-- Delete all user-generated data but keep test tournaments
DELETE FROM "Match";
DELETE FROM "Round";
DELETE FROM "Entry";
DELETE FROM "Decklist";
DELETE FROM "StandingSnapshot";
DELETE FROM "CreditLedgerEntry";
DELETE FROM "CreditBalance";
DELETE FROM "PlayerCategoryLifetimeRating";
DELETE FROM "PlayerCategorySeasonRating";
DELETE FROM "LifetimeRatingHistory";
DELETE FROM "TournamentRatingUpdate";
DELETE FROM "NotificationToken";
DELETE FROM "Notification";
DELETE FROM "UserNotificationPreference";
DELETE FROM "AuditLog";
DELETE FROM "RefreshToken";
DELETE FROM "PasswordResetToken";
DELETE FROM "EmailVerificationToken";
DELETE FROM "OAuthState";
DELETE FROM "OrgMembership";
DELETE FROM "User";

-- Reset Event IDs if you want fresh event numbering
-- TRUNCATE "Event" RESTART IDENTITY CASCADE;

-- Verify
SELECT COUNT(*) FROM "User"; -- Should be 0
SELECT COUNT(*) FROM "Event"; -- Depends on what you kept
```

---

## ✅ Required Environment Variables for Production

After resetting the database, ensure these are set in Railway:

### Backend Service Variables

```bash
# CRITICAL - Must be set or backend won't start!
NODE_ENV="production"
DATABASE_URL="postgresql://..." # From Railway PostgreSQL service
REDIS_URL="redis://..." # From Railway Redis service
JWT_SECRET="<generated via: openssl rand -base64 64>"
REFRESH_TOKEN_SECRET="<different secret via: openssl rand -base64 64>"
DISCORD_CLIENT_ID="1441953820820373639"
DISCORD_CLIENT_SECRET="<from Discord developer portal>"

# REQUIRED - OAuth Configuration
DISCORD_ALLOWED_REDIRECTS="https://your-api.railway.app/auth/discord/callback,https://your-api.railway.app/auth/discord/mobile-callback,https://your-admin.vercel.app,genki-tcg://"

# OPTIONAL but recommended
API_URL="https://your-api.railway.app"
CORS_ORIGINS="https://your-admin.vercel.app"
DEFAULT_ORG_SLUG="genki"
DEFAULT_INVITE_CODE="GENKI"
SENTRY_DSN="<from Sentry dashboard>"
EXPO_ACCESS_TOKEN="<from Expo dashboard for push notifications>"
```

**Generate Secrets:**
```bash
# Run these locally and copy the output to Railway:
openssl rand -base64 64  # Use for JWT_SECRET
openssl rand -base64 64  # Use for REFRESH_TOKEN_SECRET (must be different!)
```

---

## 📊 Post-Reset Verification Checklist

After resetting and redeploying:

- [ ] **Health Check Passes**
  ```bash
  curl https://your-api.railway.app/health
  # Expected: {"status":"ok","database":"connected"}
  ```

- [ ] **Database Migrations Applied**
  ```
  Check Railway backend logs for: "✅ Database migrations completed"
  ```

- [ ] **Seed Data Loaded** (if you ran seed)
  ```bash
  curl https://your-api.railway.app/api/events
  # Should return at least default organization events
  ```

- [ ] **Discord OAuth Works**
  ```
  1. Open admin-web in browser
  2. Click "Login with Discord"
  3. Authorize app
  4. Should redirect back and create new user
  5. Check Railway logs for user creation
  ```

- [ ] **Mobile App Connects**
  ```
  1. Open mobile app
  2. Try to login with Discord
  3. Should create new user and show events list
  ```

- [ ] **Admin Access Works**
  ```
  1. First user created should be OWNER role (via seed)
  2. Login to admin-web
  3. Try creating a test event
  4. Verify event appears
  ```

- [ ] **WebSocket Connection Works**
  ```
  Check Railway backend logs for:
  "WebSocket connection established"
  ```

- [ ] **Error Tracking Works**
  ```
  1. Check Sentry dashboard
  2. Should see backend service connected
  3. No critical errors on startup
  ```

---

## 🚨 Troubleshooting

### Problem: Backend won't start after reset

**Solution:**
```
1. Check Railway backend logs for errors
2. Most common: Missing required environment variables
3. Verify DATABASE_URL is correct
4. Verify REDIS_URL is correct
5. Check that JWT_SECRET and REFRESH_TOKEN_SECRET are set
```

### Problem: Migrations fail

**Solution:**
```
1. Check Railway logs for specific migration error
2. If schema is corrupted, use Method B to drop and recreate
3. Ensure PostgreSQL version is 14+ (Railway default is 16)
4. Try manual migration:
   psql $DATABASE_URL
   # Then manually run SQL from migrations if needed
```

### Problem: Seed fails with "Organization already exists"

**Solution:**
```
The seed script is idempotent and will skip if org exists.
If you want to re-seed completely:
1. Drop and recreate database (Method A or B)
2. Redeploy backend
3. Run seed again
```

### Problem: Can't login after reset

**Solution:**
```
1. Clear browser localStorage and cookies
2. On mobile: Uninstall and reinstall app (or clear app data)
3. Ensure DISCORD_ALLOWED_REDIRECTS includes your domains
4. Check Railway logs for OAuth errors
5. Verify Discord OAuth app settings include correct redirect URLs
```

### Problem: WebSocket connections failing

**Solution:**
```
1. Ensure Railway backend is using WSS (secure WebSocket)
2. Check CORS_ORIGINS includes your frontend domains
3. Mobile app should use wss:// not ws://
4. Check Railway logs for WebSocket errors
```

---

## 📝 Post-Reset Setup Tasks

After database is fresh, you'll need to:

### 1. Create Your Admin Account

```
Method A: Automatic (via seed script)
-------------------------------------
The seed script creates a default owner account:
- Email: owner@genkitcg.com
- Password: can be set via Discord OAuth
- Role: OWNER

Method B: Manual (first Discord login)
-------------------------------------
1. Login via Discord OAuth on admin-web
2. You'll be created as a PLAYER
3. Manually promote to OWNER via database:
   psql $DATABASE_URL
   UPDATE "OrgMembership"
   SET role = 'OWNER'
   WHERE "userId" = (SELECT id FROM "User" WHERE email = 'your@email.com');
```

### 2. Configure Your Organization

```
1. Login to admin-web as OWNER
2. Update organization settings:
   - Name
   - Slug
   - Invite code (for new users)
   - Default credit amounts
   - Tournament settings
```

### 3. Test Critical Flows

Before launch, test:
- [ ] User registration (Discord OAuth)
- [ ] Event creation
- [ ] Player check-in
- [ ] Round generation (Swiss pairing)
- [ ] Match result reporting
- [ ] Standings calculation
- [ ] Credits system
- [ ] Push notifications (if enabled)

---

## 📅 Recommended Timeline

**1 Week Before Launch:**
- [ ] Final review of this procedure
- [ ] Backup current test database (if needed for reference)
- [ ] Schedule reset for specific date/time

**1 Day Before Launch:**
- [ ] Inform team of reset schedule
- [ ] Prepare seed data (if custom)
- [ ] Verify all environment variables are ready

**Launch Day:**
- [ ] Perform database reset (allow 1 hour)
- [ ] Run verification checklist (30 minutes)
- [ ] Test all critical flows (1 hour)
- [ ] Monitor errors in Sentry (ongoing)

**Post-Launch:**
- [ ] Monitor database growth
- [ ] Verify backups are running daily
- [ ] Set up alerts for database issues

---

## ✅ Production Launch Checklist Integration

This database reset should be performed as part of your production launch checklist (see `PRODUCTION_DEPLOYMENT_CHECKLIST.md`).

**Recommended timing:**
- Reset database **after** final code deployment
- Reset database **before** submitting to App Store/Play Store
- This ensures app reviewers see a clean, fresh instance

---

## 📞 Emergency Rollback

If something goes wrong during the reset:

1. **Stop immediately**
2. Check if backup was created (step 1 of Method A)
3. Restore from backup via Railway dashboard
4. Contact team before proceeding further

---

## 🎯 Success Criteria

You'll know the reset was successful when:

- ✅ Backend health check returns `{"status":"ok","database":"connected"}`
- ✅ Mobile app can login via Discord OAuth
- ✅ Admin-web can create events
- ✅ No errors in Sentry dashboard
- ✅ All environment variables validated on backend startup
- ✅ WebSocket connections working (check logs)
- ✅ Database migrations all applied (check logs)

---

**Remember:** A fresh database is essential for a professional App Store launch. Don't skip this step!

---

**Last Updated:** December 15, 2025
**Document Owner:** Senior Engineering Team
**Next Review:** After production launch
