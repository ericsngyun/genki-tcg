#!/bin/bash

# Genki TCG - Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔍 Genki TCG - Deployment Verification${NC}"
echo "========================================"

ERRORS=0

# Check Backend
echo -e "\n${YELLOW}Checking Backend (api.genkitcg.app)...${NC}"

# Health check
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.genkitcg.app/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Health check: OK${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $HEALTH_RESPONSE)${NC}"
    ((ERRORS++))
fi

# Test events endpoint
EVENTS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.genkitcg.app/api/events)
if [ "$EVENTS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Events API: OK${NC}"
else
    echo -e "${RED}✗ Events API failed (HTTP $EVENTS_RESPONSE)${NC}"
    ((ERRORS++))
fi

# Test leaderboard endpoint
LEADERBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.genkitcg.app/api/leaderboard)
if [ "$LEADERBOARD_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Leaderboard API: OK${NC}"
else
    echo -e "${RED}✗ Leaderboard API failed (HTTP $LEADERBOARD_RESPONSE)${NC}"
    ((ERRORS++))
fi

# Check Admin Web
echo -e "\n${YELLOW}Checking Admin Web (admin.genkitcg.app)...${NC}"

ADMIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.genkitcg.app)
if [ "$ADMIN_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Admin Web: OK${NC}"
else
    echo -e "${RED}✗ Admin Web failed (HTTP $ADMIN_RESPONSE)${NC}"
    ((ERRORS++))
fi

# Summary
echo -e "\n${YELLOW}================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed${NC}"
    exit 1
fi
