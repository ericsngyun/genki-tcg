# Quick Start Guide - Connect Frontend to Backend

Follow these steps to connect your frontend applications to the Railway backend and start testing.

## 🚀 5-Minute Setup

### Step 1: Seed the Database (Required - Only Once)

Choose one method:

**Option A - Railway CLI (Recommended):**
```bash
railway login
railway link
railway run --service backend npm run db:seed --workspace=apps/backend
```

**Option B - Direct Script:**
```bash
# Get DATABASE_URL from Railway dashboard
DATABASE_URL="your-railway-database-url" node scripts/seed-railway.js
```

✅ **This creates:** Owner account (`owner@genki-tcg.com` / `password123`)

### Step 2: Test Backend Authentication

```bash
curl -X POST https://genki-tcg-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@genki-tcg.com","password":"password123"}'
```

✅ **Expected:** You should get back an `access_token`

### Step 3: Start Admin Web App

```bash
cd apps/admin-web
npm install  # if you haven't already
npm run dev
```

Then open `http://localhost:3000` and login with:
- Email: `owner@genki-tcg.com`
- Password: `password123`

✅ **Expected:** You should be logged in and see the dashboard

### Step 4: Start Mobile App (Optional)

```bash
cd apps/mobile
npm install  # if you haven't already
npm run start
```

Then scan the QR code with Expo Go and login with the same credentials.

---

## ✅ What's Already Configured

The following files have been created for you:

### Frontend Environment Files
- ✅ `apps/admin-web/.env.local` - Points to Railway backend
- ✅ `apps/admin-web/.env.local.example` - Template for other developers
- ✅ `apps/mobile/.env` - Points to Railway backend
- ✅ `apps/mobile/.env.example` - Template for other developers

### Helper Scripts
- ✅ `scripts/seed-railway.js` - Seed Railway database
- ✅ `scripts/seed-railway.sh` - Bash wrapper for seeding
- ✅ `scripts/test-api.sh` - Comprehensive API testing script

### Documentation
- ✅ `FRONTEND_BACKEND_SETUP.md` - Complete setup guide
- ✅ `QUICK_START.md` - This file

---

## 📝 Test Credentials (After Seeding)

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Owner** | owner@genki-tcg.com | password123 | Full admin access |
| **Staff** | staff@genki-tcg.com | password123 | Limited admin access |
| **Player** | player1@test.com | password123 | Test player account |

**Invite Code for New Signups:** `GENKI`

---

## 🔧 Troubleshooting

### "Invalid credentials" error
→ Database hasn't been seeded. Run Step 1 above.

### CORS error in browser console
→ Check Railway environment variable `CORS_ORIGINS` includes your frontend URL

### Frontend can't connect to backend
→ Verify `.env.local` or `.env` file has correct `NEXT_PUBLIC_API_URL` or `EXPO_PUBLIC_API_URL`

### "Module not found" errors in frontend
→ Run `npm install` in the app directory

---

## 🎯 Next Steps

1. **Test all features** - Create events, register players, start tournaments
2. **Create your own admin account** - Use the invite code `GENKI`
3. **Update environment variables for production**:
   - Change `NODE_ENV` to `production` in Railway
   - Update `CORS_ORIGINS` with your production URLs
   - **Change all passwords** from `password123` to secure passwords
4. **Deploy frontends**:
   - Admin Web → Vercel
   - Mobile App → Expo EAS Build

---

## 📚 Full Documentation

For complete setup instructions, see:
- **[FRONTEND_BACKEND_SETUP.md](./FRONTEND_BACKEND_SETUP.md)** - Comprehensive guide
- **[RAILWAY_SETUP.md](./RAILWAY_SETUP.md)** - Railway deployment
- **[README.md](./README.md)** - Project overview

---

## 🆘 Need Help?

Run the automated test script to check everything:

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

This will test:
- ✅ Backend health
- ✅ Authentication
- ✅ Authenticated requests
- ✅ Events endpoint
- ✅ Organization endpoint

---

**Happy Testing! 🎉**
