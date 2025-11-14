#!/bin/bash
# Reset Prisma migration state for Railway deployment
# Run this if migrations are in a failed state

echo "🔄 Resetting Prisma migration state..."
echo ""
echo "This script will:"
echo "1. Mark the failed migration as rolled back"
echo "2. Allow fresh migrations to run"
echo ""

# Resolve the failed migration
npx prisma migrate resolve --rolled-back 20241112000000_update_game_types

echo ""
echo "✅ Migration state reset complete!"
echo "The next deployment will run migrations from a clean state."
