#!/bin/bash
# Seed Railway Database Script
# This script seeds the Railway production database with initial data

set -e

echo "🌱 Seeding Railway Database..."
echo "================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "Install it with: npm i -g @railway/cli"
    echo "Or: brew install railway"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway."
    echo "Run: railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and authenticated"
echo ""

# Link to the project (if not already linked)
echo "📍 Linking to Railway project..."
railway link

echo ""
echo "🔧 Running seed script on Railway..."
echo "This will create:"
echo "  - Organization: Genki TCG (invite code: GENKI)"
echo "  - Owner: owner@genki-tcg.com / password123"
echo "  - Staff: staff@genki-tcg.com / password123"
echo "  - Players: player1@test.com ... player10@test.com / password123"
echo ""

# Run the seed script
railway run --service backend npm run db:seed --workspace=apps/backend

echo ""
echo "✅ Database seeding complete!"
echo ""
echo "📝 You can now log in with:"
echo "   Email: owner@genki-tcg.com"
echo "   Password: password123"
echo "   Invite Code (for new signups): GENKI"
