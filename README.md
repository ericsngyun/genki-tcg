# Genki TCG

![CI Status](https://github.com/anthropics/genki-tcg/workflows/CI%2FCD%20Pipeline/badge.svg)
![Tests](https://img.shields.io/badge/tests-86%20passed-success)
![Coverage](https://img.shields.io/badge/coverage-22.79%25-yellow)
![Build](https://img.shields.io/badge/build-passing-success)

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

**New to the project?** Choose your development setup:

- **[Environment Setup Guide](./ENVIRONMENT_SETUP.md)** - **START HERE** - Choose between Railway (frontend-only) or Local (full stack) development
- **[Complete Setup Guide](./SETUP_GUIDE.md)** - Detailed Windows setup instructions

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- **Docker Desktop** (optional, only for local backend development)

### Quick Setup (Railway Backend - Recommended)

Use the production Railway backend for frontend development:

```bash
# 1. Clone and install
git clone [YOUR_REPO_URL]
cd genki-tcg
npm install

# 2. Configure frontend apps to use Railway
# Admin web:
cp apps/admin-web/.env.local.example apps/admin-web/.env.local
# Set NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app

# Mobile:
# Edit apps/mobile/.env
# Set EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app

# 3. Start admin dashboard
npm run dev:admin
# Open http://localhost:3000
# Login: owner@genki-tcg.com / password123

# 4. Start mobile (optional)
npm run dev:mobile
```

### Local Backend Development

For backend development or offline work:

**Prerequisites:**
- Docker Desktop (for PostgreSQL and Redis)

```bash
# 1. Start database services
docker-compose -f docker-compose.dev.yml up -d

# 2. Configure backend
cp apps/backend/.env.local.example apps/backend/.env
# Generate JWT secrets: openssl rand -base64 64
# Update .env with generated secrets

# 3. Setup database
npm run db:migrate
npm run db:seed

# 4. Configure frontends to use local backend
# Update apps/admin-web/.env.local and apps/mobile/.env
# Set API URLs to http://localhost:3001

# 5. Start backend
npm run dev:backend
```

**For complete setup instructions, see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)**

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
- Comprehensive test suite (86 tests, 100% pass rate)
- Automated CI/CD with GitHub Actions
- 22.79% test coverage (target: 70%)
- Prisma migrations for safe schema evolution
- Structured logging and Sentry integration
- Rate limiting and input validation
- Org-scoped RBAC (Owner, Staff, Player)
- IDOR protection across all services

## Scripts

```bash
# Development
npm run dev:backend      # Start backend in watch mode
npm run dev:admin        # Start admin web in dev mode
npm run dev:mobile       # Start Expo dev server
npm run build            # Build all apps

# Testing
npm run test             # Run all tests
npm run test:cov         # Run tests with coverage report
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run end-to-end tests

# Code Quality
npm run lint             # Lint all workspaces
npm run format           # Format code with Prettier

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with initial data
```

## Documentation

### Getting Started
- **[Environment Setup](./ENVIRONMENT_SETUP.md)** - **START HERE** - Railway vs Local development setup
- **[Production Roadmap](./PRODUCTION_ROADMAP.md)** - **Production readiness plan** - Next steps to production
- **[Quick Start](./QUICK_START.md)** - Get up and running quickly
- **[Setup Guide](./SETUP_GUIDE.md)** - Complete setup instructions for Windows
- **[Seeding Instructions](./SEEDING_INSTRUCTIONS.md)** - How to seed the database with test data

### Architecture & Development
- **[Backend Architecture](./BACKEND_ARCHITECTURE.md)** - Technical architecture and design decisions
- **[Mobile App Strategy](./MOBILE_APP_STRATEGY.md)** - Mobile app architecture and approach
- **[Tournament Flow API](./TOURNAMENT_FLOW_API.md)** - Tournament system API documentation
- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Development best practices

### Deployment & Production
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment overview
- **[Railway Database Setup](./RAILWAY_DATABASE_SETUP.md)** - Database setup on Railway
- **[Railway Production Setup](./RAILWAY_PRODUCTION_SETUP.md)** - Production environment setup
- **[Discord OAuth Setup](./DISCORD_OAUTH_SETUP.md)** - Configure Discord OAuth
- **[Production Ready Checklist](./PRODUCTION_READY_CHECKLIST.md)** - Pre-launch checklist

### Security & Operations
- **[Security Audit](./SECURITY_AUDIT.md)** - Security review and best practices
- **[Security Rotation Guide](./SECURITY_ROTATION_GUIDE.md)** - Credential rotation procedures
- **[Testing Guide](./TESTING_GUIDE.md)** - Testing strategy and running tests
- **[CI/CD Pipeline](./.github/workflows/README.md)** - Automated testing and deployment workflows

### Project Management
- **[Sprint Progress](./SPRINT_PROGRESS.md)** - Current sprint status and daily progress
- **[Product Roadmap](./PRODUCT_ROADMAP.md)** - Future features and enhancements

## License

Proprietary - Genki TCG

