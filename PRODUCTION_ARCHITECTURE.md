# Genki TCG - Production Architecture & Setup Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Backend Structure (NestJS)](#backend-structure-nestjs)
3. [Discord OAuth Flow](#discord-oauth-flow)
4. [Railway Deployment](#railway-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Production Checklist](#production-checklist)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├──────────────────────────┬──────────────────────────────────────┤
│   Mobile App (Expo)      │   Admin Web (Next.js)                 │
│   - React Native 0.81.5  │   - Next.js 14                        │
│   - Expo SDK 54          │   - React 18                          │
│   - Socket.io client     │   - Socket.io client                  │
└──────────────┬───────────┴──────────┬───────────────────────────┘
               │                      │
               │  HTTPS/WSS          │  HTTPS/WSS
               │                      │
┌──────────────┴──────────────────────┴───────────────────────────┐
│                    APPLICATION LAYER                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Railway Deployment                           │  │
│  │  URL: https://genki-tcg-production.up.railway.app        │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │         NestJS Backend (Node.js 20)              │   │  │
│  │  │  - REST API (Express)                            │   │  │
│  │  │  - WebSocket (Socket.io)                         │   │  │
│  │  │  - Authentication (JWT + Discord OAuth)          │   │  │
│  │  │  - Business Logic                                 │   │  │
│  │  │  - Sentry Error Tracking                          │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                          │                                │  │
│  │                          │ Prisma ORM                    │  │
│  │                          ▼                                │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │       PostgreSQL Database                        │   │  │
│  │  │  Host: nozomi.proxy.rlwy.net:14896              │   │  │
│  │  │  - User data                                      │   │  │
│  │  │  - Tournament data                                │   │  │
│  │  │  - Rating data (Glicko-2)                        │   │  │
│  │  │  - Credit ledger                                  │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
               │                      │
               │                      │
┌──────────────┴──────────────────────┴───────────────────────────┐
│                    EXTERNAL SERVICES                              │
├──────────────────────────┬────────────────────────────────────────┤
│  Discord OAuth API       │  Sentry (Error Tracking)               │
│  - User authentication   │  - Exception monitoring                 │
│  - Profile data          │  - Performance tracking                 │
└──────────────────────────┴────────────────────────────────────────┘
```

### Data Flow

1. **Client Request** → Mobile/Admin sends HTTP/WSS request
2. **API Gateway** → NestJS receives and validates request
3. **Authentication** → JWT token verified, user context extracted
4. **Business Logic** → Service layer processes request
5. **Database** → Prisma ORM executes queries on PostgreSQL
6. **Response** → Data returned to client
7. **Real-time** → Socket.io broadcasts updates to connected clients

---

## Backend Structure (NestJS)

### Entry Point Flow

```
1. apps/backend/src/main.ts
   ├─→ Imports instrument.ts (Sentry initialization) FIRST
   ├─→ Creates NestJS application
   ├─→ Applies middleware (Helmet, Compression, CORS)
   ├─→ Configures validation pipes
   ├─→ Binds to 0.0.0.0:${PORT} (Railway injects PORT)
   └─→ Logs startup information

2. apps/backend/src/app.module.ts
   ├─→ SentryModule (error tracking)
   ├─→ ConfigModule (environment variables)
   ├─→ ThrottlerModule (rate limiting)
   ├─→ PrismaModule (database)
   ├─→ AuthModule (authentication)
   ├─→ [13 feature modules...]
   └─→ Global ThrottlerGuard (applied to all routes)

3. apps/backend/src/instrument.ts
   └─→ Initializes Sentry if SENTRY_DSN is set and not development
```

### Module Architecture

```
AuthModule (apps/backend/src/auth/)
├── auth.controller.ts
│   ├─→ POST /auth/signup
│   ├─→ POST /auth/login
│   ├─→ POST /auth/refresh
│   ├─→ POST /auth/logout
│   ├─→ GET  /auth/me
│   ├─→ POST /auth/discord/url
│   ├─→ POST /auth/discord/callback
│   └─→ GET  /auth/discord/mobile-callback
├── auth.service.ts
│   ├─→ JWT token generation
│   ├─→ Refresh token management
│   ├─→ Password hashing (bcrypt, 12 rounds)
│   ├─→ Discord OAuth token exchange
│   └─→ User creation/lookup
├── strategies/
│   ├── jwt.strategy.ts (validates JWT tokens)
│   └── discord.strategy.ts (Discord OAuth)
└── guards/
    └── jwt-auth.guard.ts (protects routes)

EventsModule (apps/backend/src/events/)
├── events.controller.ts
│   ├─→ GET    /events (list events)
│   ├─→ POST   /events (create event)
│   ├─→ PATCH  /events/:id (update event)
│   ├─→ POST   /events/:id/register (player registration)
│   ├─→ POST   /events/:id/check-in (self check-in)
│   └─→ GET    /events/me/history (tournament history)
└── events.service.ts
    ├─→ Event CRUD operations
    ├─→ Registration logic
    ├─→ Check-in validation
    └─→ Tournament history calculation

[Similar structure for other modules...]
```

### Security Architecture

#### Authentication Flow
```
1. User Login
   ├─→ Client sends email/password OR Discord OAuth code
   ├─→ Server validates credentials
   ├─→ Server generates:
   │   ├─→ Access Token (JWT, expires in 1h-7d based on role)
   │   └─→ Refresh Token (stored in DB, expires in 7d)
   └─→ Client stores tokens

2. Protected Request
   ├─→ Client sends request with Authorization: Bearer <access_token>
   ├─→ JwtAuthGuard intercepts request
   ├─→ JwtStrategy validates token
   ├─→ User context injected into request (@CurrentUser decorator)
   └─→ Controller receives authenticated user

3. Token Refresh
   ├─→ Access token expires
   ├─→ Client sends refresh token to /auth/refresh
   ├─→ Server validates refresh token (checks DB)
   ├─→ Server rotates tokens (invalidates old, generates new)
   └─→ Client receives new access + refresh tokens
```

#### Rate Limiting
```
Global Rate Limits (via ThrottlerGuard):
- Default: 100 requests per 60 seconds
- Configurable via THROTTLE_TTL and THROTTLE_LIMIT env vars

Endpoint-Specific Limits (via @Throttle decorator):
- POST /auth/signup: 3 per hour
- POST /auth/login: 5 per 15 minutes
- POST /auth/refresh: 10 per minute
- POST /auth/discord/*: 10 per minute
```

#### Security Measures
- ✅ Helmet.js for HTTP security headers
- ✅ CORS with origin validation (supports wildcards securely)
- ✅ Request size limits (1MB max)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT with role-based expiration
- ✅ Refresh token rotation
- ✅ Input validation (class-validator)
- ✅ SQL injection protection (Prisma parameterized queries)
- ✅ XSS protection (Content Security Policy)

---

## Discord OAuth Flow

### Overview
Discord OAuth allows users to sign in with their Discord account. We support both web-based (popup) and mobile deep-link flows.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Discord OAuth Flow                            │
└─────────────────────────────────────────────────────────────────┘

1. INITIATION PHASE
   Client                          Backend                    Discord
   ──────                          ───────                    ───────
   │                                  │                          │
   │  POST /auth/discord/url         │                          │
   │  { redirectUri }                │                          │
   ├────────────────────────────────▶│                          │
   │                                  │                          │
   │  Generate CSRF state token      │                          │
   │  Store in DB                     │                          │
   │  Return Discord authorization URL│                          │
   │◀─────────────────────────────────┤                          │
   │                                  │                          │
   │  Open Discord auth URL           │                          │
   ├──────────────────────────────────┼─────────────────────────▶│
   │                                  │                          │

2. USER AUTHORIZATION PHASE
   │                                  │                          │
   │  User logs in to Discord         │                          │
   │  User authorizes app             │                          │
   │                                  │                          │
   │  Redirect to callback            │                          │
   │◀─────────────────────────────────┼──────────────────────────┤
   │  ?code=xyz&state=abc             │                          │
   │                                  │                          │

3. TOKEN EXCHANGE PHASE (Mobile)
   │                                  │                          │
   │  GET /auth/discord/mobile-callback │                        │
   │  ?code=xyz&state=abc             │                          │
   ├────────────────────────────────▶│                          │
   │                                  │                          │
   │  Validate state (CSRF protection)│                          │
   │  Exchange code for Discord token │                          │
   │  ├──────────────────────────────┼─────────────────────────▶│
   │  │  POST /oauth2/token           │                          │
   │  │◀─────────────────────────────┼──────────────────────────┤
   │  │  { access_token, ... }        │                          │
   │  │                               │                          │
   │  Fetch Discord user profile      │                          │
   │  ├──────────────────────────────┼─────────────────────────▶│
   │  │  GET /users/@me               │                          │
   │  │◀─────────────────────────────┼──────────────────────────┤
   │  │  { id, email, username, ... } │                          │
   │  │                               │                          │
   │  Create/update user in database  │                          │
   │  Generate JWT access + refresh   │                          │
   │  Return HTML with deep link      │                          │
   │◀─────────────────────────────────┤                          │
   │                                  │                          │
   │  HTML auto-opens deep link       │                          │
   │  genki-tcg://auth/callback?      │                          │
   │    accessToken=...&              │                          │
   │    refreshToken=...              │                          │
   │                                  │                          │
   │  Mobile app intercepts deep link │                          │
   │  Stores tokens                   │                          │
   │  Navigates to home screen        │                          │
   │                                  │                          │

3. TOKEN EXCHANGE PHASE (Web)
   │                                  │                          │
   │  POST /auth/discord/callback     │                          │
   │  { code, state, redirectUri }    │                          │
   ├────────────────────────────────▶│                          │
   │                                  │                          │
   │  [Same token exchange as above]  │                          │
   │                                  │                          │
   │  Return { accessToken, ... }     │                          │
   │◀─────────────────────────────────┤                          │
   │                                  │                          │
   │  Popup posts message to opener   │                          │
   │  Popup closes                    │                          │
   │  Main window stores tokens       │                          │
   │                                  │                          │
```

### Configuration

#### Discord Developer Portal Setup
1. Create application at https://discord.com/developers/applications
2. Note `CLIENT_ID` and `CLIENT_SECRET`
3. Add redirect URIs:
   - `http://localhost:3001/auth/discord/callback` (local dev - web)
   - `http://localhost:3001/auth/discord/mobile-callback` (local dev - mobile)
   - `https://genki-tcg-production.up.railway.app/auth/discord/callback` (production - web)
   - `https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback` (production - mobile)
   - `genki-tcg://auth/callback` (mobile deep link)

#### Backend Environment Variables
```env
# Discord OAuth Configuration
DISCORD_CLIENT_ID="1441953820820373639"
DISCORD_CLIENT_SECRET="<your-secret>"

# CRITICAL: Must be comma-separated, NO LINE BREAKS
DISCORD_ALLOWED_REDIRECTS="http://localhost:3000,http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://discord/callback,genki-tcg://auth/callback"
```

#### Key Code Locations

**Backend**
- `apps/backend/src/auth/auth.controller.ts`
  - Lines 108-124: `/auth/discord/url` - Generate auth URL
  - Lines 117-124: `/auth/discord/callback` - Handle web callback
  - Lines 149-197: `/auth/discord/mobile-callback` - Handle mobile callback
  - Lines 199-337: `generateDeepLinkRedirect()` - HTML generation for redirect

- `apps/backend/src/auth/auth.service.ts`
  - Discord token exchange logic
  - User creation/lookup
  - JWT generation

**Mobile**
- `apps/mobile/app/login.tsx` - Login UI with Discord OAuth button
- `apps/mobile/app/(tabs)/_layout.tsx` - Deep link handling
- `apps/mobile/lib/api.ts` - API methods for Discord auth

### CSRF Protection
- State parameter generated server-side
- Stored in database with expiration (5 minutes)
- Validated on callback to prevent CSRF attacks
- Deleted after use (single-use tokens)

---

## Railway Deployment

### Deployment Method
**Strategy**: Docker-based deployment using Railway's buildpack detection

### File Structure
```
genki-tcg/
├── Dockerfile (at root)
├── railway.toml (Railway configuration)
├── start.sh (startup script with health checks)
└── apps/backend/
    ├── src/
    ├── prisma/
    └── package.json
```

### Dockerfile
```dockerfile
# Multi-stage build for smaller image size

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/*/package*.json ./packages/
RUN npm install --production=false

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=apps/backend
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY start.sh ./start.sh
RUN chmod +x start.sh
EXPOSE 3001
CMD ["./start.sh"]
```

### railway.toml
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"
watchPatterns = ["apps/backend/**", "packages/**"]

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### start.sh (Startup Script)
```bash
#!/bin/sh
set -e

echo "🚀 Starting Genki TCG Backend"

# 1. Validate environment
echo "📋 Validating environment variables..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  exit 1
fi

# 2. Run database migrations
echo "🔄 Running database migrations..."
cd apps/backend
npx prisma migrate deploy --schema=prisma/schema.prisma
cd ../..

# 3. Start application
echo "✅ Starting NestJS application..."
node apps/backend/dist/main.js
```

### Environment Variables (Railway)

**Required**
```env
# Database (injected by Railway)
DATABASE_URL="postgresql://postgres:...@nozomi.proxy.rlwy.net:14896/railway"

# JWT Secrets
JWT_SECRET="<generate-with-openssl-rand-base64-64>"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="<generate-with-openssl-rand-base64-64>"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Discord OAuth
DISCORD_CLIENT_ID="1441953820820373639"
DISCORD_CLIENT_SECRET="<your-secret>"
DISCORD_ALLOWED_REDIRECTS="http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,https://genki-tcg-production.up.railway.app/auth/discord/callback,https://genki-tcg-production.up.railway.app/auth/discord/mobile-callback,genki-tcg://auth/callback"

# Application
NODE_ENV="production"
API_URL="https://genki-tcg-production.up.railway.app"
PORT=3001  # Railway overrides this automatically

# CORS Origins
CORS_ORIGINS="https://youradmin.com,genki-tcg://"

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

**Optional**
```env
# Sentry Error Tracking
SENTRY_DSN="https://...@sentry.io/..."

# Redis (if using)
REDIS_URL="redis://..."
```

### Deployment Process

#### Initial Setup
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link project
railway link

# 4. Set environment variables
railway variables set DATABASE_URL="..."
railway variables set JWT_SECRET="..."
# ... set all required variables
```

#### Deployment
```bash
# Automatic deployment (on git push to main branch)
git push origin main

# Manual deployment
railway up

# Check deployment status
railway status

# View logs
railway logs

# Open deployed app
railway open
```

### Health Checks
Railway pings `/health` endpoint every 30 seconds
- Returns 200 OK if database connected
- Returns 503 Service Unavailable if database down

### Troubleshooting

**Common Issues**:

1. **Build Fails**
   - Check Dockerfile syntax
   - Ensure all dependencies in package.json
   - Check Railway build logs

2. **Database Migration Fails**
   - Check DATABASE_URL is set correctly
   - Ensure Postgres service is running
   - Check migration files for syntax errors

3. **Application Crashes**
   - Check logs: `railway logs`
   - Verify all environment variables are set
   - Check memory limits (Railway free tier: 512MB)

4. **Discord OAuth Fails**
   - Verify DISCORD_ALLOWED_REDIRECTS has NO line breaks
   - Check Discord Developer Portal redirect URIs match
   - Ensure DISCORD_CLIENT_SECRET is correct

---

## Environment Configuration

### Local Development

**Backend** (`apps/backend/.env`)
```env
DATABASE_URL="postgresql://postgres:...@nozomi.proxy.rlwy.net:14896/railway"
JWT_SECRET="5139c22e8c8182ebd1f1dbe97fe8dc6b8f773c5c76ce32f5ba28c008096d38cb"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="HdiNkjhFeuM1BbhpRQZh1UdxRqd8TbgmHtKRI3BlunANtebXATZaUtm60KdZbglQ9auNRq0iLfutLrUkmMYhvQ=="
REFRESH_TOKEN_EXPIRES_IN="7d"
API_PORT=3001
API_URL="http://localhost:3001"
CORS_ORIGINS="http://localhost:3000,http://localhost:8081,genki-tcg://"
DISCORD_CLIENT_ID="1441953820820373639"
DISCORD_CLIENT_SECRET="BoPG1DEWXsr7LAWb7yhxiXif7T4Fz_a1"
DISCORD_ALLOWED_REDIRECTS="http://localhost:3000,http://localhost:3001/auth/discord/callback,http://localhost:3001/auth/discord/mobile-callback,http://localhost:8081/discord/callback,genki-tcg://auth/callback"
NODE_ENV="development"
```

**Mobile** (`apps/mobile/.env`)
```env
# Local backend
EXPO_PUBLIC_API_URL=http://192.168.254.93:3001
EXPO_PUBLIC_WS_URL=ws://192.168.254.93:3001

# Production backend
# EXPO_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
# EXPO_PUBLIC_WS_URL=wss://genki-tcg-production.up.railway.app
```

**Admin Web** (`apps/admin-web/.env.local`)
```env
# Local backend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Production backend
# NEXT_PUBLIC_API_URL=https://genki-tcg-production.up.railway.app
```

### Production (Railway)

All environment variables set via Railway dashboard or CLI.

**Critical**: Never commit `.env` files with production secrets to git!

---

## Production Checklist

### Pre-Deployment

- [ ] **Environment Variables**
  - [ ] All required variables set in Railway
  - [ ] DISCORD_ALLOWED_REDIRECTS has NO line breaks
  - [ ] JWT secrets are cryptographically secure
  - [ ] CORS_ORIGINS includes production domains
  - [ ] SENTRY_DSN configured for error tracking

- [ ] **Database**
  - [ ] Migrations tested locally
  - [ ] Backup strategy in place
  - [ ] Connection pooling configured (Railway default: 10)

- [ ] **Discord OAuth**
  - [ ] Redirect URIs registered in Discord portal
  - [ ] Production URLs included
  - [ ] Mobile deep links tested

- [ ] **Security**
  - [ ] Helmet configured
  - [ ] CORS properly restricted
  - [ ] Rate limiting enabled
  - [ ] Request size limits set
  - [ ] Secrets rotated from development

- [ ] **Monitoring**
  - [ ] Sentry initialized
  - [ ] Error tracking verified
  - [ ] Performance monitoring enabled
  - [ ] Logging configured

### Post-Deployment

- [ ] **Smoke Tests**
  - [ ] Health check returns 200: `curl https://genki-tcg-production.up.railway.app/health`
  - [ ] Login with email/password works
  - [ ] Discord OAuth works (web)
  - [ ] Discord OAuth works (mobile deep link)
  - [ ] WebSocket connection succeeds
  - [ ] Database queries execute

- [ ] **Mobile App**
  - [ ] Update EXPO_PUBLIC_API_URL to production
  - [ ] Test login flow
  - [ ] Test Discord OAuth deep link
  - [ ] Test real-time updates

- [ ] **Admin Web**
  - [ ] Update NEXT_PUBLIC_API_URL to production
  - [ ] Test login flow
  - [ ] Test event creation
  - [ ] Test real-time updates

- [ ] **Monitoring**
  - [ ] Check Railway logs for errors
  - [ ] Verify Sentry captures errors
  - [ ] Monitor database connections
  - [ ] Check API response times

---

## Common Issues & Solutions

### Issue: Discord OAuth "Invalid Redirect URI"
**Cause**: DISCORD_ALLOWED_REDIRECTS has line breaks or doesn't match Discord portal
**Solution**:
1. Railway dashboard → Variables → DISCORD_ALLOWED_REDIRECTS
2. Ensure single line, comma-separated, NO spaces around commas
3. Verify exact match with Discord Developer Portal redirect URIs

### Issue: "JWT_SECRET must be set to a secure value"
**Cause**: Using default dev secret in production
**Solution**:
```bash
# Generate secure secret
openssl rand -base64 64

# Set in Railway
railway variables set JWT_SECRET="<generated-secret>"
```

### Issue: Database connection fails
**Cause**: DATABASE_URL incorrect or Postgres service down
**Solution**:
1. Check Railway dashboard → Postgres service is running
2. Verify DATABASE_URL in variables matches Postgres connection string
3. Test connection: `railway run npx prisma db pull`

### Issue: Mobile deep link doesn't open app
**Cause**: Deep link not registered or app not installed
**Solution**:
1. Ensure `genki-tcg://` scheme registered in app.json
2. Test deep link: `adb shell am start -a android.intent.action.VIEW -d "genki-tcg://auth/callback?accessToken=test"`
3. Check mobile app is installed and deep link handler configured

### Issue: CORS blocks requests
**Cause**: Origin not in CORS_ORIGINS list
**Solution**:
1. Add origin to CORS_ORIGINS: `railway variables set CORS_ORIGINS="https://youradmin.com,genki-tcg://"`
2. Redeploy: `railway up`
3. Test: Check browser console for CORS errors

### Issue: Rate limit exceeded
**Cause**: Too many requests from single IP
**Solution**:
1. Increase limits: `railway variables set THROTTLE_LIMIT=200`
2. Or adjust TTL: `railway variables set THROTTLE_TTL=120000`
3. For specific endpoints, modify `@Throttle()` decorator in controller

---

## Summary

This architecture provides:
- ✅ **Scalable** - Stateless NestJS backend, horizontal scaling ready
- ✅ **Secure** - JWT auth, CSRF protection, rate limiting, input validation
- ✅ **Observable** - Sentry error tracking, structured logging
- ✅ **Maintainable** - Clean module structure, TypeScript, Prisma ORM
- ✅ **Production-Ready** - Docker deployment, health checks, automated migrations

**Key Files**:
- `apps/backend/src/main.ts` - Application entry point
- `apps/backend/src/app.module.ts` - Module configuration
- `apps/backend/src/auth/auth.controller.ts` - Discord OAuth endpoints
- `apps/backend/prisma/schema.prisma` - Database schema
- `Dockerfile` - Docker build configuration
- `railway.toml` - Railway deployment settings
- `start.sh` - Startup script with migrations

**Next Steps**:
1. Fix Railway `DISCORD_ALLOWED_REDIRECTS` environment variable (remove line breaks)
2. Complete Sentry integration (wire logger to Sentry)
3. Add placement calculation to tournament system
4. Increase test coverage to 60%+
