# Railway Deployment Setup for Genki TCG Backend

## Problem Fixed

The backend failed to build on Railway because it's part of a monorepo with workspace dependencies (`@genki-tcg/shared-types` and `@genki-tcg/tournament-logic`). Railway was trying to install these from npm, but they only exist locally in the workspace.

## Solution

The Dockerfile now builds from the monorepo root and includes all workspace packages.

## Railway Configuration Steps

### 1. Backend Service Configuration

In your Railway backend service settings:

**Build Settings:**
- **Root Directory:** Leave blank or set to `/` (must build from monorepo root)
- **Dockerfile Path:** `apps/backend/Dockerfile`
- **Builder:** Docker (not Nixpacks)

**Deploy Settings:**
- **Start Command:** Already configured in Dockerfile
- **Healthcheck Path:** `/health`
- **Port:** `3000`

### 2. Add Database Services FIRST

**IMPORTANT:** Add these services first, then Railway will automatically provide connection variables.

#### Add PostgreSQL Database
1. In Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically creates the database and injects `DATABASE_URL` into all services

#### Add Redis
1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Railway automatically injects `REDIS_URL` into all services

### 3. Environment Variables

After adding PostgreSQL and Redis, go to your backend service's **Variables** tab.

**Variables Railway Provides Automatically (DO NOT manually set these):**
- ✅ `DATABASE_URL` - Automatically provided by PostgreSQL service
- ✅ `REDIS_URL` - Automatically provided by Redis service

**Variables You Need to Add Manually:**

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=<your-generated-secret>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=*
```

**To generate JWT_SECRET**, run locally:
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or PowerShell
-join ((1..64) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

### 4. Verify Service Connections

In your backend service's **Variables** tab, you should see:
- ✅ `DATABASE_URL` (with value like `postgresql://postgres:...`)
- ✅ `REDIS_URL` (with value like `redis://default:...`)
- ⚙️ Your manually added variables

If you don't see `DATABASE_URL` or `REDIS_URL`, the services aren't linked. Make sure all services are in the same Railway project.

### 5. Deploy

1. Push your code to GitHub
2. Railway will automatically detect changes and deploy
3. Monitor the build logs for any issues

## Build Process Explained

The Dockerfile uses a multi-stage build:

### Stage 1: Builder
1. Copies monorepo structure (root package.json + workspaces)
2. Installs all dependencies (including dev dependencies)
3. Copies source code for packages and backend
4. Generates Prisma Client
5. Builds the NestJS application

### Stage 2: Production
1. Creates clean production image
2. Copies workspace structure
3. Installs only production dependencies
4. Copies built application and Prisma files
5. Runs as non-root user
6. Starts with: `prisma migrate deploy && node dist/main`

## Troubleshooting

### Build succeeds but deployment fails at healthcheck

This means your app built successfully but isn't starting. Check the **deployment logs** (not build logs):

1. Click on your backend service
2. Go to "Deployments" tab
3. Click the failed deployment
4. Look at the runtime logs

**Common causes:**

**Missing JWT_SECRET:**
```
❌ ERROR: JWT_SECRET is not set!
```
**Solution:** Add `JWT_SECRET` to your environment variables (see step 3 above)

**Missing DATABASE_URL:**
```
❌ ERROR: DATABASE_URL is not set!
```
**Solution:** Add PostgreSQL service to your project. Railway will auto-inject `DATABASE_URL`

**App crashes on startup:**
- Check all required environment variables are set
- Look for error messages in deployment logs
- Verify database is accessible

### Build fails with "Cannot find module @genki-tcg/..."
- Verify Root Directory is **blank** or `/` in Railway settings
- Check that Dockerfile Path is `apps/backend/Dockerfile`
- Ensure Builder is set to **Docker** (not Nixpacks)

### Database connection fails
- Verify `DATABASE_URL` is automatically set in Variables tab
- Check that PostgreSQL service is running in your Railway project
- Ensure PostgreSQL and backend are in the **same Railway project**
- Try viewing PostgreSQL connection details to verify it's accessible

### Redis connection fails
- The app is designed to start without Redis (non-blocking)
- Verify `REDIS_URL` is automatically set in Variables tab
- Check that Redis service is running in your Railway project

### Health check takes too long
- Initial startup may take 40-60 seconds (migrations + app startup)
- Healthcheck has 5-minute timeout window
- If it exceeds 5 minutes, check deployment logs for errors

## Local Testing

To test the Docker build locally from the monorepo root:

```bash
# From the monorepo root (genki-tcg/)
docker build -f apps/backend/Dockerfile -t genki-backend .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e REDIS_URL="your-redis-url" \
  -e JWT_SECRET="test-secret" \
  genki-backend
```

## Important Notes

1. **Always deploy from monorepo root** - The Dockerfile expects to be built from the repository root
2. **Workspace dependencies** - The build includes all packages in the workspace
3. **Prisma migrations** - Migrations run automatically on container start
4. **Health checks** - The `/health` endpoint must respond for Railway to consider the deploy successful
5. **Non-blocking startup** - The application starts even if Redis connection fails initially
