# Railway Database Configuration Guide

## Current Situation

Your Railway project has PostgreSQL configured, but it's set to **internal-only access** (`postgres-opmd.railway.internal`), which means:
- ✅ Works for the deployed backend on Railway
- ❌ Cannot be accessed from local development machines

## Options for Local Development

### Option 1: Install PostgreSQL Locally (Recommended)

**Pros**:
- Full control over test data
- No network latency
- Can work offline
- No risk of affecting production/staging data

**Cons**:
- Requires PostgreSQL installation on each dev machine
- Data doesn't sync across devices

**Setup**:
1. Download PostgreSQL: https://www.postgresql.org/download/windows/
2. Install and create database `genki_tcg`
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/genki_tcg"
   ```
4. Run migrations:
   ```bash
   cd apps/backend
   npx prisma migrate dev
   npx prisma db seed
   ```

### Option 2: Create Railway PostgreSQL with Public Access

**Pros**:
- Works across all your devices
- Centralized development database
- Easy to share with team

**Cons**:
- Requires network connection
- Slight latency
- Shares data across all dev instances

**Setup**:
1. Go to Railway dashboard: https://railway.app/project/c9c5a435-1c37-45ae-a665-4b3735f79357
2. Add a new PostgreSQL service
3. Enable "Public Networking" in the service settings
4. Copy the public connection string
5. Update `.env` with the public URL

### Option 3: Use Railway Link (Current Approach - Limited)

**Current Issue**: Your existing Railway PostgreSQL doesn't have public networking enabled. The `DATABASE_PUBLIC_URL` shown in Railway variables points to the main domain, not directly to PostgreSQL port 5432.

## Recommended Next Steps

Since you mentioned wanting to work across multiple devices, I recommend **Option 2**:

1. Create a **separate** Railway PostgreSQL database specifically for development
2. Enable public networking on this dev database
3. Keep the existing internal-only database for production

This way:
- Your production backend on Railway uses the secure internal database
- Your local development (across all devices) uses the public dev database
- Clear separation between prod and dev data

## Current Backend Status

Your local backend is running on **port 3001** but without database connectivity. The API endpoints work, but any database operations will fail.

To verify:
```bash
curl http://localhost:3001/health
```

You should see `"database":"disconnected"`.
