#!/bin/bash

# Genki TCG - Mobile Full Build & Submit Script
# Usage: ./scripts/mobile-full-build.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🍏 Genki TCG - iOS Full Build & Submit${NC}"
echo "========================================"

# Navigate to mobile directory
cd "$(dirname "$0")/../apps/mobile"

# Read current version from app.json
CURRENT_VERSION=$(node -p "require('./app.json').expo.version")

echo -e "\n${BLUE}Current version:${NC} $CURRENT_VERSION"

# Suggest next version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

NEXT_PATCH="$MAJOR.$MINOR.$((PATCH + 1))"
NEXT_MINOR="$MAJOR.$((MINOR + 1)).0"
NEXT_MAJOR="$((MAJOR + 1)).0.0"

echo -e "\n${YELLOW}Suggested versions:${NC}"
echo "  1) $NEXT_PATCH (patch - bug fixes only)"
echo "  2) $NEXT_MINOR (minor - new features)"
echo "  3) $NEXT_MAJOR (major - breaking changes)"
echo "  4) Custom version"

read -p "Select version (1-4): " VERSION_CHOICE

case $VERSION_CHOICE in
    1)
        NEW_VERSION="$NEXT_PATCH"
        ;;
    2)
        NEW_VERSION="$NEXT_MINOR"
        ;;
    3)
        NEW_VERSION="$NEXT_MAJOR"
        ;;
    4)
        read -p "Enter custom version (x.y.z): " NEW_VERSION
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${BLUE}New version:${NC} $NEW_VERSION"

# Update version in app.json
echo -e "${YELLOW}Updating app.json...${NC}"
node -e "
const fs = require('fs');
const appJson = require('./app.json');
appJson.expo.version = '$NEW_VERSION';
fs.writeFileSync('./app.json', JSON.stringify(appJson, null, 2) + '\n');
"

echo -e "${GREEN}✓ Version updated to $NEW_VERSION${NC}"

# Commit version change
echo -e "\n${YELLOW}Committing version change...${NC}"
git add app.json
git commit -m "chore(mobile): bump version to $NEW_VERSION"
git push origin main

echo -e "${GREEN}✓ Version committed and pushed${NC}"

# Confirm build
echo -e "\n${YELLOW}Ready to build:${NC}"
echo "  Version: $NEW_VERSION"
echo "  Platform: iOS"
echo "  Profile: production"
echo ""
read -p "Start build? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. Version has been updated but build not started."
    exit 0
fi

# Start build
echo -e "\n${GREEN}🔨 Building iOS app...${NC}"
echo "This will take ~15-20 minutes"
echo ""

npx eas-cli build --platform ios --profile production

if [ $? -ne 0 ]; then
    echo -e "\n${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Build completed successfully!${NC}"

# Ask about submission
echo ""
read -p "Submit to App Store Connect now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${GREEN}📤 Submitting to App Store Connect...${NC}"
    npx eas-cli submit --platform ios --latest

    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✅ Submitted successfully!${NC}"
        echo ""
        echo "📝 Next steps:"
        echo "  1. Go to App Store Connect"
        echo "  2. Update 'What's New' section"
        echo "  3. Select the build"
        echo "  4. Submit for review"
        echo ""
        echo "🔗 https://appstoreconnect.apple.com"
    else
        echo -e "\n${RED}❌ Submission failed${NC}"
        exit 1
    fi
else
    echo ""
    echo "Build completed but not submitted."
    echo "To submit later, run:"
    echo "  npx eas-cli submit --platform ios --latest"
fi
