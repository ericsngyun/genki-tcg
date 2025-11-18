# Genki TCG - Development Setup Guide

This guide will help you set up the Genki TCG Tournament Management System on any machine, including cloned repositories.

## Prerequisites

- **Node.js**: v18 or higher ([download](https://nodejs.org/))
- **PostgreSQL**: v14 or higher ([download](https://www.postgresql.org/download/))
- **Redis** (optional, for real-time features): v6 or higher ([download](https://redis.io/download))
- **Git**: For version control

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd genki-tcg
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (backend, admin-web, mobile).

### 3. Environment Configuration

#### Root Environment (.env)

Copy the example environment file:

```bash
cp .env.example .env
```

**IMPORTANT**: Generate secure secrets for JWT:

```bash
# Generate JWT_SECRET
openssl rand -base64 64

# Generate REFRESH_TOKEN_SECRET (use a different value!)
openssl rand -base64 64
```

Update your `.env` file with the generated secrets:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/genki_tcg"

# JWT Secrets (REPLACE WITH GENERATED VALUES!)
JWT_SECRET="<paste-first-generated-secret-here>"
JWT_EXPIRES_IN="15m"

REFRESH_TOKEN_SECRET="<paste-second-generated-secret-here>"
REFRESH_TOKEN_EXPIRES_IN="7d"

# API
API_PORT=3001
API_URL="http://localhost:3001"

# CORS - Allow frontend apps to connect
CORS_ORIGINS="http://localhost:3000,http://localhost:8081,genki-tcg://"

# Admin Web
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Mobile
EXPO_PUBLIC_API_URL="http://localhost:3001"

# Organization
DEFAULT_ORG_SLUG="genki"
DEFAULT_INVITE_CODE="GENKI"

# Environment
NODE_ENV="development"
```

#### Mobile App Environment

```bash
cd apps/mobile
cp .env.example .env
```

Update the mobile `.env`:

```env
# For iOS Simulator / Web
EXPO_PUBLIC_API_URL=http://localhost:3001

# For Android Emulator (use special IP)
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3001

# For physical device (use your computer's local network IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
```

### 4. Database Setup

#### Create the Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE genki_tcg;
CREATE USER genki_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE genki_tcg TO genki_user;
\q
```

#### Update DATABASE_URL

In your root `.env`:

```env
DATABASE_URL="postgresql://genki_user:your_password@localhost:5432/genki_tcg"
```

#### Run Migrations

```bash
cd apps/backend
npx prisma migrate dev
```

This will:
- Apply all database migrations
- Generate Prisma Client
- Create the database schema

#### Seed the Database (Optional)

```bash
npx prisma db seed
```

This creates test users and sample data.

### 5. Start Development Servers

#### Backend API

```bash
cd apps/backend
npm run dev
```

The API will start at `http://localhost:3001`

#### Admin Web Dashboard

```bash
cd apps/admin-web
npm run dev
```

The admin dashboard will start at `http://localhost:3000`

#### Mobile App

```bash
cd apps/mobile
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web
- Scan QR code with Expo Go app for physical device

## Cloning to a New Device

When setting up on a new machine:

1. **Pull the latest code**:
   ```bash
   git pull origin main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment files**:
   - Copy `.env.example` to `.env`
   - Generate NEW JWT secrets (don't reuse from other machines!)
   - Update DATABASE_URL with your local database credentials

4. **Set up database**:
   - Create the PostgreSQL database
   - Run migrations: `cd apps/backend && npx prisma migrate dev`

5. **Start servers** as described above

## Database Migrations

### Creating a New Migration

When you modify the Prisma schema:

```bash
cd apps/backend
npx prisma migrate dev --name descriptive_migration_name
```

### Applying Migrations on Another Machine

After pulling changes with new migrations:

```bash
cd apps/backend
npx prisma migrate dev
```

### Reset Database (Warning: Deletes all data!)

```bash
cd apps/backend
npx prisma migrate reset
```

## Testing

### Backend API Tests

```bash
cd apps/backend
npm run test
```

### E2E Tests

```bash
cd apps/backend
npm run test:e2e
```

## Common Issues

### Database Connection Errors

**Error**: `Can't reach database server`

**Solution**:
1. Ensure PostgreSQL is running:
   ```bash
   # macOS
   brew services start postgresql

   # Linux
   sudo service postgresql start

   # Windows
   # Start PostgreSQL from Services
   ```

2. Verify DATABASE_URL is correct in `.env`
3. Test connection:
   ```bash
   psql postgresql://user:pass@localhost:5432/genki_tcg
   ```

### JWT Secret Errors

**Error**: `JWT_SECRET is not defined`

**Solution**:
1. Ensure `.env` file exists in root directory
2. Generate secrets using `openssl rand -base64 64`
3. Restart the backend server

### Mobile App Can't Connect to API

**Error**: Network request failed

**Solution**:
1. **iOS Simulator**: Use `http://localhost:3001`
2. **Android Emulator**: Use `http://10.0.2.2:3001`
3. **Physical Device**: Use your computer's local IP (e.g., `http://192.168.1.5:3001`)
4. Ensure backend is running
5. Check firewall settings

### Prisma Client Out of Sync

**Error**: `Prisma Client did not initialize yet`

**Solution**:
```bash
cd apps/backend
npx prisma generate
```

## Default Test Accounts

After seeding, you can use these accounts:

**Players**:
- Email: `player1@test.com` / Password: `password123`
- Email: `player2@test.com` / Password: `password123`

**Admin**:
- Email: `admin@test.com` / Password: `admin123`

**Invite Code**: `GENKI`

## API Documentation

Once the backend is running, access API documentation at:

- **Swagger/OpenAPI**: `http://localhost:3001/api/docs` (if configured)
- **Tournament Flow API**: See `TOURNAMENT_FLOW_API.md`

## Production Deployment

For production deployment instructions, see `DEPLOYMENT.md`.

## Troubleshooting

If you encounter issues:

1. Check all services are running (PostgreSQL, backend, frontend)
2. Verify `.env` files are correctly configured
3. Ensure database migrations are up to date
4. Check logs for specific error messages
5. Try clearing node_modules and reinstalling:
   ```bash
   rm -rf node_modules
   npm install
   ```

## Getting Help

- Check existing documentation in `/docs`
- Review `TOURNAMENT_FLOW_API.md` for API details
- Check GitHub issues
- Contact the development team

## Architecture Overview

```
genki-tcg/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── auth/     # Authentication & JWT
│   │   │   ├── events/   # Tournament events
│   │   │   ├── matches/  # Match result reporting
│   │   │   ├── rounds/   # Swiss pairings
│   │   │   └── standings/# Rankings calculation
│   │   └── prisma/       # Database schema & migrations
│   ├── admin-web/        # Next.js admin dashboard
│   └── mobile/           # React Native Expo app
├── packages/
│   └── tournament-logic/ # Swiss pairing algorithm
└── .env                  # Environment configuration
```

## Next Steps

1. Explore the admin dashboard at `http://localhost:3000`
2. Create a test tournament
3. Register players via mobile app
4. Test the tournament flow
5. Review `TOURNAMENT_FLOW_API.md` for advanced features

Happy coding!
