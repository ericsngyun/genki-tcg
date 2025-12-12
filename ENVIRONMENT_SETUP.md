# Environment Setup Guide

This guide explains how to configure your development environment for Genki TCG. You have two main options:

1. **Railway Backend** - Use the production backend (recommended for frontend-only development)
2. **Local Backend** - Run the full stack locally (recommended for backend development)

## Quick Decision Guide

**Use Railway Backend when:**
- You're working on frontend features (mobile or admin web)
- You don't need to modify backend code
- You want access to production data
- You want faster setup (no database migrations needed)

**Use Local Backend when:**
- You're developing backend features
- You're testing backend API changes
- You want to work offline
- You need to run backend tests

---

## Option 1: Railway Backend (Frontend Development)

This setup connects your local frontends to the Railway production backend.

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Setup Steps

#### 1. Configure Admin Web
```bash
# Create environment file
cp apps/admin-web/.env.local.example apps/admin-web/.env.local
```

Edit `apps/admin-web/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
NEXT_PUBLIC_APP_NAME="Genki TCG Admin"
NEXT_PUBLIC_APP_VERSION="0.1.0"
```

#### 2. Configure Mobile App
```bash
# The .env file should already exist
```

Edit `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
EXPO_PUBLIC_APP_NAME="Genki TCG"
EXPO_PUBLIC_APP_VERSION="0.1.0"
```

#### 3. Start Development

**Admin Web:**
```bash
npm run dev:admin
# Open http://localhost:3000
# Login: owner@genki-tcg.com / password123
```

**Mobile:**
```bash
npm run dev:mobile
# Scan QR code with Expo Go app
```

### Troubleshooting Railway Backend

**CORS Errors:**
- Ensure you're using the exact Railway URL (including https://)
- Check that Railway backend is running
- Verify Railway CORS_ORIGINS includes your local URLs

**Authentication Issues:**
- Clear browser/app storage and try logging in again
- Verify Discord OAuth is configured for the Railway callback URL

---

## Option 2: Local Backend (Full Stack Development)

This setup runs the entire stack locally including PostgreSQL, Redis, and the NestJS backend.

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker Desktop (for PostgreSQL and Redis)

### Setup Steps

#### 1. Install Docker Desktop
Download and install from: https://www.docker.com/products/docker-desktop/

Verify installation:
```bash
docker --version
docker-compose --version
```

#### 2. Start Database Services
```bash
# Start PostgreSQL and Redis containers
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker ps
# You should see: genki-tcg-db and genki-tcg-redis
```

#### 3. Configure Backend Environment

```bash
# Copy the local development example
cp apps/backend/.env.local.example apps/backend/.env
```

**IMPORTANT:** Generate secure JWT secrets:
```bash
# Windows (PowerShell)
# Install OpenSSL if not available: https://slproweb.com/products/Win32OpenSSL.html
openssl rand -base64 64

# Generate two different secrets and update .env:
# - JWT_SECRET
# - REFRESH_TOKEN_SECRET
```

Edit `apps/backend/.env` with your generated secrets:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/genki_tcg"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="your-generated-secret-here"
JWT_EXPIRES_IN="7d"

REFRESH_TOKEN_SECRET="your-different-generated-secret-here"
REFRESH_TOKEN_EXPIRES_IN="7d"

DISCORD_CLIENT_ID="1441953820820373639"
DISCORD_CLIENT_SECRET="your-discord-secret"
DISCORD_ALLOWED_REDIRECTS="http://localhost:3000,http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,http://localhost:8081,genki-tcg://"

API_PORT=3001
API_URL="http://localhost:3001"
CORS_ORIGINS="http://localhost:3000,http://localhost:8081,genki-tcg://"

NODE_ENV="development"
```

#### 4. Setup Database

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### 5. Configure Frontends for Local Backend

**Admin Web** - Edit `apps/admin-web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Mobile** - Edit `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

#### 6. Start Development

**Terminal 1 - Backend:**
```bash
npm run dev:backend
# Backend running on http://localhost:3001
```

**Terminal 2 - Admin Web (optional):**
```bash
npm run dev:admin
# Admin web running on http://localhost:3000
```

**Terminal 3 - Mobile (optional):**
```bash
npm run dev:mobile
# Expo dev server with QR code
```

### Troubleshooting Local Backend

**Database Connection Errors:**
```bash
# Check if PostgreSQL container is running
docker ps | grep genki-tcg-db

# Check container logs
docker logs genki-tcg-db

# Restart containers
docker-compose -f docker-compose.dev.yml restart
```

**Migration Errors:**
```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Re-run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

**Port Already in Use:**
```bash
# Find process using port 3001 (Windows)
netstat -ano | findstr :3001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Redis Connection Errors:**
```bash
# Check if Redis container is running
docker ps | grep genki-tcg-redis

# Check Redis logs
docker logs genki-tcg-redis

# Test Redis connection
docker exec -it genki-tcg-redis redis-cli ping
# Should return: PONG
```

---

## Switching Between Environments

### Railway → Local

1. Update `apps/backend/.env` with local database settings
2. Update `apps/admin-web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001`
3. Update `apps/mobile/.env`: `EXPO_PUBLIC_API_URL=http://localhost:3001`
4. Start Docker containers: `docker-compose -f docker-compose.dev.yml up -d`
5. Run migrations: `npm run db:migrate`
6. Seed data: `npm run db:seed`
7. Start backend: `npm run dev:backend`

### Local → Railway

1. Update `apps/admin-web/.env.local`: `NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app`
2. Update `apps/mobile/.env`: `EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app`
3. Stop local backend (Ctrl+C)
4. Stop Docker containers: `docker-compose -f docker-compose.dev.yml down`

---

## Environment File Reference

### Backend (`apps/backend/.env`)
- **Local:** Database and Redis URLs point to localhost
- **Railway:** Not used (Railway has its own environment variables)

### Admin Web (`apps/admin-web/.env.local`)
- **Local:** `NEXT_PUBLIC_API_URL=http://localhost:3001`
- **Railway:** `NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app`

### Mobile (`apps/mobile/.env`)
- **Local:** `EXPO_PUBLIC_API_URL=http://localhost:3001`
- **Railway:** `EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app`
- **Physical Device:** Use your computer's IP (e.g., `http://192.168.1.100:3001`)

---

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Generate unique JWT secrets** - Use `openssl rand -base64 64`
3. **Different secrets per environment** - Production should have different secrets than development
4. **Rotate secrets regularly** - See `SECURITY_ROTATION_GUIDE.md`
5. **Discord OAuth secrets** - Keep these secure and never commit them

---

## Common Issues

### "Cannot connect to backend"
- Check if backend is running (`http://localhost:3001/health`)
- Verify frontend .env files have correct API_URL
- Check CORS settings in backend

### "Database migration failed"
- Ensure Docker containers are running
- Check DATABASE_URL is correct
- Try resetting database: `npm run db:reset`

### "Expo can't connect to backend"
- When using physical device, use your computer's IP address
- Ensure both device and computer are on the same network
- Update `EXPO_PUBLIC_API_URL` with your IP
- Check firewall isn't blocking connections

### "Discord OAuth redirect error"
- Verify callback URLs in Discord Developer Portal
- Check DISCORD_ALLOWED_REDIRECTS includes all necessary URLs
- Clear browser/app cache and try again

---

## Next Steps

- **Frontend Development:** See `SETUP_GUIDE.md` for detailed frontend setup
- **Backend Development:** See `BACKEND_ARCHITECTURE.md` for architecture details
- **Testing:** See `TESTING_GUIDE.md` for running tests
- **Deployment:** See `RAILWAY_PRODUCTION_SETUP.md` for production deployment
