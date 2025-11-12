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

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL >= 14
- Redis >= 7

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database, auth, and service credentials
```

### 3. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed initial data (creates Genki org and test users)
npm run db:seed

# Open Prisma Studio to inspect data
npm run db:studio
```

### 4. Development

```bash
# Run all services in separate terminals:

# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Admin Web
npm run dev:admin

# Terminal 3: Mobile (requires Expo Go app on your phone)
npm run dev:mobile
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

## License

Proprietary - Genki TCG
