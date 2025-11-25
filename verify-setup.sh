#!/bin/bash
# Genki TCG Setup Verification Script
# This script checks if your development environment is properly configured

set -e

echo "🚀 Genki TCG - Setup Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track errors
ERRORS=0

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed: $(command -v $1)"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_version() {
    local cmd=$1
    local min_version=$2
    local version_output=$($cmd --version 2>&1 | head -n 1)
    echo -e "${GREEN}✓${NC} $cmd version: $version_output"
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_env_var() {
    local file=$1
    local var=$2
    if grep -q "^$var=" "$file" 2>/dev/null; then
        local value=$(grep "^$var=" "$file" | cut -d'=' -f2-)
        if [[ "$value" == *"REPLACE"* ]] || [[ "$value" == *"your-"* ]] || [[ "$value" == "" ]]; then
            echo -e "${YELLOW}⚠${NC}  $var in $file needs to be configured (placeholder value)"
            return 1
        else
            echo -e "${GREEN}✓${NC} $var is configured in $file"
            return 0
        fi
    else
        echo -e "${RED}✗${NC} $var is missing in $file"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "1. Checking Prerequisites"
echo "-------------------------"
check_command node
check_command npm
check_command git
check_command psql && echo "   PostgreSQL is available" || echo -e "   ${YELLOW}⚠${NC}  PostgreSQL not in PATH (may still be installed)"
echo ""

echo "2. Checking Node.js Version"
echo "----------------------------"
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo -e "${GREEN}✓${NC} Node.js version $NODE_VERSION >= $REQUIRED_VERSION"
else
    echo -e "${RED}✗${NC} Node.js version $NODE_VERSION < $REQUIRED_VERSION"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "3. Checking Project Structure"
echo "------------------------------"
check_file "package.json"
check_file "apps/backend/package.json"
check_file "apps/admin-web/package.json"
check_file "apps/mobile/package.json"
check_file "packages/tournament-logic/package.json"
check_file "packages/shared-types/package.json"
echo ""

echo "4. Checking Dependencies"
echo "------------------------"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules directory exists"
else
    echo -e "${RED}✗${NC} node_modules directory missing - run 'npm install'"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "apps/backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Backend dependencies missing"
fi

if [ -d "packages/tournament-logic/dist" ]; then
    echo -e "${GREEN}✓${NC} tournament-logic is built"
else
    echo -e "${YELLOW}⚠${NC}  tournament-logic not built - run 'npm run build'"
fi
echo ""

echo "5. Checking Environment Configuration"
echo "--------------------------------------"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Root .env file exists"
    check_env_var ".env" "DATABASE_URL"
    check_env_var ".env" "JWT_SECRET"
    check_env_var ".env" "REFRESH_TOKEN_SECRET"
    check_env_var ".env" "DISCORD_CLIENT_ID"
    check_env_var ".env" "DISCORD_CLIENT_SECRET"
else
    echo -e "${RED}✗${NC} Root .env file missing - copy from .env.example"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "6. Checking Database"
echo "--------------------"
if [ -f ".env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ ! -z "$DATABASE_URL" ]; then
        echo "Database URL configured: ${DATABASE_URL:0:50}..."

        # Try to connect to database
        if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
            echo -e "${GREEN}✓${NC} Database connection successful"

            # Check if migrations have been run
            if psql "$DATABASE_URL" -c "SELECT * FROM _prisma_migrations LIMIT 1" &> /dev/null; then
                MIGRATION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM _prisma_migrations")
                echo -e "${GREEN}✓${NC} Database migrations applied ($MIGRATION_COUNT migrations)"
            else
                echo -e "${YELLOW}⚠${NC}  No migrations found - run 'cd apps/backend && npm run db:migrate'"
            fi
        else
            echo -e "${RED}✗${NC} Cannot connect to database"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${YELLOW}⚠${NC}  DATABASE_URL not configured"
    fi
fi
echo ""

echo "7. Checking Build Artifacts"
echo "----------------------------"
if [ -d "packages/tournament-logic/dist" ]; then
    if [ -f "packages/tournament-logic/dist/tournament.js" ]; then
        echo -e "${GREEN}✓${NC} tournament.js is built"
    else
        echo -e "${RED}✗${NC} tournament.js missing - run 'cd packages/tournament-logic && npm run build'"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check for stale files
if [ -f "packages/tournament-logic/src/tournament.js" ]; then
    echo -e "${YELLOW}⚠${NC}  Stale .js files in src/ - run: cd packages/tournament-logic && rm -f src/*.js src/*.d.ts src/*.map"
fi
echo ""

echo "8. Running Tests"
echo "----------------"
cd packages/tournament-logic
if npm test > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} tournament-logic tests pass"
else
    echo -e "${RED}✗${NC} tournament-logic tests FAIL"
    ERRORS=$((ERRORS + 1))
fi
cd ../..
echo ""

echo "=================================="
echo "Verification Complete"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You can now run:"
    echo "  Backend:    cd apps/backend && npm run dev"
    echo "  Admin Web:  cd apps/admin-web && npm run dev"
    echo "  Mobile:     cd apps/mobile && npm start"
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before running the application."
    exit 1
fi
