# Genki TCG - Developer Setup Guide

Complete guide for setting up the Genki TCG project on a new development machine (Windows, macOS, or Linux).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Project Setup](#initial-project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Backend Setup](#backend-setup)
6. [Admin Web Setup](#admin-web-setup)
7. [Mobile App Setup](#mobile-app-setup)
8. [Running the Applications](#running-the-applications)
9. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
10. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

Install the following on your development machine:

#### 1. **Node.js & npm**
- **Version**: Node.js 18.x or higher
- **Download**: https://nodejs.org/
- **Verify installation**:
  ```bash
  node --version  # Should be v18.x or higher
  npm --version   # Should be 9.x or higher
  ```

#### 2. **PostgreSQL**
- **Version**: PostgreSQL 14.x or higher
- **macOS**: `brew install postgresql@14`
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Linux**: `sudo apt-get install postgresql-14`
- **Verify installation**:
  ```bash
  psql --version  # Should be 14.x or higher
  ```

#### 3. **Git**
- **Version**: Latest stable
- **Download**: https://git-scm.com/downloads
- **Verify installation**:
  ```bash
  git --version
  ```

#### 4. **Expo CLI** (for mobile development)
- **Install globally**:
  ```bash
  npm install -g expo-cli
  ```
- **Verify installation**:
  ```bash
  expo --version
  ```

#### 5. **Expo Go App** (for mobile testing)
- **iOS**: Download from App Store
- **Android**: Download from Google Play Store

### Optional but Recommended

- **VS Code**: https://code.visualstudio.com/
- **Postman** or **Insomnia**: For API testing
- **pgAdmin**: PostgreSQL GUI tool
- **Xcode** (macOS only): For iOS simulator
- **Android Studio**: For Android emulator

---

## Initial Project Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/ericsngyun/genki-tcg.git
cd genki-tcg
```

### 2. Install Dependencies

The project uses a monorepo structure with multiple applications.

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend
npm install
cd ../..

# Install admin web dependencies
cd apps/admin-web
npm install
cd ../..

# Install mobile app dependencies
cd apps/mobile
npm install
cd ../..
```

**Note**: If you encounter permission errors on macOS/Linux, avoid using `sudo`. Instead:
```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

---

## Environment Configuration

### 1. Backend Environment Variables

Create `.env` file in `apps/backend/`:

```bash
cd apps/backend
cp .env.production.example .env
```

Edit `apps/backend/.env`:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/genki_tcg"

# JWT Configuration
JWT_SECRET="your-secret-key-here-use-openssl-rand-base64-64"
JWT_EXPIRES_IN="7d"

REFRESH_TOKEN_SECRET="different-secret-key-here-use-openssl-rand-base64-64"
REFRESH_TOKEN_EXPIRES_IN="7d"

# API Configuration
API_PORT=3001
API_URL="http://localhost:3001"
CORS_ORIGINS="http://localhost:3000,http://localhost:8081,genki-tcg://"

# Discord OAuth Configuration
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
DISCORD_ALLOWED_REDIRECTS="http://localhost:3000,http://localhost:3001,http://localhost:8081,http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,http://localhost:8081/discord/callback,genki-tcg://discord/callback,genki-tcg://auth/callback"

# Node Environment
NODE_ENV="development"

# Optional: Sentry Error Tracking
SENTRY_DSN=""
```

**Generate JWT Secrets**:
```bash
# Generate JWT_SECRET
openssl rand -base64 64

# Generate REFRESH_TOKEN_SECRET (use a different value)
openssl rand -base64 64
```

### 2. Admin Web Environment Variables

Create `.env.local` file in `apps/admin-web/`:

```bash
cd apps/admin-web
cp .env.local.example .env.local
```

Edit `apps/admin-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Mobile App Environment Variables

Create `.env` file in `apps/mobile/`:

```bash
cd apps/mobile
cp .env.example .env
```

Edit `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001

# For testing on physical device, replace localhost with your computer's IP
# EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
```

**Find your local IP**:
- **macOS/Linux**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows**: `ipconfig | findstr IPv4`

### 4. Root Environment Variables

Create `.env` file in project root (optional, for convenience):

```bash
cp .env.example .env
```

---

## Database Setup

### 1. Create PostgreSQL Database

**macOS/Linux**:
```bash
# Start PostgreSQL service
brew services start postgresql@14  # macOS
sudo service postgresql start      # Linux

# Create database
createdb genki_tcg

# Or use psql
psql postgres
CREATE DATABASE genki_tcg;
\q
```

**Windows**:
```bash
# Start PostgreSQL service from Services app
# Or use pgAdmin to create database
```

### 2. Update Database URL

Update the `DATABASE_URL` in `apps/backend/.env`:

```env
# Format: postgresql://username:password@host:port/database
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/genki_tcg"
```

### 3. Run Database Migrations

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev

# Optional: Seed database with test data
npx prisma db seed
```

**Verify database setup**:
```bash
# Open Prisma Studio to view database
npx prisma studio
# Opens at http://localhost:5555
```

---

## Backend Setup

### 1. Build Shared Types Package

The backend depends on shared types, so build them first:

```bash
cd packages/shared-types
npm run build
cd ../..
```

### 2. Start Backend Server

```bash
cd apps/backend
npm run dev
```

**Expected output**:
```
Server running on http://localhost:3001
Database connected successfully
WebSocket server initialized
```

**Verify backend is running**:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 3. Test Backend API

Open your browser or Postman:
- Health Check: `GET http://localhost:3001/health`
- API Documentation: `GET http://localhost:3001/api-docs` (if configured)

---

## Admin Web Setup

### 1. Start Admin Web App

```bash
cd apps/admin-web
npm run dev
```

**Expected output**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 2. Access Admin Portal

Open browser: http://localhost:3000

**Test Login**:
- Use Discord OAuth or email/password if configured
- Create test account if needed

---

## Mobile App Setup

### 1. Configure for Your Device

**For Physical Device Testing**:

Edit `apps/mobile/.env`:
```env
# Replace with your computer's local IP address
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
```

**Find your IP**:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

### 2. Start Expo Development Server

```bash
cd apps/mobile
npm start
# or
npx expo start
```

**Expected output**:
```
Metro waiting on exp://192.168.1.XXX:8081
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

### 3. Run on Different Platforms

#### **iOS Simulator** (macOS only)
```bash
# Press 'i' in Expo terminal
# or
npm run ios
```

**Requirements**:
- Xcode installed
- iOS Simulator configured

#### **Android Emulator**
```bash
# Press 'a' in Expo terminal
# or
npm run android
```

**Requirements**:
- Android Studio installed
- Android emulator configured

#### **Web Browser**
```bash
# Press 'w' in Expo terminal
# or
npm run web
```

Opens at: http://localhost:8081

#### **Physical Device**
1. Install **Expo Go** app from App Store/Play Store
2. Scan QR code shown in terminal
3. App will load on your device

**Troubleshooting Connection Issues**:
- Ensure phone and computer are on same WiFi network
- Disable VPN if active
- Check firewall settings allow port 8081
- Try tunnel mode: `npx expo start --tunnel`

---

## Running the Applications

### Development Workflow

**Option 1: Run All Services Separately**

Terminal 1 - Backend:
```bash
cd apps/backend
npm run dev
```

Terminal 2 - Admin Web:
```bash
cd apps/admin-web
npm run dev
```

Terminal 3 - Mobile:
```bash
cd apps/mobile
npm start
```

**Option 2: Use Root Scripts** (if configured)

```bash
# From project root
npm run dev:backend
npm run dev:admin
npm run dev:mobile
```

### Testing Discord OAuth

#### 1. Create Discord Application

1. Go to https://discord.com/developers/applications
2. Create New Application → "Genki TCG Dev"
3. Navigate to OAuth2 section

#### 2. Configure OAuth2 Settings

**Redirects URLs** (add all):
```
http://localhost:3001/auth/discord/callback
http://localhost:3001/auth/discord/mobile-callback
http://localhost:8081/discord/callback
genki-tcg://auth/callback
genki-tcg://discord/callback
```

**Scopes**: Select `identify` and `email`

#### 3. Get Credentials

Copy:
- **Client ID**: `123456789012345678`
- **Client Secret**: `abc123...`

#### 4. Update Environment Variables

Update in `apps/backend/.env`:
```env
DISCORD_CLIENT_ID="your-client-id-here"
DISCORD_CLIENT_SECRET="your-client-secret-here"
```

#### 5. Restart Backend

```bash
cd apps/backend
# Stop server (Ctrl+C)
npm run dev
```

---

## Common Issues & Troubleshooting

### Database Connection Issues

**Error**: `connection refused` or `ECONNREFUSED`

**Solutions**:
```bash
# Check if PostgreSQL is running
# macOS
brew services list | grep postgresql

# Linux
sudo service postgresql status

# Windows - Check Services app

# Restart PostgreSQL
brew services restart postgresql@14  # macOS
sudo service postgresql restart      # Linux
```

### Port Already in Use

**Error**: `Port 3001 is already in use`

**Solutions**:
```bash
# Find process using port
# macOS/Linux
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Prisma Migration Errors

**Error**: `Migration failed`

**Solutions**:
```bash
cd apps/backend

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create fresh migration
npx prisma migrate dev --name init
```

### Mobile App Won't Connect to Backend

**Error**: `Network request failed`

**Solutions**:

1. **Check IP address is correct**:
   ```bash
   # Verify in apps/mobile/.env
   EXPO_PUBLIC_API_URL=http://YOUR-IP:3001
   ```

2. **Test backend is accessible**:
   ```bash
   # From your phone's browser, visit:
   http://YOUR-IP:3001/health
   ```

3. **Check firewall**:
   - macOS: System Preferences → Security & Privacy → Firewall
   - Windows: Windows Defender Firewall → Allow app

4. **Try tunnel mode**:
   ```bash
   cd apps/mobile
   npx expo start --tunnel
   ```

### Discord OAuth Not Working

**Error**: `redirect_uri_mismatch`

**Solutions**:

1. Verify redirect URIs in Discord Developer Portal match `.env`:
   ```env
   DISCORD_ALLOWED_REDIRECTS="http://localhost:3001/auth/discord/callback,..."
   ```

2. Check client ID and secret are correct

3. Restart backend after changing OAuth settings

### Module Not Found Errors

**Error**: `Cannot find module '@genki-tcg/shared-types'`

**Solution**:
```bash
# Rebuild shared types
cd packages/shared-types
npm run build
cd ../..

# Reinstall dependencies
cd apps/backend
rm -rf node_modules package-lock.json
npm install
```

### Expo Go Connection Issues

**Error**: `Unable to connect to Metro`

**Solutions**:

1. **Restart Expo**:
   ```bash
   # Stop Expo (Ctrl+C)
   npx expo start --clear
   ```

2. **Check same WiFi network**:
   - Phone and computer must be on same network
   - Disable VPN

3. **Use tunnel mode**:
   ```bash
   npx expo start --tunnel
   ```

---

## Production Deployment

### Backend Deployment (Railway/Heroku)

1. **Set environment variables** in Railway/Heroku dashboard
2. **Push to production**:
   ```bash
   git push railway main  # or heroku main
   ```
3. **Run migrations**:
   ```bash
   railway run npx prisma migrate deploy
   # or
   heroku run npx prisma migrate deploy
   ```

### Admin Web Deployment (Vercel)

1. **Connect GitHub repository** to Vercel
2. **Set environment variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```
3. **Deploy**: Automatic on push to main

### Mobile App Deployment

#### TestFlight (iOS)
1. Build with EAS:
   ```bash
   cd apps/mobile
   npx eas build --platform ios
   ```
2. Submit to TestFlight:
   ```bash
   npx eas submit --platform ios
   ```

#### Google Play (Android)
1. Build with EAS:
   ```bash
   cd apps/mobile
   npx eas build --platform android
   ```
2. Submit to Play Console:
   ```bash
   npx eas submit --platform android
   ```

---

## Quick Start Checklist

Use this checklist for setting up on a new machine:

- [ ] Install Node.js 18+
- [ ] Install PostgreSQL 14+
- [ ] Install Git
- [ ] Install Expo CLI
- [ ] Clone repository
- [ ] Install all dependencies (`npm install` in root, backend, admin-web, mobile)
- [ ] Create PostgreSQL database
- [ ] Configure `.env` files (backend, admin-web, mobile)
- [ ] Generate JWT secrets
- [ ] Set up Discord OAuth app
- [ ] Run Prisma migrations
- [ ] Build shared-types package
- [ ] Start backend server
- [ ] Start admin web app
- [ ] Start mobile app
- [ ] Test all applications

---

## Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev/docs
- **Discord OAuth Guide**: https://discord.com/developers/docs/topics/oauth2

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the GitHub Issues: https://github.com/ericsngyun/genki-tcg/issues
2. Review existing documentation in the `docs/` folder
3. Ask in the team Discord/Slack channel
4. Create a new issue with detailed error logs

---

**Last Updated**: December 2024
**Project Version**: 1.0.0
**Node Version**: 18.x
**Database**: PostgreSQL 14+
