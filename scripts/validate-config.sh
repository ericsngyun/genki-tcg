#!/bin/bash

# ============================================================================
# Configuration Validation Script
# ============================================================================
# This script checks if all placeholder values have been replaced
# and if the app is ready for app store submission
#
# Usage:
#   bash scripts/validate-config.sh
#
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
PASSED=0

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║         Genki TCG Configuration Validator                   ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Change to project root
cd "$(dirname "$0")/.."

echo "📋 Checking configuration for app store readiness..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# Check 1: Mobile app.json placeholders
# ============================================================================
echo "1️⃣  Checking apps/mobile/app.json..."

if grep -q '"your-org-slug"' apps/mobile/app.json; then
    echo -e "   ${RED}✗ FAIL${NC}: Sentry organization placeholder found"
    echo "   → Line 46: \"organization\": \"your-org-slug\""
    echo "   → Fix: Update with your Sentry org slug from https://sentry.io/settings/"
    ((ERRORS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: Sentry organization configured"
    ((PASSED++))
fi

if grep -q '"your-project-id"' apps/mobile/app.json; then
    echo -e "   ${RED}✗ FAIL${NC}: EAS project ID placeholder found"
    echo "   → Line 57: \"projectId\": \"your-project-id\""
    echo "   → Fix: Update with your Expo project ID from https://expo.dev"
    ((ERRORS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: EAS project ID configured"
    ((PASSED++))
fi

echo ""

# ============================================================================
# Check 2: EAS configuration placeholders
# ============================================================================
echo "2️⃣  Checking apps/mobile/eas.json..."

if grep -q 'your-apple-id@email.com' apps/mobile/eas.json; then
    echo -e "   ${RED}✗ FAIL${NC}: Apple ID placeholder found"
    echo "   → Line 44: \"appleId\": \"your-apple-id@email.com\""
    echo "   → Fix: Update with your Apple ID email"
    ((ERRORS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: Apple ID configured"
    ((PASSED++))
fi

if grep -q 'REPLACE_WITH_APP_STORE_CONNECT_APP_ID' apps/mobile/eas.json; then
    echo -e "   ${RED}✗ FAIL${NC}: App Store Connect App ID placeholder found"
    echo "   → Line 45: \"ascAppId\": \"REPLACE_WITH_APP_STORE_CONNECT_APP_ID\""
    echo "   → Fix: Get from App Store Connect → My Apps → [Your App] → App Information"
    ((ERRORS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: App Store Connect App ID configured"
    ((PASSED++))
fi

if grep -q 'REPLACE_WITH_APPLE_TEAM_ID' apps/mobile/eas.json; then
    echo -e "   ${RED}✗ FAIL${NC}: Apple Team ID placeholder found"
    echo "   → Line 46: \"appleTeamId\": \"REPLACE_WITH_APPLE_TEAM_ID\""
    echo "   → Fix: Get from https://developer.apple.com/account → Membership Details"
    ((ERRORS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: Apple Team ID configured"
    ((PASSED++))
fi

if [ ! -f "apps/mobile/google-service-account.json" ]; then
    echo -e "   ${YELLOW}⚠ WARN${NC}: Google service account JSON not found"
    echo "   → File: apps/mobile/google-service-account.json"
    echo "   → Fix: Download from Google Cloud Console → IAM & Admin → Service Accounts"
    ((WARNINGS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: Google service account JSON found"
    ((PASSED++))
fi

echo ""

# ============================================================================
# Check 3: Environment variables
# ============================================================================
echo "3️⃣  Checking apps/mobile/.env..."

if [ ! -f "apps/mobile/.env" ]; then
    echo -e "   ${RED}✗ FAIL${NC}: .env file not found"
    echo "   → Fix: Copy from .env.example and fill in values"
    ((ERRORS++))
else
    if grep -q 'EXPO_PUBLIC_PROJECT_ID=your-expo-project-id-here' apps/mobile/.env 2>/dev/null || \
       ! grep -q 'EXPO_PUBLIC_PROJECT_ID=' apps/mobile/.env 2>/dev/null; then
        echo -e "   ${RED}✗ FAIL${NC}: EXPO_PUBLIC_PROJECT_ID not configured"
        echo "   → Fix: Get from https://expo.dev and update .env file"
        ((ERRORS++))
    else
        echo -e "   ${GREEN}✓ PASS${NC}: EXPO_PUBLIC_PROJECT_ID configured"
        ((PASSED++))
    fi
fi

echo ""

# ============================================================================
# Check 4: Backend environment variables
# ============================================================================
echo "4️⃣  Checking apps/backend/.env..."

if [ ! -f "apps/backend/.env" ]; then
    echo -e "   ${YELLOW}⚠ WARN${NC}: Backend .env file not found (OK if using Railway)"
    echo "   → Make sure Railway environment variables are set"
    ((WARNINGS++))
else
    if grep -q 'CHANGE_ME' apps/backend/.env 2>/dev/null; then
        echo -e "   ${RED}✗ FAIL${NC}: Backend secrets contain placeholder values"
        echo "   → Fix: Run scripts/generate-production-secrets.sh"
        ((ERRORS++))
    else
        echo -e "   ${GREEN}✓ PASS${NC}: Backend secrets look configured"
        ((PASSED++))
    fi

    if grep -q 'your-discord-client-secret' apps/backend/.env 2>/dev/null; then
        echo -e "   ${RED}✗ FAIL${NC}: Discord client secret is placeholder"
        echo "   → Fix: Get from https://discord.com/developers/applications"
        ((ERRORS++))
    else
        echo -e "   ${GREEN}✓ PASS${NC}: Discord client secret configured"
        ((PASSED++))
    fi
fi

echo ""

# ============================================================================
# Check 5: Legal documents
# ============================================================================
echo "5️⃣  Checking legal documents..."

if [ ! -f "apps/admin-web/public/legal/privacy.html" ]; then
    echo -e "   ${RED}✗ FAIL${NC}: Privacy policy HTML not found"
    echo "   → Fix: Should be at apps/admin-web/public/legal/privacy.html"
    ((ERRORS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: Privacy policy HTML exists"
    ((PASSED++))
fi

if [ ! -f "apps/admin-web/public/legal/terms.html" ]; then
    echo -e "   ${RED}✗ FAIL${NC}: Terms of service HTML not found"
    echo "   → Fix: Should be at apps/admin-web/public/legal/terms.html"
    ((ERRORS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: Terms of service HTML exists"
    ((PASSED++))
fi

# Check if settings.tsx has placeholder URLs
if grep -q 'your-domain.com' apps/mobile/app/settings.tsx 2>/dev/null; then
    echo -e "   ${RED}✗ FAIL${NC}: Settings.tsx still has placeholder URLs"
    echo "   → Fix: Update privacy and terms URLs in apps/mobile/app/settings.tsx"
    ((ERRORS++))
else
    echo -e "   ${GREEN}✓ PASS${NC}: Settings.tsx URLs configured"
    ((PASSED++))
fi

echo ""

# ============================================================================
# Check 6: App assets
# ============================================================================
echo "6️⃣  Checking app assets..."

if [ -f "apps/mobile/assets/icon.png" ]; then
    # Check if it's the default Expo icon (placeholder)
    SIZE=$(wc -c < "apps/mobile/assets/icon.png" 2>/dev/null || echo "0")
    if [ "$SIZE" -lt 10000 ]; then
        echo -e "   ${YELLOW}⚠ WARN${NC}: App icon might be placeholder (very small file)"
        echo "   → Recommended: Create 1024x1024 PNG icon"
        ((WARNINGS++))
    else
        echo -e "   ${GREEN}✓ PASS${NC}: App icon exists and looks good"
        ((PASSED++))
    fi
else
    echo -e "   ${RED}✗ FAIL${NC}: App icon not found"
    echo "   → Fix: Create apps/mobile/assets/icon.png (1024x1024)"
    ((ERRORS++))
fi

if [ -f "apps/mobile/assets/splash.png" ]; then
    echo -e "   ${GREEN}✓ PASS${NC}: Splash screen exists"
    ((PASSED++))
else
    echo -e "   ${YELLOW}⚠ WARN${NC}: Splash screen not found"
    ((WARNINGS++))
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 VALIDATION SUMMARY"
echo ""
echo -e "   ${GREEN}✓ Passed: $PASSED${NC}"
echo -e "   ${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo -e "   ${RED}✗ Errors: $ERRORS${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ CONFIGURATION NOT READY${NC}"
    echo ""
    echo "You have $ERRORS critical error(s) that must be fixed before submission."
    echo ""
    echo "Next steps:"
    echo "  1. Fix all errors listed above"
    echo "  2. Run this script again to verify"
    echo "  3. See PRE_SUBMISSION_CHECKLIST.md for detailed instructions"
    echo ""
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  CONFIGURATION MOSTLY READY${NC}"
    echo ""
    echo "No critical errors, but you have $WARNINGS warning(s)."
    echo ""
    echo "Warnings should be addressed before final submission, but won't block builds."
    echo ""
    echo "Next steps:"
    echo "  1. Review warnings above"
    echo "  2. Complete remaining tasks in PRE_SUBMISSION_CHECKLIST.md"
    echo "  3. Generate production builds and test"
    echo ""
    exit 0
else
    echo -e "${GREEN}✅ CONFIGURATION READY!${NC}"
    echo ""
    echo "All checks passed! Your configuration looks good for app store submission."
    echo ""
    echo "Final steps before submission:"
    echo "  1. Build production apps: eas build --platform all --profile production"
    echo "  2. Test builds on physical devices"
    echo "  3. Reset database (see DATABASE_RESET_PROCEDURE.md)"
    echo "  4. Submit: eas submit --platform all --profile production"
    echo ""
    echo "See PRE_SUBMISSION_CHECKLIST.md for the complete checklist."
    echo ""
    exit 0
fi
