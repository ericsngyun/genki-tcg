# 🧪 Authentication Testing - Quick Start

## ✅ What's Running

- **Backend:** https://genki-tcg-production.up.railway.app (Live on Railway)
- **Admin Web:** http://localhost:3000 (Running locally)

---

## 🎯 Critical Tests to Run Now

### Test 1: Login with New Token Format (5 minutes)

**Steps:**
1. Open http://localhost:3000 in your browser
2. Open DevTools (F12) → Application tab → Local Storage
3. Clear all localStorage (right-click → Clear)
4. Go back to the app (should redirect to /login)
5. Login with:
   - Email: `owner@genki-tcg.com`
   - Password: `password123`

**What to Check:**
1. Login succeeds ✅
2. Redirected to dashboard ✅
3. In localStorage, you should see:
   - `access_token` (starts with "eyJ...")
   - `refresh_token` (long hex string like "778e83...")
   - **NO** `auth_token` (old format)

**Screenshot:**
![DevTools → Application → Local Storage](should show both tokens)

---

### Test 2: Automatic Token Refresh (3 minutes)

**Steps:**
1. While logged in, go to DevTools → Application → Local Storage
2. **Delete ONLY** the `access_token` (leave `refresh_token`)
3. Navigate to http://localhost:3000/dashboard/events

**What to Check:**
1. Page loads successfully (not kicked to login) ✅
2. New `access_token` appears in localStorage ✅
3. In DevTools → Network tab, you see a call to `/auth/refresh` ✅

**This proves:** Automatic token refresh is working!

---

### Test 3: Verify Owner Has 1-Hour Sessions (2 minutes)

**Steps:**
1. While logged in as owner, copy the `access_token` from localStorage
2. Go to https://jwt.io
3. Paste the token in the "Encoded" field
4. Look at the "Decoded" payload on the right

**What to Check:**
Look for these fields in the payload:
```json
{
  "role": "OWNER",
  "iat": 1234567890,   // Issued at timestamp
  "exp": 1234571490    // Expiry timestamp
}
```

Calculate: `exp - iat` = should be **3600** (1 hour in seconds)

**This proves:** Owners have 1-hour sessions (enhanced security)!

---

### Test 4: Logout Revokes Token (2 minutes)

**Steps:**
1. Before logging out, copy your `refresh_token` from localStorage
2. Click the Logout button
3. Open a terminal and run:
   ```bash
   curl -X POST https://genki-tcg-production.up.railway.app/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"YOUR_COPIED_REFRESH_TOKEN"}'
   ```

**What to Check:**
1. Logout succeeds, redirected to login ✅
2. localStorage is empty ✅
3. Curl command returns 401 error (token revoked) ✅

**This proves:** Server-side session revocation works!

---

### Test 5: Full User Journey (5 minutes)

**Steps:**
1. Clear localStorage and login again
2. Navigate through the dashboard:
   - Events page
   - Players page
   - Credits page
   - Create an event (if you want)
3. Logout
4. Login again

**What to Check:**
1. All pages load without errors ✅
2. No 401 errors in console ✅
3. Smooth navigation ✅
4. Can logout and login again ✅

---

## 📊 Quick Checklist

After running all tests:

- [ ] Login stores `access_token` and `refresh_token`
- [ ] Automatic token refresh works (no forced logout)
- [ ] Owner sessions = 1 hour
- [ ] Logout revokes refresh token on server
- [ ] Full dashboard navigation works
- [ ] Can logout and login multiple times

---

## 🚨 Common Issues

### "Can't connect to backend"
- **Check:** Is Railway backend up? https://genki-tcg-production.up.railway.app/health
- **Should return:** `{"status":"ok"}`

### Still seeing old `auth_token`
- **Fix:** Clear browser cache (Ctrl+Shift+R)
- **Check:** `apps/admin-web/.env.local` has correct backend URL

### Token refresh not working
- **Check:** Browser console for errors
- **Check:** Network tab for `/auth/refresh` calls
- **Fix:** Make sure you have a valid `refresh_token` in localStorage

---

## ✅ If All Tests Pass

**You're ready to move on to:**
1. Update mobile app ➡️
2. Add password reset UI ➡️
3. Deploy to production ➡️

---

## ❌ If Tests Fail

**Let me know which test failed and I'll help debug:**
- Share the error message from browser console
- Share the Network tab showing the failed request
- Check Railway backend logs if needed

---

## 🎉 Success Criteria

**Admin web authentication is complete when:**
- ✅ All 5 critical tests pass
- ✅ No console errors
- ✅ Smooth user experience
- ✅ Automatic token refresh working

---

**Go ahead and run these tests now!**

Once you confirm they all work, we'll move to the next step: **Update Mobile App** 📱

Let me know the results!
