# Authentication Endpoints Testing Guide

## 1. Test Health Check (Verify backend is up)

```bash
curl https://genki-tcg-production.up.railway.app/health
```

**Expected:** `{"status":"ok"}`

---

## 2. Test Login (Should return both tokens)

```bash
curl -X POST https://genki-tcg-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"owner@genki-tcg.com\",\"password\":\"password123\"}"
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "owner@genki-tcg.com",
    "name": "Shop Owner",
    ...
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "a1b2c3d4...",
  "orgMembership": {
    "role": "OWNER",
    ...
  }
}
```

**Save the refreshToken from the response for next test!**

---

## 3. Test Refresh Token

```bash
# Replace YOUR_REFRESH_TOKEN with the token from step 2
curl -X POST https://genki-tcg-production.up.railway.app/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN\"}"
```

**Expected Response:**
```json
{
  "accessToken": "new-token-here",
  "user": {...},
  "orgMembership": {...}
}
```

---

## 4. Test Password Reset Request

```bash
curl -X POST https://genki-tcg-production.up.railway.app/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"owner@genki-tcg.com\"}"
```

**Expected Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent.",
  "resetToken": "token-here-in-dev-mode"
}
```

**Note:** In development, the reset token is returned in the response. Check Railway logs for the token.

---

## 5. Test Rate Limiting (Should block after 5 attempts)

```bash
# Run this command 6 times rapidly
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://genki-tcg-production.up.railway.app/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@test.com\",\"password\":\"wrongpassword\"}"
  echo -e "\n---\n"
  sleep 1
done
```

**Expected:**
- First 5 attempts: `{"message":"Invalid credentials"}`
- 6th attempt: HTTP 429 (Too Many Requests)

---

## 6. Test Get Sessions (Requires valid access token)

```bash
# Replace YOUR_ACCESS_TOKEN with a valid access token
curl https://genki-tcg-production.up.railway.app/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "...",
    "deviceName": null,
    "deviceType": null,
    "ipAddress": null,
    "createdAt": "...",
    "lastUsedAt": "..."
  }
]
```

---

## 7. Test Logout (Revoke refresh token)

```bash
# Replace tokens with actual values
curl -X POST https://genki-tcg-production.up.railway.app/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN\"}"
```

**Expected Response:**
```json
{
  "message": "Refresh token revoked successfully"
}
```

---

## Verification Checklist

After Railway deployment completes:

- [ ] Health endpoint returns OK
- [ ] Login returns `accessToken` and `refreshToken` (not just `token`)
- [ ] Refresh endpoint works with refresh token
- [ ] Password reset request succeeds
- [ ] Rate limiting blocks after 5 failed login attempts
- [ ] Sessions endpoint shows active sessions
- [ ] Logout revokes refresh token

---

## Checking Railway Logs

1. Go to: https://railway.app/dashboard
2. Click on your project → Backend service
3. Click "Deployments" tab → Latest deployment
4. Click "View Logs"

**Look for:**
- ✅ `Running Prisma migrations...`
- ✅ `Migration applied successfully`
- ✅ `🚀 Genki TCG API running on http://localhost:3000`
- ❌ Any migration errors (P3XXX error codes)

---

## If Migration Fails

If you see migration errors in Railway logs:

```bash
# Option 1: Via Railway CLI
railway link
railway run --service backend npx prisma migrate deploy

# Option 2: Via Railway Dashboard Shell
# Go to: Railway Dashboard → Backend Service → Shell tab
cd apps/backend
npx prisma migrate deploy
```

---

## Common Issues

### Issue: Still returning old `token` field instead of `accessToken`

**Cause:** Old deployment still running

**Fix:** Wait for new deployment to complete, check deployment logs

### Issue: 500 error on login

**Cause:** Migration didn't run, RefreshToken table doesn't exist

**Fix:** Manually run migration via Railway CLI or dashboard shell

### Issue: Rate limiting not working

**Cause:** May need to restart backend after deployment

**Fix:** Railway Dashboard → Backend Service → "Restart"

---

**Created:** 2025-01-18
**Purpose:** Verify authentication enhancements deployed correctly
