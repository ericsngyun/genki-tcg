# Backend Startup Issues - RESOLVED

## Summary

Successfully resolved the backend startup issues that were preventing the server from starting. The backend now runs correctly on port 3001 with proper environment configuration.

## Issues Fixed

### 1. Module Not Found Error
**Error**: `Cannot find module 'C:\Users\rayno\eric\genki-tcg\apps\backend\dist\main'`

**Root Cause**:
- The monorepo TypeScript configuration was outputting compiled files to `dist/apps/backend/src/main.js` instead of `dist/main.js`
- NestJS was looking for the compiled file in the wrong location

**Solution**:
Changed the `dev` script in `apps/backend/package.json` to use `ts-node` directly:
```json
"dev": "ts-node -r tsconfig-paths/register src/main.ts"
```

This bypasses compilation entirely during development and runs TypeScript directly with proper path mapping support.

### 2. Environment Variables Not Loading
**Error**: `JWT_SECRET environment variable must be set to a secure value`

**Root Cause**:
- ConfigModule was looking for `.env` at `../../../.env` relative to `app.module.ts`
- When running with `ts-node` from `apps/backend`, the working directory made the path incorrect

**Solution**:
Updated `apps/backend/src/app.module.ts` to search multiple paths:
```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [
    '../../.env',      // From apps/backend when running with npm run dev
    '../../../.env',   // From apps/backend/src if needed
    '.env',            // Current directory fallback
  ],
})
```

### 3. Wrong Port Configuration
**Issue**: Backend was starting on port 3000 instead of 3001

**Root Cause**:
`main.ts` was reading `process.env.PORT` instead of `process.env.API_PORT`

**Solution**:
Updated `apps/backend/src/main.ts`:
```typescript
const port = process.env.API_PORT || process.env.PORT || 3001;
```

## Files Created/Modified

### Created:
- `.env` - Environment configuration with JWT secrets
- `generate-secrets.js` - Utility to generate secure JWT secrets
- `BACKEND_STARTUP_RESOLVED.md` - This file

### Modified:
- `apps/backend/package.json` - Updated dev script to use ts-node
- `apps/backend/src/app.module.ts` - Fixed ConfigModule path array
- `apps/backend/src/main.ts` - Fixed port configuration

## Current Status

✅ Backend starts successfully on port 3001
✅ Environment variables load correctly
✅ JWT authentication configured with secure secrets
✅ All tournament flow endpoints registered:
   - `/events/:id/my-active-match` - Get player's active match
   - `/events/:id/drop` - Drop from tournament
   - `/matches/:id/report-result` - Player report match result
   - `/matches/:id/confirm-result` - Opponent confirm/dispute result

⚠️ Database connection pending - PostgreSQL needs to be started

## Next Steps

1. **Start PostgreSQL database** (if not already running)
2. **Run database migrations**:
   ```bash
   cd apps/backend
   npx prisma migrate dev
   ```
3. **Seed test data**:
   ```bash
   npx prisma db seed
   ```
4. **Test the mobile app** - The backend is now ready to accept connections from the mobile app

## Testing the Backend

Test the health endpoint:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T23:18:17.846Z",
  "uptime": 22.9664923,
  "memory": {"used": 226, "total": 231},
  "database": "connected"  // Will show "disconnected" until PostgreSQL is started
}
```

## For Future Repository Clones

When setting up on a new machine:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate JWT secrets**:
   ```bash
   node generate-secrets.js
   ```

3. **Create `.env` file** in root directory with the generated secrets

4. **Start PostgreSQL** and create database

5. **Run migrations**:
   ```bash
   cd apps/backend
   npx prisma migrate dev
   npx prisma db seed
   ```

6. **Start backend**:
   ```bash
   cd apps/backend
   npm run dev
   ```

Backend will be available at `http://localhost:3001`
