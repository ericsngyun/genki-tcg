#!/bin/bash

# Genki TCG - Mobile OTA Update Script
# Usage: ./scripts/mobile-ota-update.sh "Bug fix description"

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Genki TCG - Mobile OTA Update${NC}"
echo "=================================="

# Check if message provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Update message required${NC}"
    echo "Usage: ./scripts/mobile-ota-update.sh \"Your update message\""
    exit 1
fi

UPDATE_MESSAGE="$1"

# Navigate to mobile directory
cd "$(dirname "$0")/../apps/mobile"

echo -e "\n${YELLOW}📦 Current directory:${NC} $(pwd)"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}⚠️  Warning: You have uncommitted changes${NC}"
    echo "Uncommitted files:"
    git status -s
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Pre-flight checks
echo -e "\n${YELLOW}✓ Running pre-flight checks...${NC}"

# Check if on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Warning: Not on main branch (current: $BRANCH)${NC}"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Confirm update
echo -e "\n${YELLOW}📝 Update Details:${NC}"
echo "Branch: $BRANCH"
echo "Message: $UPDATE_MESSAGE"
echo ""
read -p "Proceed with OTA update? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Publish update
echo -e "\n${GREEN}🚀 Publishing OTA update...${NC}"
npx eas-cli update --branch production --message "$UPDATE_MESSAGE"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ OTA Update published successfully!${NC}"
    echo -e "${GREEN}Users will receive the update on next app restart.${NC}"
    echo ""
    echo "📊 View update status: https://expo.dev"
    echo "⏱️  Typical adoption: 70%+ within 24 hours"
else
    echo -e "\n${RED}❌ OTA Update failed${NC}"
    exit 1
fi
