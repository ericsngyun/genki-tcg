# Quick Start Guide - Testing the Mobile App

> **📱 For detailed mobile app setup, troubleshooting, and architecture:**
> See [apps/mobile/MOBILE_SETUP_GUIDE.md](apps/mobile/MOBILE_SETUP_GUIDE.md)

## Prerequisites Check

Before starting, ensure you have:

- ✅ Node.js installed (`node --version` should show v18+)
- ✅ PostgreSQL installed and running
- ✅ Dependencies installed (`npm install` from root)
- ✅ Database migrations run (see below)
- ✅ Environment variables configured (`.env` file)

---

## Step 1: Database Setup (One-time)

### Check if PostgreSQL is Running

**Windows**:
- Press `Win + R`, type `services.msc`
- Look for "postgresql-x64-XX" service
- If not running, right-click → Start

**Or via command**:
```bash
# Test connection
psql -U postgres

# If it works, you're good!
# Type \q to exit
```

### Create Database (if not done already)

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE genki_tcg;
\q
```

### Run Migrations

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

### Seed Test Data (Optional but Recommended)

```bash
cd apps/backend
npx prisma db seed
```

This creates:
- **Admin**: `admin@test.com` / `admin123`
- **Player 1**: `player1@test.com` / `password123`
- **Player 2**: `player2@test.com` / `password123`
- **Organization**: Invite code `GENKI`

---

## Step 2: Configure Environment

### Backend (.env in root)

Ensure you have a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/genki_tcg"

JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="15m"

REFRESH_TOKEN_SECRET="your-super-secret-refresh-key-here"
REFRESH_TOKEN_EXPIRES_IN="7d"

API_PORT=3001
CORS_ORIGINS="http://localhost:3000,http://localhost:8081,genki-tcg://"

NODE_ENV="development"
```

### Mobile (.env in apps/mobile)

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**For Android Emulator**:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

---

## Step 3: Start the Backend

### Option A: Using npm (Recommended)

```bash
cd apps/backend
npm run dev
```

You should see:
```
[Nest] XXXX  - XX/XX/XXXX, XX:XX:XX AM     LOG [NestFactory] Starting Nest application...
[Nest] XXXX  - XX/XX/XXXX, XX:XX:XX AM     LOG [InstanceLoader] AppModule dependencies initialized
...
[Nest] XXXX  - XX/XX/XXXX, XX:XX:XX AM     LOG [NestApplication] Nest application successfully started
[Nest] XXXX  - XX/XX/XXXX, XX:XX:XX AM     LOG Application is running on: http://localhost:3001
```

### Option B: Using the batch file

```bash
cd apps/backend
./start-backend.bat
```

### Verify Backend is Running

Open browser: http://localhost:3001/health

Should see:
```json
{
  "status": "ok"
}
```

---

## Step 4: Start the Mobile App

### Open a NEW terminal (keep backend running)

```bash
cd apps/mobile
npx expo start
```

### Choose Your Testing Method:

**1. Web Browser (Easiest)**:
- Press `w` in the terminal
- Opens at http://localhost:8081
- Press F12 → Toggle Device Toolbar (Ctrl+Shift+M)
- Select "iPhone 12 Pro" or similar

**2. Android Emulator** (if installed):
- Start Android emulator first
- Press `a` in the terminal

**3. Physical Device**:
- Install Expo Go app
- Scan QR code shown in terminal

---

## Step 5: Test the Tournament Flow

### 1. Login to Admin Web (Optional - to create tournament)

```bash
# Open another terminal
cd apps/admin-web
npm run dev
```

Open: http://localhost:3000

- Login: `admin@test.com` / `admin123`
- Create a test tournament
- Note the tournament ID

### 2. Mobile App Testing

#### As Player 1:

1. **Login**:
   - Email: `player1@test.com`
   - Password: `password123`

2. **Register for Tournament**:
   - Go to Events tab
   - Click "Register" on the test tournament
   - Click "Check In"

#### As Player 2 (to test match confirmation):

1. Open a different browser/incognito
2. Login as `player2@test.com` / `password123`
3. Register and check-in for the same tournament

#### Testing Match Flow:

1. **Admin starts tournament** (via admin web at localhost:3000)
   - This changes status to `IN_PROGRESS`

2. **Player 1 mobile app**:
   - Refresh Events screen
   - Click "View Active Match" button
   - See opponent (Player 2) and table number
   - Click "I Won" button
   - Confirm the alert

3. **Player 2 mobile app**:
   - Refresh Events screen
   - Click "View Active Match"
   - See "Opponent Reported Result"
   - Click "Confirm" button

4. **Check Standings**:
   - Both players can now view updated standings
   - See rankings with match records

---

## Common Issues & Solutions

### Error: "Cannot find module 'dist/main'"

**Solution**: Use `npm run dev` instead of `npm start`

The dev command (`nest start --watch`) runs in watch mode and handles compilation automatically.

### Error: "Port 3001 is already in use"

**Solution**: Kill the process using port 3001

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Or change the port in .env
API_PORT=3002
```

### Error: "Cannot connect to database"

**Solution**:
1. Ensure PostgreSQL is running (check Services)
2. Verify `DATABASE_URL` in `.env` is correct
3. Test connection: `psql -U postgres -d genki_tcg`

### Mobile app can't connect to API

**Solution**:
1. Backend must be running first
2. Check `.env` in `apps/mobile`
3. For Android emulator, use `http://10.0.2.2:3001`
4. For physical device, use your computer's IP: `http://192.168.1.XXX:3001`

### Expo shows "Unable to resolve module"

**Solution**:
```bash
cd apps/mobile
rm -rf node_modules
npm install
npx expo start -c  # -c clears cache
```

---

## Quick Command Reference

### Start Everything (3 terminals)

**Terminal 1 - Backend**:
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Mobile**:
```bash
cd apps/mobile
npx expo start
# Press 'w' for web
```

**Terminal 3 - Admin Web** (optional):
```bash
cd apps/admin-web
npm run dev
```

### Database Commands

```bash
cd apps/backend

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# View data in browser
npx prisma studio

# Create new migration
npx prisma migrate dev --name description

# Seed test data
npx prisma db seed
```

### Stop Everything

- Press `Ctrl + C` in each terminal
- Or close the terminal windows

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Mobile app loads in browser
- [ ] Can login as player
- [ ] Can register for tournament
- [ ] Can check-in
- [ ] Admin can start tournament
- [ ] "View Active Match" button appears
- [ ] Can see opponent and table number
- [ ] Can report match result
- [ ] Opponent can confirm result
- [ ] Standings update correctly
- [ ] Can drop from tournament

---

## Next Steps

Once basic testing works:
1. Test with Android emulator for full mobile experience
2. Test with two physical devices for real match confirmation flow
3. Try different match results (Win/Loss/Draw)
4. Test Bo3 game score entry
5. Test dropping from tournament

---

## Getting Help

If you encounter issues:
1. Check terminal output for error messages
2. Verify all services are running (PostgreSQL, backend, mobile)
3. Check browser console (F12) for frontend errors
4. Ensure environment variables are correctly set
5. Try restarting all services

Happy testing! 🎮
