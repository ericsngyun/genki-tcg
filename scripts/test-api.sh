#!/bin/bash
# API Testing Script
# Tests various endpoints of the Genki TCG API

set -e

# Configuration
API_URL="${API_URL:-https://genki-tcg-production.up.railway.app}"
TEST_EMAIL="owner@genki-tcg.com"
TEST_PASSWORD="password123"

echo "🧪 Testing Genki TCG API"
echo "================================"
echo "API URL: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    exit 1
fi
echo ""

# Test 2: Ready Check
echo "2️⃣  Testing Ready Endpoint..."
READY_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health/ready")
HTTP_CODE=$(echo "$READY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$READY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Ready check passed${NC}"
    echo "   Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Ready check failed (HTTP $HTTP_CODE)${NC}"
    exit 1
fi
echo ""

# Test 3: Authentication - Login
echo "3️⃣  Testing Authentication (Login)..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    # Extract access token
    ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "   Token obtained: ${ACCESS_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
    echo -e "${YELLOW}⚠️  Make sure to run the seed script first!${NC}"
    exit 1
fi
echo ""

# Test 4: Authenticated Request - Get Current User
echo "4️⃣  Testing Authenticated Request (Get Me)..."
ME_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ME_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Authenticated request successful${NC}"
    echo "   User data: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Authenticated request failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi
echo ""

# Test 5: Events Endpoint
echo "5️⃣  Testing Events Endpoint..."
EVENTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/events" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$EVENTS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$EVENTS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Events endpoint working${NC}"
    EVENT_COUNT=$(echo "$RESPONSE_BODY" | grep -o '"id"' | wc -l)
    echo "   Found $EVENT_COUNT event(s)"
else
    echo -e "${RED}❌ Events endpoint failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Test 6: Organization Endpoint
echo "6️⃣  Testing Organization Endpoint..."
ORG_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/orgs/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$ORG_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ORG_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Organization endpoint working${NC}"
    echo "   Organization data: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Organization endpoint failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ API Testing Complete!${NC}"
echo ""
echo "📝 Summary:"
echo "   API URL: $API_URL"
echo "   Test User: $TEST_EMAIL"
echo "   All critical endpoints are working"
echo ""
echo "🚀 Next Steps:"
echo "   1. Update frontend apps to use $API_URL"
echo "   2. Test frontend login with: $TEST_EMAIL / $TEST_PASSWORD"
echo "   3. Create your own admin account"
