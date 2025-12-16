#!/bin/bash

# ============================================================================
# Production Secrets Generation Script
# ============================================================================
# This script generates secure secrets for production deployment
# Run this ONCE and save the output securely
#
# Usage:
#   bash scripts/generate-production-secrets.sh
#
# ============================================================================

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         Genki TCG Production Secrets Generator              ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  SECURITY WARNING:"
echo "   - Save this output in a secure password manager"
echo "   - Never commit these secrets to git"
echo "   - Each secret should be unique"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl is not installed"
    echo ""
    echo "Install instructions:"
    echo "  - macOS: brew install openssl"
    echo "  - Ubuntu/Debian: sudo apt-get install openssl"
    echo "  - Windows: Use Git Bash (includes openssl)"
    echo ""
    exit 1
fi

echo "📝 Generating Production Secrets..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate JWT Secret
echo "1️⃣  JWT_SECRET (Backend Authentication)"
echo "   Use this for: Railway → JWT_SECRET"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "   $JWT_SECRET"
echo ""

# Generate Refresh Token Secret
echo "2️⃣  REFRESH_TOKEN_SECRET (Backend Refresh Tokens)"
echo "   Use this for: Railway → REFRESH_TOKEN_SECRET"
echo "   ⚠️  This MUST be different from JWT_SECRET!"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
REFRESH_TOKEN_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "   $REFRESH_TOKEN_SECRET"
echo ""

# Generate Admin Site Password
echo "3️⃣  ADMIN_SITE_PASSWORD (Admin Web Gate Password)"
echo "   Use this for: Vercel → ADMIN_SITE_PASSWORD"
echo "   Current: genkihunter123 (CHANGE THIS!)"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr '+/' '-_')
echo "   $ADMIN_PASSWORD"
echo ""

# Generate Session Secret (optional, for future use)
echo "4️⃣  SESSION_SECRET (Optional - For future session management)"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "   $SESSION_SECRET"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Secrets Generated Successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Copy these secrets to your password manager"
echo "2. Set them in Railway Dashboard:"
echo "   → https://railway.app/dashboard"
echo "   → Select 'genki-tcg-production' service"
echo "   → Click 'Variables' tab"
echo "   → Add each variable listed above"
echo ""
echo "3. Set ADMIN_SITE_PASSWORD in Vercel:"
echo "   → https://vercel.com/[your-project]/settings/environment-variables"
echo ""
echo "4. Verify environment variables are set:"
echo "   → Check Railway logs for 'Environment validation passed'"
echo "   → Test admin login with new password"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo ""
echo "  ✓ Each secret is cryptographically random (base64)"
echo "  ✓ JWT_SECRET and REFRESH_TOKEN_SECRET are different"
echo "  ✓ Never commit these to git (.env files in .gitignore)"
echo "  ✓ Store securely in password manager (1Password, LastPass, etc.)"
echo "  ✓ Rotate secrets periodically (every 6-12 months)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Optional: Save to a secure file (not recommended for production)
read -p "💾 Do you want to save these to a temporary file? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    SECRETS_FILE="production-secrets-$TIMESTAMP.txt"

    {
        echo "Genki TCG Production Secrets"
        echo "Generated: $(date)"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "JWT_SECRET=$JWT_SECRET"
        echo ""
        echo "REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET"
        echo ""
        echo "ADMIN_SITE_PASSWORD=$ADMIN_PASSWORD"
        echo ""
        echo "SESSION_SECRET=$SESSION_SECRET"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "⚠️  SECURITY WARNING:"
        echo "   - This file contains sensitive secrets"
        echo "   - Store it securely or delete after copying to password manager"
        echo "   - Never commit this file to git"
        echo ""
    } > "$SECRETS_FILE"

    echo "✅ Secrets saved to: $SECRETS_FILE"
    echo "⚠️  Remember to delete this file after copying to your password manager!"
    echo ""
fi

echo "🎉 Done! Your production environment is ready for secure secrets."
echo ""
