# Admin Web Authentication Testing Plan

## Test Environment
- **Backend:** https://genki-tcg-production.up.railway.app
- **Admin Web:** http://localhost:3000 (local development)

---

## Pre-Test Checklist

Before starting:
- [ ] Admin web code changes committed and pulled
- [ ] Node modules up to date (`npm install` in admin-web if needed)
- [ ] Admin web dev server running (`npm run dev:admin` from root)

---

## Test 1: Fresh Login (New Token Format)

### Steps:
1. Clear browser localStorage (DevTools → Application → Local Storage → Clear)
2. Navigate to http://localhost:3000
3. Should redirect to `/login`
4. Login with:
   - Email: `owner@genki-tcg.com`
   - Password: `password123`

### Expected Results:
- ✅ Login succeeds
- ✅ Redirected to dashboard
- ✅ Browser localStorage contains:
  - `access_token` (JWT format)
  - `refresh_token` (long hex string)
- ✅ NO `auth_token` (old format removed)

### How to Check:
1. Open DevTools (F12)
2. Go to Application tab → Local Storage → http://localhost:3000
3. Verify tokens exist

**Screenshot location to check:**
- Application → Local Storage → localhost:3000

---

## Test 2: Token Refresh (Automatic)

### Steps:
1. While logged in, open DevTools → Application → Local Storage
2. Delete the `access_token` (keep `refresh_token`)
3. Navigate to any dashboard page (e.g., http://localhost:3000/dashboard/events)
4. Watch the Network tab

### Expected Results:
- ✅ Automatic call to `/auth/refresh` endpoint
- ✅ New `access_token` saved to localStorage
- ✅ Page loads successfully (not redirected to login)
- ✅ You remain logged in

### How to Check:
1. DevTools → Network tab
2. Look for POST request to `/auth/refresh`
3. Check localStorage for new `access_token`

---

## Test 3: Session Expiry (Owner Role = 1 Hour)

### Steps:
1. Login as owner
2. Check the JWT token expiry:
   - Copy `access_token` from localStorage
   - Go to https://jwt.io
   - Paste the token
   - Check the `exp` field in the payload

### Expected Results:
- ✅ Token expires in ~1 hour (3600 seconds from `iat`)
- ✅ Owner role has shorter session than players

### How to Check:
```json
{
  "sub": "user-id",
  "email": "owner@genki-tcg.com",
  "orgId": "org-id",
  "role": "OWNER",
  "iat": 1234567890,
  "exp": 1234571490  // Should be iat + 3600 (1 hour)
}
```

---

## Test 4: Logout (Server-Side Revocation)

### Steps:
1. Login as owner
2. Save the `refresh_token` from localStorage (copy it)
3. Click logout button
4. Try to use the saved refresh token manually:
   ```bash
   curl -X POST https://genki-tcg-production.up.railway.app/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"YOUR_SAVED_TOKEN"}'
   ```

### Expected Results:
- ✅ Logout succeeds
- ✅ Redirected to login page
- ✅ localStorage cleared (`access_token` and `refresh_token` removed)
- ✅ Saved refresh token is INVALID (curl returns 401 error)

### How to Check:
- Browser: localStorage should be empty
- API: Curl should return error (token revoked)

---

## Test 5: Backward Compatibility (Old Token Migration)

### Steps:
1. Logout completely
2. Manually add old token format:
   - Open DevTools → Application → Local Storage
   - Add key: `auth_token`
   - Value: (get a valid token by logging in first, then use that as old token)
3. Refresh the page

### Expected Results:
- ✅ Old `auth_token` is migrated to `access_token`
- ✅ Old `auth_token` is removed from localStorage
- ✅ User remains logged in
- ✅ Dashboard loads successfully

---

## Test 6: Multiple Concurrent Requests (Request Queue)

### Steps:
1. Login as owner
2. Delete `access_token` from localStorage
3. Open multiple dashboard pages in new tabs quickly:
   - http://localhost:3000/dashboard/events
   - http://localhost:3000/dashboard/players
   - http://localhost:3000/dashboard/credits
4. Watch Network tab

### Expected Results:
- ✅ Only ONE call to `/auth/refresh` (not 3)
- ✅ All tabs get the new token
- ✅ All pages load successfully
- ✅ No duplicate refresh requests

### How to Check:
- DevTools → Network tab
- Filter by "refresh"
- Should see only 1 request, not 3

---

## Test 7: Invalid Refresh Token (Force Logout)

### Steps:
1. Login as owner
2. Manually corrupt the `refresh_token`:
   - DevTools → Application → Local Storage
   - Change `refresh_token` to "invalid-token-123"
3. Delete `access_token`
4. Try to navigate to dashboard

### Expected Results:
- ✅ Automatic logout (refresh fails)
- ✅ Redirected to login page
- ✅ localStorage cleared
- ✅ Error logged in console (expected behavior)

---

## Test 8: Rate Limiting Protection

### Steps:
1. Logout
2. Try to login with wrong password 6 times rapidly:
   - Email: `owner@genki-tcg.com`
   - Password: `wrongpassword`

### Expected Results:
- ✅ First 5 attempts: "Invalid credentials" error
- ✅ 6th attempt: "Too many requests" or rate limit error
- ✅ Must wait 15 minutes before trying again

### How to Check:
- Watch for error message on 6th attempt
- Network tab shows 429 status code

---

## Test 9: Role-Based Token Expiry

### Setup:
You need to test with different user roles.

**OWNER Test (1 hour expiry):**
1. Login as: `owner@genki-tcg.com` / `password123`
2. Check JWT expiry at https://jwt.io
3. Expected: `exp` = `iat` + 3600 (1 hour)

**STAFF Test (4 hour expiry):**
1. Login as: `staff@genki-tcg.com` / `password123`
2. Check JWT expiry
3. Expected: `exp` = `iat` + 14400 (4 hours)

**PLAYER Test (7 day expiry):**
1. Login as: `player1@test.com` / `password123`
2. Check JWT expiry
3. Expected: `exp` = `iat` + 604800 (7 days)

### Expected Results:
- ✅ Each role has different token expiry
- ✅ Owner sessions are shortest (most secure)
- ✅ Player sessions are longest (best UX)

---

## Test 10: Full User Journey

### Steps:
1. Fresh browser (clear all data)
2. Login as owner
3. Navigate to Events page
4. Create a new event
5. Navigate to Players page
6. Navigate to Credits page
7. Logout
8. Login again

### Expected Results:
- ✅ All pages load without issues
- ✅ All API calls succeed
- ✅ No 401 errors in console
- ✅ Seamless navigation
- ✅ Login after logout works

---

## Common Issues & Solutions

### Issue: "Invalid credentials" on login
**Cause:** Backend might not be updated
**Solution:** Check that Railway deployment completed successfully

### Issue: Still seeing `auth_token` instead of `access_token`
**Cause:** Browser cache or old code
**Solution:**
- Hard refresh (Ctrl+Shift+R)
- Clear cache
- Restart dev server

### Issue: 401 errors on every request
**Cause:** Token refresh not working
**Solution:**
- Check console for errors
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check Network tab for refresh endpoint calls

### Issue: Infinite redirect loop
**Cause:** Auth check failing
**Solution:**
- Clear localStorage completely
- Restart dev server
- Check backend is running

---

## Success Criteria

All tests should pass with these results:

- ✅ Login stores both tokens
- ✅ Automatic token refresh works
- ✅ Owner sessions expire in 1 hour
- ✅ Logout revokes refresh token on server
- ✅ Old tokens migrate automatically
- ✅ Request queue prevents duplicate refreshes
- ✅ Invalid refresh token forces logout
- ✅ Rate limiting blocks brute force
- ✅ Role-based expiry works correctly
- ✅ Full user journey works smoothly

---

## If Tests Fail

1. **Check backend logs** on Railway
2. **Check browser console** for errors
3. **Check Network tab** for failed requests
4. **Verify environment variables** (`.env.local`)
5. **Restart dev server**
6. **Clear browser cache and localStorage**

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark admin web complete
2. ➡️ Move to mobile app updates
3. ➡️ Add password reset UI
4. ➡️ Deploy to production

If tests fail:
1. Debug specific failing test
2. Check error messages
3. Review code changes
4. Re-test after fixes

---

**Test Date:** __________
**Tester:** __________
**Results:** ☐ All Pass  ☐ Some Fail  ☐ All Fail

**Notes:**
