#!/bin/sh
set -e

echo "🚀 Starting Genki TCG Backend..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL is not set!"
  echo "⚠️  Application will start, but database features will not work."
  echo "⚠️  Please set DATABASE_URL in Railway environment variables."
else
  echo "✅ DATABASE_URL is configured"

  # Try to run migrations
  echo "📦 Running database migrations..."
  if npx prisma migrate deploy; then
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
fi

# Start the application
echo "🎯 Starting NestJS application..."
exec node dist/main
