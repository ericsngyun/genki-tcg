#!/bin/sh
# Don't exit on error - we want to start the app even if migrations fail
# set -e

echo "🚀 Starting Genki TCG Backend..."
echo "📍 Working directory: $(pwd)"
echo "📂 Contents: $(ls -la)"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL is not set!"
  echo "⚠️  Application will start, but database features will not work."
  echo "⚠️  Please set DATABASE_URL in Railway environment variables."
else
  echo "✅ DATABASE_URL is configured"

  # Try to run migrations
  echo "📦 Running database migrations..."
  if npx prisma migrate deploy 2>&1; then
    echo "✅ Migrations completed successfully"
  else
    echo "⚠️  WARNING: Migration failed, but continuing to start app..."
    echo "⚠️  Check DATABASE_URL and database connectivity"
  fi
fi

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
  echo "⚠️  WARNING: JWT_SECRET is not set!"
  echo "⚠️  Authentication will not work properly."
  echo "⚠️  Generate one with: openssl rand -base64 64"
else
  echo "✅ JWT_SECRET is configured"
fi

# Check if main.js exists
if [ ! -f "dist/main.js" ]; then
  echo "❌ ERROR: dist/main.js not found!"
  echo "📂 dist/ contents:"
  ls -la dist/ || echo "dist/ directory not found"
  exit 1
fi

# Start the application
echo "🎯 Starting NestJS application..."
echo "🌐 Will bind to 0.0.0.0:${PORT:-3000}"
exec node dist/main
