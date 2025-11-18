# Authentication Enhancement - Deployment Steps

## ⚠️ IMPORTANT: Read Before Deploying

This guide walks you through deploying the authentication enhancements to your Railway backend and updating your frontend applications.

---

## 📋 Pre-Deployment Checklist

- [ ] Backup your current database (optional but recommended)
- [ ] Review all changes in `AUTH_ENHANCEMENT_SUMMARY.md`
- [ ] Ensure you have access to Railway dashboard
- [ ] Ensure frontend apps are ready to be updated
- [ ] Have time for testing (30-60 minutes)

---

## Step 1: Test Locally First (Recommended)

### If you have a local database setup:

```bash
# 1. Navigate to backend directory
cd apps/backend

# 2. Generate Prisma client (already done)
npx prisma generate

# 3. Create migration
npx prisma migrate dev --name add-auth-enhancements

# 4. Start backend locally
npm run dev

# 5. Test the new endpoints using Postman/curl
```

### Test the new features:

```bash
# Test rate limiting (should block after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Test password reset request
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@genki-tcg.com"}'
```

---

## Step 2: Deploy to Railway

### Option A: Using Git Push (Recommended)

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Add authentication enhancements

- Add refresh token system
- Add password reset flow
- Add rate limiting
- Add role-based token expiry
- Add email verification fields

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 2. Push to your main branch
git push origin your-branch-name

# 3. Railway will auto-deploy
```

### Option B: Using Railway CLI

```bash
# 1. Login to Railway
railway login

# 2. Link to your project
railway link

# 3. Deploy
railway up
```

---

## Step 3: Run Database Migration on Railway

### Method 1: Using Railway Dashboard (Easiest)

1. Go to Railway dashboard: https://railway.app/dashboard
2. Click on your project → Backend service
3. Click on "Deployments" tab
4. Find the latest deployment
5. Click "View Logs"
6. **The migration should run automatically** during deployment via the `start.sh` script

**Verify migration ran:**
- Look for logs like: `Running Prisma migrations...`
- Should see: `Migration applied successfully`

### Method 2: Using Railway CLI (Manual)

```bash
# Run migration manually
railway run --service backend npx prisma migrate deploy
```

### Method 3: Using Railway Shell (Advanced)

1. Railway Dashboard → Backend Service → "Shell" tab
2. Run:
```bash
cd apps/backend
npx prisma migrate deploy
```

---

## Step 4: Verify Backend Deployment

### Check Health Endpoint

```bash
curl https://genki-tcg-production.up.railway.app/health
```

**Expected response:**
```json
{"status":"ok"}
```

### Test New Endpoints

#### 1. Test Login (should return accessToken + refreshToken)

```bash
curl -X POST https://genki-tcg-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@genki-tcg.com","password":"password123"}'
```

**Expected response:**
```json
{
  "user": {...},
  "accessToken": "eyJ...",
  "refreshToken": "long-hex-string...",
  "orgMembership": {...}
}
```

#### 2. Test Refresh Token

```bash
# Save the refreshToken from previous response
curl -X POST https://genki-tcg-production.up.railway.app/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"paste-refresh-token-here"}'
```

**Expected response:**
```json
{
  "accessToken": "new-token...",
  "user": {...},
  "orgMembership": {...}
}
```

#### 3. Test Password Reset

```bash
curl -X POST https://genki-tcg-production.up.railway.app/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@genki-tcg.com"}'
```

**Expected response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent.",
  "resetToken": "dev-token-here" // Only in development
}
```

#### 4. Test Rate Limiting

```bash
# Try login 6 times rapidly (should block on 6th attempt)
for i in {1..6}; do
  curl -X POST https://genki-tcg-production.up.railway.app/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\n--- Attempt $i ---\n"
done
```

**Expected:** 6th attempt should return 429 (Too Many Requests)

---

## Step 5: Update Frontend Applications

### Admin Web (`apps/admin-web`)

#### 1. Update API Client

Find your auth API calls and update them:

**Before:**
```typescript
// Old login response
const { token, user } = response.data;
localStorage.setItem('token', token);
```

**After:**
```typescript
// New login response
const { accessToken, refreshToken, user } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

#### 2. Add Token Refresh Interceptor

Create `apps/admin-web/lib/api-client.ts` (or update existing):

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add access token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed - logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 3. Add "Forgot Password" Link

Update your login page to include a "Forgot Password" link.

#### 4. Create Password Reset Page

Create `apps/admin-web/app/reset-password/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      setMessage(data.message);
      // Redirect to login after 2 seconds
      setTimeout(() => (window.location.href = '/login'), 2000);
    } catch (error) {
      setMessage('Reset failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      <button type="submit">Reset Password</button>
      {message && <p>{message}</p>}
    </form>
  );
}
```

### Mobile App (`apps/mobile`)

#### 1. Install Secure Storage

```bash
cd apps/mobile
npx expo install expo-secure-store
```

#### 2. Update Token Storage

Replace `localStorage` with `SecureStore`:

```typescript
import * as SecureStore from 'expo-secure-store';

// Save tokens
await SecureStore.setItemAsync('accessToken', accessToken);
await SecureStore.setItemAsync('refreshToken', refreshToken);

// Get tokens
const accessToken = await SecureStore.getItemAsync('accessToken');
const refreshToken = await SecureStore.getItemAsync('refreshToken');

// Delete tokens
await SecureStore.deleteItemAsync('accessToken');
await SecureStore.deleteItemAsync('refreshToken');
```

#### 3. Add Token Refresh (same logic as admin web)

#### 4. Add Biometric Auth (Optional - Future Enhancement)

---

## Step 6: Test Everything End-to-End

### Admin Web Testing

1. **Login Flow:**
   - [ ] Can login with owner@genki-tcg.com / password123
   - [ ] accessToken and refreshToken saved in localStorage
   - [ ] Redirected to dashboard

2. **Token Refresh:**
   - [ ] Wait for token to expire (or manually delete accessToken)
   - [ ] Make an API request
   - [ ] Should auto-refresh and continue

3. **Password Reset:**
   - [ ] Click "Forgot Password"
   - [ ] Enter email address
   - [ ] Check backend logs for reset token (in development)
   - [ ] Navigate to `/reset-password?token=TOKEN`
   - [ ] Reset password successfully
   - [ ] Login with new password

4. **Rate Limiting:**
   - [ ] Try to login with wrong password 6 times
   - [ ] Should be blocked after 5 attempts

5. **Logout:**
   - [ ] Logout button clears tokens
   - [ ] Redirected to login

### Mobile App Testing

1. **Login Flow:**
   - [ ] Login works
   - [ ] Tokens stored securely
   - [ ] Can navigate app

2. **Token Refresh:**
   - [ ] App continues working even after access token expires
   - [ ] No forced logout

3. **Password Reset:**
   - [ ] Same as admin web

---

## Step 7: Monitor Production

### Check Railway Logs

1. Railway Dashboard → Backend Service → "Logs"
2. Look for:
   - Any migration errors
   - Authentication errors
   - Rate limit activations

### Monitor for Issues

- Watch for 401 errors (might indicate refresh token issues)
- Watch for 429 errors (rate limiting working)
- Monitor user complaints

---

## Rollback Plan (If Something Goes Wrong)

### If Backend Breaks:

1. **Revert Git Commit:**
   ```bash
   git revert HEAD
   git push origin your-branch
   ```

2. **Railway will auto-deploy the previous version**

3. **Database changes are additive** (adding new tables), so no data loss

### If Frontend Breaks:

1. **Old frontend will still work** because:
   - Backend still accepts old `token` field
   - Old logins still work (just won't get refresh tokens)

2. **Revert frontend changes:**
   ```bash
   git revert HEAD -- apps/admin-web
   git revert HEAD -- apps/mobile
   git push
   ```

---

## Common Issues & Solutions

### Issue: Migration doesn't run

**Solution:**
```bash
# Run manually via Railway CLI
railway run --service backend npx prisma migrate deploy
```

### Issue: 401 errors after deployment

**Symptoms:** Users getting logged out constantly

**Cause:** Frontend using old `token` field name

**Solution:** Update frontend to use `accessToken`

### Issue: Password reset emails not sending

**Cause:** Email service not configured yet

**Status:** Expected - emails are logged to console in development

**Solution:** Implement email service (see AUTH_ENHANCEMENT_SUMMARY.md)

### Issue: Rate limiting too strict

**Solution:** Adjust limits in `auth.controller.ts`:
```typescript
@Throttle({ default: { limit: 10, ttl: 900000 } }) // Increase to 10 attempts
```

### Issue: Admin sessions expire too quickly

**Solution:** Adjust role-based expiry in `auth.service.ts`:
```typescript
case 'OWNER':
  return '4h'; // Change from 1h to 4h
```

---

## Next Steps After Deployment

1. **Integrate Email Service** (Resend, SendGrid, etc.)
   - See `AUTH_ENHANCEMENT_SUMMARY.md` for details
   - Required for production password reset

2. **Add Password Reset UI**
   - Create forgot password page
   - Create reset password page
   - Add links to login page

3. **Implement Biometric Auth** (Mobile)
   - Use `expo-local-authentication`
   - Better mobile UX

4. **Monitor & Optimize**
   - Watch rate limiting effectiveness
   - Adjust token expiry times based on usage
   - Monitor session management

---

## Support

If you encounter issues:

1. Check Railway logs first
2. Test endpoints with curl/Postman
3. Check browser console for frontend errors
4. Review `AUTH_ENHANCEMENT_SUMMARY.md` for API changes

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Status:** [ ] Success  [ ] Partial  [ ] Rollback

**Notes:**
