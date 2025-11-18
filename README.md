# Genki TCG

A store-branded TCG tournament and credits platform for One Piece TCG, inspired by Bandai TCG+.

## Architecture

- **Backend**: NestJS (Node.js, TypeScript, Prisma, PostgreSQL)
- **Admin Web**: Next.js (App Router, TypeScript, Tailwind, shadcn/ui)
- **Mobile**: React Native (Expo, TypeScript)
- **Realtime**: Socket.IO
- **Cache**: Redis
- **Auth**: Clerk or Supabase Auth

## Project Structure

```
genki-tcg/
├── apps/
│   ├── backend/          # NestJS API server
│   ├── admin-web/        # Next.js admin dashboard
│   └── mobile/           # Expo React Native app
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   └── tournament-logic/ # Swiss pairing & standings algorithms
└── package.json          # Workspace root
```

## Quick Start

**New to the project?** See the [Complete Setup Guide](./SETUP_GUIDE.md) for detailed Windows setup instructions.

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Development (Using Railway Backend)

```bash
# 1. Clone and install
git clone [YOUR_REPO_URL]
cd genki-tcg
npm install

# 2. Configure frontend apps
# Copy and edit these files with Railway backend URL:
# - apps/admin-web/.env.local
# - apps/mobile/.env

# 3. Start admin dashboard
npm run dev:admin
# Open http://localhost:3000
# Login: owner@genki-tcg.com / password123

# 4. Start mobile (optional)
npm run dev:mobile
```

### Local Backend Development (Optional)

If you need to run the backend locally:

- PostgreSQL >= 14
- Redis >= 7

```bash
# Configure backend environment
cp .env.example .env
# Edit .env with your local database credentials

# Setup database
npm run db:migrate
npm run db:seed

# Start backend
npm run dev:backend
```

## Core Features

### Player App (Mobile)
- Onboarding with invite code "GENKI"
- Credits wallet with transaction history
- Event registration and check-in
- Live pairings and standings
- Match reporting (optional)
- Push notifications

### Admin Web
- Event creation and management
- Player check-in and round management
- Swiss pairing generation
- Match result entry and overrides
- Credits adjustments with audit trail
- Real-time standings and announcements

### Tournament System
- Swiss pairing algorithm with rematch avoidance
- Tiebreakers: OMW% (floor 0.33), GW%, OGW%
- Bye assignment for odd participants
- Drop handling and round repairs
- Immutable audit trail

## Tech Quality

- TypeScript strict mode
- Comprehensive tests for pairing and standings logic
- Prisma migrations for safe schema evolution
- Structured logging and Sentry integration
- Rate limiting and input validation
- Org-scoped RBAC (Owner, Staff, Player)

## Scripts

```bash
npm run dev:backend      # Start backend in watch mode
npm run dev:admin        # Start admin web in dev mode
npm run dev:mobile       # Start Expo dev server
npm run build            # Build all apps
npm run test             # Run all tests
npm run lint             # Lint all workspaces
npm run format           # Format code with Prettier
npm run db:migrate       # Run Prisma migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with initial data
```

## Documentation

- **[Setup Guide](./SETUP_GUIDE.md)** - Complete setup instructions for Windows
- **[Backend Architecture](./BACKEND_ARCHITECTURE.md)** - Technical architecture and design decisions
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment to Railway
- **[Testing Guide](./TESTING_GUIDE.md)** - Testing strategy and running tests
- **[Product Roadmap](./PRODUCT_ROADMAP.md)** - Future features and enhancements
- **[Security Audit](./SECURITY_AUDIT.md)** - Security review and best practices

## License

Proprietary - Genki TCG
