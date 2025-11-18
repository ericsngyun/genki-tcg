# Genki TCG - Complete Setup Guide for Windows

This guide will walk you through setting up the Genki TCG project on a new Windows laptop, connecting to the existing Railway backend with all production data.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the Applications](#running-the-applications)
5. [Login Credentials](#login-credentials)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Git** (for cloning the repository)

### Verify Installation
Open PowerShell or Command Prompt and run:

```bash
node --version
# Should output v20.x.x or higher

npm --version
# Should output 10.x.x or higher

git --version
# Should output git version 2.x.x or higher
```

### Installing Missing Software

**Node.js and npm:**
- Download from: https://nodejs.org/ (choose LTS version)
- The installer includes npm

**Git:**
- Download from: https://git-scm.com/download/win

---

## Initial Setup

### 1. Clone the Repository

```bash
# Navigate to your desired directory
cd C:\Users\[YourUsername]\

# Clone the repository
git clone [YOUR_REPOSITORY_URL] genki-tcg
cd genki-tcg
```

### 2. Install All Dependencies

This is a monorepo using npm workspaces. Install all dependencies with a single command:

```bash
npm install
```

This will install dependencies for:
- Backend (NestJS API)
- Admin Web (Next.js)
- Mobile (React Native/Expo)
- Shared packages

**Expected Output:**
```
added XXX packages in XXs
```

**Note:** This may take 3-5 minutes depending on your internet connection.

---

## Environment Configuration

The project uses environment variables to configure API endpoints and other settings. You need to configure three applications:

### 1. Admin Web Configuration

**File Location:** `apps/admin-web/.env.local`

**Create or verify the file exists:**

```bash
# Check if file exists
type apps\admin-web\.env.local
```

**Required Content:**
```env
# Backend API URL - Railway Production
NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app

# Application Configuration
NEXT_PUBLIC_APP_NAME="Genki TCG Admin"
NEXT_PUBLIC_APP_VERSION="0.1.0"
```

**To create/update:**
```bash
# Copy from example (if needed)
copy apps\admin-web\.env.local.example apps\admin-web\.env.local

# Then edit apps\admin-web\.env.local
notepad apps\admin-web\.env.local
```

### 2. Mobile App Configuration

**File Location:** `apps/mobile/.env`

**Create or verify the file exists:**

```bash
# Check if file exists
type apps\mobile\.env
```

**Required Content:**
```env
# Backend API URL - Railway Production
EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app

# Application Configuration
EXPO_PUBLIC_APP_NAME="Genki TCG"
EXPO_PUBLIC_APP_VERSION="0.1.0"
```

**To create/update:**
```bash
# Copy from example (if needed)
copy apps\mobile\.env.example apps\mobile\.env

# Then edit apps\mobile\.env
notepad apps\mobile\.env
```

### 3. Backend Configuration (Optional - Only for Local Backend)

**Note:** You're using the Railway backend, so you DON'T need to configure or run the backend locally. However, if you ever want to run a local backend for development:

**File Location:** `apps/backend/.env` (not tracked in git)

**Content Example:**
```env
# Database - You would need your own local PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/genki_tcg"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# API
PORT=3001

# CORS
CORS_ORIGINS="http://localhost:3000,http://localhost:8081"
```

**For this setup, you do NOT need to configure this since you're using Railway.**

---

## Running the Applications

### Admin Web Dashboard

The admin web dashboard is used for managing events, players, and tournaments.

**Start the admin web:**

```bash
npm run dev:admin
```

**Expected Output:**
```
> @genki-tcg/admin-web@0.1.0 dev
> next dev

   ▲ Next.js 14.1.0
   - Local:        http://localhost:3000
   - Ready in 2.5s
```

**Access the admin dashboard:**
- Open your browser to: http://localhost:3000

### Mobile App (Optional)

The mobile app is for players to register, check-in, and view tournament information.

**Start the mobile app:**

```bash
npm run dev:mobile
```

**Expected Output:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**To test the mobile app:**
- Install **Expo Go** on your phone from:
  - iOS: App Store
  - Android: Google Play Store
- Scan the QR code shown in the terminal
- The app will open in Expo Go

**Alternative - Android Emulator:**
Press `a` in the terminal to open in Android emulator (requires Android Studio)

**Alternative - iOS Simulator (Mac only):**
Press `i` in the terminal to open in iOS simulator (requires Xcode)

---

## Login Credentials

The Railway production database has been seeded with test accounts. Use these credentials to log in:

### Admin Dashboard Login

**Owner Account (Full Access):**
- **Email:** `owner@genki-tcg.com`
- **Password:** `password123`
- **Role:** OWNER (can do everything)

**Staff Account (Limited Access):**
- **Email:** `staff@genki-tcg.com`
- **Password:** `password123`
- **Role:** STAFF (can manage events but not org settings)

### Mobile App Login (Test Players)

**Player Accounts:**
- **Email:** `player1@test.com` through `player10@test.com`
- **Password:** `password123` (same for all)
- **Starting Credits:** 100 credits each

**Organization Invite Code:**
- **Code:** `GENKI`
- Use this during mobile app onboarding

---

## Troubleshooting

### Issue: "npm install" fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install
```

### Issue: Admin web shows "Failed to connect to API"

**Symptoms:**
- Login page shows but credentials don't work
- Console shows CORS errors or network errors

**Solution:**

1. **Verify environment variable:**
   ```bash
   # Check the file
   type apps\admin-web\.env.local

   # Should show:
   NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
   ```

2. **Restart the admin web server:**
   - Press `Ctrl+C` to stop
   - Run `npm run dev:admin` again
   - Environment variables are only loaded on server start

3. **Check Railway backend status:**
   - Open: https://genki-tcg-production.up.railway.app/health
   - Should return: `{"status":"ok"}`
   - If it doesn't load, the Railway backend might be down

4. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

### Issue: Mobile app shows "Network request failed"

**Symptoms:**
- Can't login or register
- App shows network errors

**Solution:**

1. **Verify environment variable:**
   ```bash
   # Check the file
   type apps\mobile\.env

   # Should show:
   EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
   ```

2. **Restart Expo:**
   - Press `Ctrl+C` to stop
   - Run `npm run dev:mobile` again
   - Reload app on phone (shake device → "Reload")

3. **Check if you're using localhost:**
   - NEVER use `localhost` or `127.0.0.1` in mobile .env
   - Always use the Railway URL: `https://genki-tcg-production.up.railway.app`

### Issue: Port 3000 already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

**Option 1: Kill the process using port 3000**
```bash
# Find the process
netstat -ano | findstr :3000

# Kill it (replace XXXX with the PID from above)
taskkill /PID XXXX /F
```

**Option 2: Use a different port**
```bash
# Set port in command
$env:PORT=3001; npm run dev:admin
```

### Issue: Can't login - "Invalid credentials"

**Checklist:**

1. **Verify you're using the correct credentials:**
   - Email: `owner@genki-tcg.com`
   - Password: `password123`

2. **Check backend URL in browser console:**
   - Open DevTools (F12) → Network tab
   - Try to login
   - Check the request URL - should be `https://genki-tcg-production.up.railway.app/auth/login`
   - If it shows `http://localhost:3001`, your environment variable is wrong

3. **Verify backend is working:**
   - Visit: https://genki-tcg-production.up.railway.app/health
   - Should return: `{"status":"ok"}`

4. **Check if data exists:**
   - Ask the backend owner to verify the database has been seeded
   - Or check Railway dashboard logs

### Issue: "Cannot find module" errors

**Symptoms:**
```
Error: Cannot find module '@genki-tcg/shared-types'
```

**Solution:**

This is a workspace dependency issue. Fix with:

```bash
# Clean install everything
npm run clean  # If this script exists
npm install

# Or manually
rmdir /s /q node_modules
rmdir /s /q apps\admin-web\node_modules
rmdir /s /q apps\backend\node_modules
rmdir /s /q apps\mobile\node_modules
del package-lock.json
npm install
```

### Issue: TypeScript errors in IDE

**Symptoms:**
- Red squiggly lines everywhere
- "Cannot find name" errors in VS Code

**Solution:**

1. **Reload VS Code:**
   - Press `Ctrl+Shift+P`
   - Type: "Reload Window"
   - Press Enter

2. **Select TypeScript version:**
   - Open any .ts file
   - Press `Ctrl+Shift+P`
   - Type: "TypeScript: Select TypeScript Version"
   - Choose "Use Workspace Version"

3. **Reinstall dependencies:**
   ```bash
   npm install
   ```

---

## Quick Reference

### Starting the Apps

```bash
# Admin Web (recommended for most use)
npm run dev:admin

# Mobile App (optional)
npm run dev:mobile

# Backend (NOT needed - using Railway)
# npm run dev:backend
```

### Default URLs

- **Admin Web:** http://localhost:3000
- **Mobile App:** Use Expo Go app to scan QR code
- **Railway Backend:** https://genki-tcg-production.up.railway.app

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@genki-tcg.com | password123 |
| Staff | staff@genki-tcg.com | password123 |
| Player | player1@test.com - player10@test.com | password123 |

### Important Files

```
genki-tcg/
├── apps/
│   ├── admin-web/
│   │   └── .env.local          ← Configure backend URL here
│   └── mobile/
│       └── .env                 ← Configure backend URL here
├── SETUP_GUIDE.md              ← This file
└── README.md                    ← Project overview
```

---

## Additional Notes

### About the Architecture

- **Backend:** Running on Railway (PostgreSQL + NestJS)
- **Admin Web:** Running locally on your machine (Next.js)
- **Mobile:** Running locally on your machine (Expo)

The frontend apps connect to the shared Railway backend, so all data is synchronized across all devices using the system.

### Data Persistence

All data (users, events, matches, credits) is stored in the Railway PostgreSQL database. Changes you make in the admin dashboard will be reflected for all users of the system.

### Making Code Changes

- **Admin Web Changes:** Hot reload is enabled - just save the file
- **Mobile Changes:** Expo will auto-reload - just save the file
- **Backend Changes:** Not applicable (backend is on Railway)

### Need Help?

If you encounter issues not covered in this guide:

1. Check the browser console for errors (F12 → Console tab)
2. Check the terminal where the dev server is running
3. Verify all environment variables are set correctly
4. Restart the dev servers
5. Clear cache and reinstall dependencies

---

## Summary Checklist

Before running the apps, verify:

- [ ] Node.js >= 20.0.0 installed
- [ ] npm >= 10.0.0 installed
- [ ] Repository cloned
- [ ] `npm install` completed successfully
- [ ] `apps/admin-web/.env.local` configured with Railway URL
- [ ] `apps/mobile/.env` configured with Railway URL
- [ ] Admin web starts successfully at http://localhost:3000
- [ ] Can login with `owner@genki-tcg.com` / `password123`

---

**Last Updated:** 2025-01-18
**Railway Backend URL:** https://genki-tcg-production.up.railway.app
