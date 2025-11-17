# Frontend-Backend Connection Setup Guide

This guide explains how to connect your frontend applications (Admin Web and Mobile) to the Railway backend and set up admin authentication.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Configuration](#backend-configuration)
3. [Frontend Configuration](#frontend-configuration)
4. [Database Seeding](#database-seeding)
5. [Testing Authentication](#testing-authentication)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ Backend deployed to Railway
- ✅ Railway URL: `https://genki-tcg-production.up.railway.app`
- ✅ PostgreSQL database connected
- ✅ Railway CLI installed (for seeding): `npm i -g @railway/cli`

---

## Backend Configuration

### 1. Update CORS Settings

The backend needs to allow requests from your frontend domains.

**In Railway Dashboard:**
1. Go to your backend service
2. Click "Variables" tab
3. Update `CORS_ORIGIN` to include your frontend URLs:

```bash
# For local development
CORS_ORIGIN=http://localhost:3000,http://localhost:8081,genki-tcg://

# For production (add your deployed URLs)
CORS_ORIGIN=https://your-admin.vercel.app,https://your-mobile-app.com,http://localhost:3000,http://localhost:8081,genki-tcg://
```

### 2. Verify Environment Variables

Ensure these are set in Railway:

```bash
DATABASE_URL=<auto-set-by-railway>
REDIS_URL=<auto-set-by-railway>
JWT_SECRET=<your-64-char-secret>
NODE_ENV=production  # or development for testing
PORT=8080
```

---

## Frontend Configuration

### Admin Web App

**File:** `apps/admin-web/.env.local` (✅ Already created)

```bash
NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
NEXT_PUBLIC_APP_NAME="Genki TCG Admin"
NEXT_PUBLIC_APP_VERSION="0.1.0"
```

**Start the admin app:**

```bash
npm run dev:admin
# Or from apps/admin-web:
npm run dev
```

### Mobile App

**File:** `apps/mobile/.env` (✅ Already created)

```bash
EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
EXPO_PUBLIC_APP_NAME="Genki TCG"
EXPO_PUBLIC_APP_VERSION="0.1.0"
```

**Start the mobile app:**

```bash
npm run dev:mobile
# Or from apps/mobile:
npm run start
```

**Note for Android Emulator:**
- If testing on Android emulator with local backend, use: `http://10.0.2.2:3001`
- If testing on physical device with local backend, use your computer's IP address

---

## Database Seeding

The database needs to be seeded with initial data including admin users.

### Option 1: Using Railway CLI (Recommended)

```bash
# 1. Login to Railway
railway login

# 2. Link to your project
railway link

# 3. Run seed script
railway run --service backend npm run db:seed --workspace=apps/backend
```

### Option 2: Using Custom Script

```bash
# 1. Get your DATABASE_URL from Railway
railway variables --service backend

# 2. Copy the DATABASE_URL value

# 3. Run the seed script
cd /path/to/genki-tcg
DATABASE_URL="your-railway-database-url" node scripts/seed-railway.js
```

### Option 3: Manual Seed from Backend

```bash
# From the backend directory
cd apps/backend
railway run npm run db:seed
```

### What Gets Created

After seeding, you'll have:

- **Organization:** Genki TCG
  - Invite Code: `GENKI`

- **Owner Account:**
  - Email: `owner@genki-tcg.com`
  - Password: `password123`
  - Role: OWNER (full admin access)

- **Staff Account:**
  - Email: `staff@genki-tcg.com`
  - Password: `password123`
  - Role: STAFF (limited admin access)

- **Test Players:** `player1@test.com` through `player10@test.com`
  - Password: `password123`
  - Each has 100 credits

- **Sample Event:** "Friday Night OPTCG" (scheduled for tomorrow at 6 PM)

---

## Testing Authentication

### 1. Test Backend Health

```bash
curl https://genki-tcg-production.up.railway.app/health
# Should return: {"status":"ok", ...}
```

### 2. Test Login Endpoint

```bash
curl -X POST https://genki-tcg-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@genki-tcg.com","password":"password123"}'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "owner@genki-tcg.com",
    "name": "Shop Owner"
  }
}
```

### 3. Test Authenticated Request

```bash
# Replace <TOKEN> with the access_token from step 2
curl https://genki-tcg-production.up.railway.app/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Run Complete Test Suite

```bash
# Make script executable (Unix/Mac)
chmod +x scripts/test-api.sh

# Run tests
./scripts/test-api.sh

# Or specify custom API URL
API_URL=https://your-url.up.railway.app ./scripts/test-api.sh
```

---

## Testing Frontend Login

### Admin Web

1. Start the admin app: `npm run dev:admin`
2. Navigate to `http://localhost:3000`
3. Login with:
   - Email: `owner@genki-tcg.com`
   - Password: `password123`
4. You should be redirected to the dashboard

### Mobile App

1. Start the mobile app: `npm run dev:mobile`
2. Open Expo Go on your device or emulator
3. Login with the same credentials
4. You should see the home screen

---

## Creating Your Own Admin Account

### Method 1: Using Signup (Requires Invite Code)

```bash
curl -X POST https://genki-tcg-production.up.railway.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "youradmin@example.com",
    "password": "YourSecurePassword123!",
    "name": "Your Name",
    "inviteCode": "GENKI"
  }'
```

**Note:** This creates a PLAYER account by default. To promote to OWNER:
- Login as `owner@genki-tcg.com`
- Go to Organization Settings
- Find the user and promote them

### Method 2: Direct Database (Advanced)

If you need to create an admin account directly in the database, you can use Prisma Studio:

```bash
railway run --service backend npx prisma studio
```

Then manually create a User and OrgMembership with role="OWNER".

---

## Troubleshooting

### Issue: "Invalid credentials" when logging in

**Cause:** Database hasn't been seeded yet.

**Solution:** Run the seed script (see [Database Seeding](#database-seeding))

### Issue: CORS error in frontend

**Cause:** Backend CORS_ORIGIN doesn't include your frontend URL.

**Solution:**
1. Go to Railway dashboard
2. Update `CORS_ORIGIN` environment variable
3. Restart the backend service

### Issue: "Cannot connect to backend" error

**Checks:**
1. Verify Railway backend is running: `curl https://genki-tcg-production.up.railway.app/health`
2. Check `.env.local` has correct `NEXT_PUBLIC_API_URL` or `.env` has `EXPO_PUBLIC_API_URL`
3. Restart your frontend app after changing environment variables

### Issue: Token expires immediately

**Cause:** JWT_EXPIRES_IN might be too short or JWT_SECRET changed.

**Solution:**
1. Check Railway environment variables
2. Set `JWT_EXPIRES_IN=7d` for 7-day tokens
3. Ensure `JWT_SECRET` is consistent and not changing

### Issue: WebSocket connection fails

**Cause:** WebSocket URL might not be correctly configured.

**Check:**
- Admin web uses same URL for both HTTP and WebSocket
- Ensure Railway supports WebSockets (it does by default)
- Check browser console for specific error messages

---

## Security Best Practices

### For Production

1. **Change Default Passwords**
   - DO NOT use `password123` in production
   - Create new admin accounts with strong passwords
   - Delete or disable test accounts

2. **Rotate JWT Secret**
   - Generate a new JWT_SECRET for production: `openssl rand -base64 64`
   - Set it in Railway environment variables

3. **Update CORS**
   - Only allow your actual frontend domains
   - Remove localhost URLs from production CORS_ORIGIN

4. **Environment Variables**
   - Never commit `.env` or `.env.local` files
   - Use Railway environment variables for sensitive data
   - Keep JWT_SECRET secret!

5. **HTTPS Only**
   - Railway provides HTTPS automatically
   - Ensure frontend makes HTTPS requests

---

## API Endpoints Reference

### Public Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check
- `POST /auth/login` - Login
- `POST /auth/signup` - Signup (requires invite code)

### Authenticated Endpoints

All require `Authorization: Bearer <token>` header:

- `GET /auth/me` - Get current user
- `GET /events` - List events
- `POST /events` - Create event (OWNER/STAFF only)
- `GET /events/:id` - Get event details
- `POST /events/:id/register` - Register for event
- `GET /rounds/:roundId/pairings` - Get round pairings
- `POST /matches/report` - Report match result
- `GET /standings/events/:eventId` - Get event standings
- `GET /credits/me` - Get my credit balance
- `GET /orgs/me` - Get my organization

For complete API documentation, see the NestJS controllers in `apps/backend/src`.

---

## Next Steps

1. ✅ Run database seed
2. ✅ Test login with admin credentials
3. ✅ Update CORS for your frontend URLs
4. ✅ Start admin web app and test login
5. ✅ Start mobile app and test login
6. ✅ Create your own admin account
7. ✅ Change default passwords
8. ✅ Deploy frontend apps (Vercel for web, Expo for mobile)

---

## Support

If you encounter issues:

1. Check Railway logs for backend errors
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Ensure database is seeded
5. Test endpoints with curl to isolate frontend vs backend issues

Good luck! 🚀
