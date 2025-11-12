# Genki TCG Setup Guide

Complete setup instructions for database, authentication, and external services.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** >= 14 (or access to hosted Postgres)
- **Redis** >= 7 (for caching and real-time features)
- **Git**

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd genki-tcg
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials (see sections below)

# 3. Set up database
cd apps/backend
npx prisma generate
npx prisma migrate dev
npm run db:seed

# 4. Start development servers
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Admin Web
npm run dev:admin

# Terminal 3: Mobile (optional)
npm run dev:mobile
```

## Database Setup

### Option 1: Neon (Recommended for Cloud)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env`:

```env
DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Option 2: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the "Connection string" (Transaction mode)
5. Add to `.env`:

```env
DATABASE_URL="postgresql://postgres.xyz:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Option 3: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb genki_tcg

# Add to .env
DATABASE_URL="postgresql://localhost:5432/genki_tcg"
```

### Run Migrations

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

This creates:
- Genki organization (invite code: GENKI)
- Owner account: `owner@genki-tcg.com` / `password123`
- Staff account: `staff@genki-tcg.com` / `password123`
- 10 test players: `player1@test.com` ... `player10@test.com` / `password123`

## Redis Setup

### Option 1: Upstash (Recommended for Cloud)

1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy the connection URL
4. Add to `.env`:

```env
REDIS_URL="rediss://default:[PASSWORD]@xyz.upstash.io:6379"
```

### Option 2: Local Redis

```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Add to .env
REDIS_URL="redis://localhost:6379"
```

## Authentication Setup

### Option 1: Clerk (Recommended)

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Get your API keys from Dashboard > API Keys
4. Add to `.env`:

```env
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

5. Update auth logic in `apps/backend/src/auth/` to use Clerk SDK

### Option 2: Supabase Auth

1. In your Supabase project, go to Settings > API
2. Copy the URL and anon/service keys
3. Add to `.env`:

```env
SUPABASE_URL="https://xyz.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

4. Update auth logic to use Supabase Auth SDK

### Option 3: Custom JWT (Current Implementation)

The codebase currently uses custom JWT authentication with bcrypt hashing.

**Security Note:** Change the JWT secret in production!

```env
JWT_SECRET="your-secure-random-secret-change-this"
JWT_EXPIRES_IN="7d"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Push Notifications (Expo)

### Development

For local development, Expo handles push notifications automatically through Expo Go app.

### Production

1. Sign up at [expo.dev](https://expo.dev)
2. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. Configure project:
   ```bash
   cd apps/mobile
   eas build:configure
   ```
4. Get your Expo access token from [expo.dev/accounts/[account]/settings/access-tokens](https://expo.dev/accounts)
5. Add to `.env`:
   ```env
   EXPO_ACCESS_TOKEN="your-token"
   ```

### FCM/APNs (Optional, for later)

For direct FCM/APNs integration without Expo:

- **Android (FCM)**: Follow [Firebase Cloud Messaging setup](https://firebase.google.com/docs/cloud-messaging)
- **iOS (APNs)**: Requires Apple Developer account and certificates

## Observability (Optional)

### Sentry

1. Sign up at [sentry.io](https://sentry.io)
2. Create projects for backend, admin-web, and mobile
3. Add to `.env`:

```env
SENTRY_DSN="https://xyz@sentry.io/123"
SENTRY_ORG="your-org"
SENTRY_PROJECT="genki-tcg-backend"
```

4. Install Sentry SDKs (already in package.json dependencies)

### PostHog (Optional)

For product analytics:

1. Sign up at [posthog.com](https://posthog.com)
2. Get your API key
3. Add integration in frontend apps

## Deployment

### Backend (Fly.io / Render / Heroku)

#### Fly.io

```bash
cd apps/backend
fly launch
fly secrets set DATABASE_URL="..." JWT_SECRET="..." REDIS_URL="..."
fly deploy
```

#### Render

1. Create new Web Service
2. Connect GitHub repo
3. Build command: `npm install && npm run build --workspace=apps/backend`
4. Start command: `npm run start:prod --workspace=apps/backend`
5. Add environment variables in dashboard

### Admin Web (Vercel)

```bash
cd apps/admin-web
vercel
# Follow prompts and add environment variables
```

Or connect GitHub repo in Vercel dashboard.

### Mobile (EAS Build)

```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

## Environment Variables Reference

Complete `.env` file:

```env
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# Auth (choose one)
# Option 1: Clerk
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Option 2: Supabase
# SUPABASE_URL="https://..."
# SUPABASE_ANON_KEY="..."
# SUPABASE_SERVICE_ROLE_KEY="..."

# Option 3: Custom JWT (current)
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# API
API_PORT=3001
API_URL="http://localhost:3001"

# Admin Web
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Mobile
EXPO_PUBLIC_API_URL="http://localhost:3001"

# Push Notifications
EXPO_ACCESS_TOKEN=""

# Observability (optional)
SENTRY_DSN=""
SENTRY_ORG=""
SENTRY_PROJECT=""

# Organization
DEFAULT_ORG_SLUG="genki"
DEFAULT_INVITE_CODE="GENKI"

# Node
NODE_ENV="development"
```

## Testing

### Run Tests

```bash
# All tests
npm test

# Tournament logic tests (pairing & standings)
cd packages/tournament-logic
npm test

# Backend tests
cd apps/backend
npm test

# Coverage
npm run test:cov
```

### Manual Testing

1. Start all servers (backend, admin, mobile)
2. Test authentication:
   - Sign up with invite code "GENKI"
   - Login with test accounts
3. Test credits:
   - View balance
   - Staff: adjust credits
4. Test events:
   - Create event
   - Register players
   - Check in
   - Generate round
5. Test pairings:
   - Create round with 8+ players
   - Verify no rematches
   - Check bye assignment

## Troubleshooting

### Database connection fails

- Check DATABASE_URL format
- Verify PostgreSQL is running (local)
- Check firewall rules (cloud)
- Ensure SSL mode is correct for cloud providers

### Prisma errors

```bash
# Regenerate Prisma client
cd apps/backend
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Module not found errors

```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
```

### Mobile app won't start

```bash
cd apps/mobile
npx expo start --clear
```

## Next Steps

After setup:

1. **Customize branding**: Update organization name, colors, logo in database
2. **Add staff members**: Invite staff via admin panel (TODO: implement invite flow)
3. **Configure event defaults**: Set default round times, entry fees
4. **Test tournament flow**: Run a full test tournament with 8-16 players
5. **Set up backups**: Configure automated PostgreSQL backups
6. **Configure monitoring**: Set up Sentry alerts and uptime monitoring

## Support

For issues or questions:

- Check existing GitHub issues
- Review API documentation in `apps/backend/src/`
- Check database schema in `apps/backend/prisma/schema.prisma`

## Security Checklist

Before production:

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS for all endpoints
- [ ] Configure CORS for production domains only
- [ ] Set up rate limiting
- [ ] Enable Prisma query logging in production
- [ ] Configure automated database backups
- [ ] Set up monitoring and alerting
- [ ] Review and test RBAC permissions
- [ ] Audit log all sensitive operations
