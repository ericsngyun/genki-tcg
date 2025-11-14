#!/bin/sh
set -e  # Exit on error after validation checks

echo "=================================="
echo "🚀 Starting Genki TCG Backend"
echo "=================================="
echo "📍 Working directory: $(pwd)"
echo "🕐 Time: $(date)"
echo "🐧 User: $(whoami)"
echo ""

# Check Node.js version
echo "🔍 Environment Check:"
echo "  Node version: $(node --version)"
echo "  NPM version: $(npm --version)"
echo "  NODE_ENV: ${NODE_ENV:-not set}"
echo "  PORT: ${PORT:-3000}"
echo ""

# Check critical files
echo "📂 File Check:"
if [ ! -f "dist/main.js" ]; then
  echo "❌ ERROR: dist/main.js not found!"
  echo "📁 Current directory contents:"
  ls -la
  echo "📁 dist/ directory:"
  ls -la dist/ 2>/dev/null || echo "  dist/ directory not found"
  exit 1
fi
echo "  ✅ dist/main.js exists"

# Check for node_modules
if [ ! -d "../../node_modules" ]; then
  echo "  ⚠️  WARNING: node_modules not found at expected location"
  echo "  📁 Checking relative paths..."
  ls -la ../../ | head -20
fi

# Check environment variables
echo ""
echo "🔐 Environment Variables Check:"

if [ -z "$DATABASE_URL" ]; then
  echo "  ❌ ERROR: DATABASE_URL is not set!"
  echo "  The application requires a database connection."
  echo "  Please set DATABASE_URL in Railway environment variables."
  exit 1
else
  echo "  ✅ DATABASE_URL is configured"
  # Show just the protocol part for security
  echo "     $(echo $DATABASE_URL | sed -E 's|://.*|://***|')"
fi

if [ -z "$JWT_SECRET" ]; then
  echo "  ❌ ERROR: JWT_SECRET is not set!"
  echo "  The application requires JWT_SECRET for authentication."
  echo "  Generate one with: openssl rand -base64 64"
  exit 1
else
  echo "  ✅ JWT_SECRET is configured (${#JWT_SECRET} characters)"
fi

if [ -n "$REDIS_URL" ]; then
  echo "  ✅ REDIS_URL is configured"
else
  echo "  ⚠️  REDIS_URL not set (app will start without Redis)"
fi

# Run database migrations
echo ""
echo "📦 Database Migrations:"
set +e  # Don't exit on migration failure, just warn
if npx prisma migrate deploy; then
  echo "  ✅ Migrations completed successfully"
else
  MIGRATION_EXIT_CODE=$?
  echo "  ⚠️  WARNING: Migration failed with exit code $MIGRATION_EXIT_CODE"
  echo "  Continuing to start app (migrations may need to be run manually)"
fi
set -e  # Re-enable exit on error

# Start the application
echo ""
echo "=================================="
echo "🎯 Starting NestJS Application"
echo "=================================="
echo "🌐 Binding to 0.0.0.0:${PORT:-3000}"
echo "🚀 Executing: node dist/main"
echo ""

# Use exec to replace the shell process with node
exec node dist/main
