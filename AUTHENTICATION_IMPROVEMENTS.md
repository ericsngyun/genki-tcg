# Authentication Enhancement Recommendations

## Current State Analysis

### What You Have Now:
- ✅ Custom JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Strong password requirements (8+ chars, upper/lower/number)
- ✅ Email-based login
- ✅ Organization-scoped roles (OWNER, STAFF, PLAYER)
- ✅ Token expiry (7 days)

### Current Limitations:
- ❌ No refresh tokens (users logged out after 7 days)
- ❌ No password reset functionality
- ❌ No email verification
- ❌ No multi-factor authentication (MFA)
- ❌ No "Remember Me" functionality
- ❌ No social login (Google, Apple, etc.)
- ❌ No session management (can't log out from all devices)
- ❌ No rate limiting on login attempts
- ❌ Mobile users can't use biometric authentication
- ❌ Admin users have same login as regular players

---

## Recommended Improvements

I'll break this down by **Priority** and **Complexity** to help you decide what to implement first.

---

## 🔴 HIGH PRIORITY (Essential for Production)

### 1. Refresh Token System
**Why:** Users shouldn't have to re-login every 7 days. Mobile users especially expect persistent sessions.

**Current Problem:**
- Access token expires in 7 days
- User gets logged out and has to enter credentials again
- Poor mobile app experience

**Solution:**
- Issue both access token (15-30 min expiry) and refresh token (30-90 days)
- Store refresh tokens in database with device info
- Auto-refresh access tokens in the background
- Allow users to revoke refresh tokens (logout from specific devices)

**Complexity:** Medium (2-3 days)

**Files to Change:**
- `apps/backend/src/auth/auth.service.ts`
- Add `RefreshToken` table to Prisma schema
- Add `/auth/refresh` endpoint
- Update frontend token handling

---

### 2. Password Reset Flow
**Why:** Users forget passwords. Without reset functionality, they're locked out forever.

**Current Problem:**
- No way to reset forgotten password
- Users have to contact admin to reset manually

**Solution:**
- Add "Forgot Password" button on login
- Send secure reset link via email
- Time-limited reset tokens (1 hour expiry)
- Require strong password on reset

**Complexity:** Medium (2-3 days)

**Implementation:**
```typescript
// New endpoints needed:
POST /auth/forgot-password      // Send reset email
POST /auth/reset-password        // Reset with token
```

**Requirements:**
- Email service (SendGrid, Resend, or AWS SES)
- Password reset tokens table
- Email templates

---

### 3. Email Verification
**Why:** Prevents fake signups, ensures users own their email addresses.

**Current Problem:**
- Anyone can sign up with any email (even fake ones)
- No way to verify user identity

**Solution:**
- Send verification email on signup
- User account starts as "unverified"
- Require verification before accessing certain features
- Resend verification email if needed

**Complexity:** Medium (2-3 days)

**Implementation:**
```typescript
// Add to User model:
emailVerified: boolean
emailVerifiedAt: DateTime?

// New endpoints:
POST /auth/verify-email/:token
POST /auth/resend-verification
```

---

### 4. Rate Limiting on Authentication
**Why:** Prevent brute force attacks on login endpoint.

**Current Problem:**
- Attackers can try unlimited password combinations
- No protection against credential stuffing

**Solution:**
- Limit login attempts (5 per 15 minutes per IP)
- Limit signup attempts (3 per hour per IP)
- Add CAPTCHA after failed attempts (optional)

**Complexity:** Low (1 day)

**Implementation:**
```typescript
// Already have @nestjs/throttler installed
// Just need to configure:
@Throttle(5, 900) // 5 attempts per 15 minutes
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

---

## 🟡 MEDIUM PRIORITY (Improve UX)

### 5. Separate Admin Authentication
**Why:** Admin users need higher security than regular players.

**Current Problem:**
- Admins (OWNER/STAFF) use same login as players
- Same security requirements for all users
- No admin-specific features (e.g., 2FA)

**Solution:**

**Option A: Separate Admin Portal Login**
- Admin dashboard uses different auth endpoint
- Require stronger passwords for admin accounts
- Shorter session times (1 hour vs 7 days)
- Require re-authentication for sensitive actions

**Option B: Role-Based Security Policies**
- Different token expiry based on role (OWNER: 1hr, STAFF: 4hr, PLAYER: 7d)
- Require MFA for OWNER/STAFF roles
- IP whitelist for admin access (optional)

**Complexity:** Medium (2-3 days)

**Recommended:** Option B (more flexible)

---

### 6. Mobile Biometric Authentication
**Why:** Mobile users expect Face ID / Touch ID for quick access.

**Current Problem:**
- Users have to type email/password every login
- Poor mobile UX compared to other apps

**Solution:**
- After first login, store refresh token securely
- Use device keychain/secure storage
- Offer biometric unlock for subsequent logins
- Biometrics unlock → fetch new access token using refresh token

**Complexity:** Medium (requires native mobile work)

**Implementation:**
- Backend: Already done if you implement refresh tokens (#1)
- Mobile: Use `expo-local-authentication` and `expo-secure-store`

```typescript
// Mobile app pseudocode:
if (await LocalAuthentication.hasHardwareAsync()) {
  const result = await LocalAuthentication.authenticateAsync();
  if (result.success) {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    const newAccessToken = await api.refreshToken(refreshToken);
  }
}
```

---

### 7. Social Login (Google, Apple)
**Why:** Easier signup/login, users don't need to remember another password.

**Pros:**
- Faster signup flow
- No password to remember
- Auto-verified emails
- Better mobile UX (especially Apple Sign-In)

**Cons:**
- More complex to implement
- Requires OAuth setup
- Privacy concerns for some users

**Complexity:** High (5-7 days)

**Recommendation:** Not essential for TCG tournament app, but nice to have.

---

## 🟢 LOW PRIORITY (Nice to Have)

### 8. Multi-Factor Authentication (MFA)
**Why:** Extra security layer for admin accounts.

**Solution:**
- TOTP (Time-based One-Time Password) via Google Authenticator
- SMS codes (expensive, not recommended)
- Email codes (less secure but easier)

**Complexity:** High (4-5 days)

**Recommendation:** Only for OWNER/STAFF roles if you implement it.

---

### 9. Session Management Dashboard
**Why:** Let users see and revoke active sessions.

**Features:**
- See all logged-in devices
- See last login time and IP
- Revoke specific sessions
- "Log out everywhere" button

**Complexity:** Medium (3-4 days)

**Requires:** Refresh token system (#1) to be implemented first.

---

### 10. Magic Link Login
**Why:** Passwordless login for players who forget passwords often.

**How it works:**
- User enters email
- Receive login link via email
- Click link → auto logged in
- No password needed

**Complexity:** Medium (2-3 days)

**Recommendation:** Good for player accounts, not admin accounts.

---

## Recommended Implementation Plan

### Phase 1: Essential Security (Week 1-2)
1. **Refresh Tokens** (#1) - 3 days
2. **Password Reset** (#2) - 3 days
3. **Rate Limiting** (#4) - 1 day
4. **Email Verification** (#3) - 2 days

**Total:** ~9 days of development

### Phase 2: Admin Security (Week 3)
5. **Separate Admin Auth** (#5) - 3 days
6. **Admin Session Timeout** - 1 day

**Total:** ~4 days of development

### Phase 3: Mobile UX (Week 4)
7. **Mobile Biometric Auth** (#6) - 3-4 days
8. **Session Management** (#9) - 2 days

**Total:** ~5-6 days of development

### Phase 4: Optional Enhancements (Future)
- Social Login (#7)
- MFA (#8)
- Magic Links (#10)

---

## Quick Wins (Can Implement Today)

### 1. Rate Limiting (1 hour)
```typescript
// apps/backend/src/auth/auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Throttle(5, 900) // 5 attempts per 15 minutes
  @Post('login')
  async login(@Body() dto: LoginDto) { ... }

  @Throttle(3, 3600) // 3 signups per hour
  @Post('signup')
  async signup(@Body() dto: SignupDto) { ... }
}
```

### 2. Shorter Admin Sessions (30 minutes)
```typescript
// apps/backend/src/auth/auth.service.ts
private generateToken(user: User, membership: OrgMembership, orgId: string): string {
  const payload: JwtPayload = { ... };

  // Shorter expiry for admin roles
  const expiresIn = ['OWNER', 'STAFF'].includes(membership.role)
    ? '1h'  // 1 hour for admins
    : '7d'; // 7 days for players

  return this.jwtService.sign(payload, { expiresIn });
}
```

### 3. Add Password Strength Indicator (Frontend)
Show users how strong their password is as they type.

---

## Technology Recommendations

### For Email Sending:
1. **Resend** (Recommended - modern, simple API)
   - 100 emails/day free
   - $20/month for 50,000 emails
   - Best developer experience

2. **SendGrid** (Reliable, established)
   - 100 emails/day free
   - Good deliverability
   - More complex API

3. **AWS SES** (Cheapest at scale)
   - $0.10 per 1,000 emails
   - Requires AWS setup
   - More complex configuration

### For MFA (if you implement):
1. **speakeasy** (TOTP library for Node.js)
2. **qrcode** (Generate QR codes for authenticator apps)

### For Mobile Biometrics:
1. **expo-local-authentication** (Face ID / Touch ID)
2. **expo-secure-store** (Encrypted storage for tokens)

---

## Alternative: Use an Authentication Provider

Instead of building everything yourself, consider using a managed auth provider:

### Option 1: Clerk
**Pros:**
- Handles everything (MFA, social login, sessions, etc.)
- Beautiful pre-built UI components
- Excellent mobile support
- Built-in admin dashboard
- $25/month for 10,000 MAU

**Cons:**
- Vendor lock-in
- Monthly cost
- Less customization

### Option 2: Supabase Auth
**Pros:**
- Open source
- Free tier (50,000 MAU)
- Built-in email/password, social, magic links
- Row-level security for database
- Can self-host

**Cons:**
- More complex setup
- Less polished than Clerk
- Need to migrate existing users

### Option 3: Keep Custom Auth (Current)
**Pros:**
- Full control
- No monthly costs
- No vendor lock-in
- Privacy-focused

**Cons:**
- Have to build/maintain everything
- Security responsibility on you
- More development time

---

## My Recommendation

**For Your Use Case (TCG Tournament Platform):**

### Implement These First (Phase 1):
1. ✅ **Refresh Tokens** - Critical for mobile app
2. ✅ **Password Reset** - Users will lock themselves out
3. ✅ **Rate Limiting** - Easy security win
4. ✅ **Email Verification** - Prevent spam signups

### Then Add (Phase 2):
5. ✅ **Separate Admin Security** - Higher security for staff
6. ✅ **Mobile Biometrics** - Great UX improvement

### Consider Later:
- MFA for admin accounts only
- Session management dashboard
- Social login (if users request it)

### Don't Bother With:
- Magic links (password reset is enough)
- SMS 2FA (expensive and unnecessary)

---

## Cost Analysis

### DIY Custom Auth (Current + Improvements):
- **Development Time:** 3-4 weeks
- **Monthly Cost:** ~$10-20 (email service)
- **Maintenance:** Ongoing (security updates, bug fixes)

### Clerk (Managed Provider):
- **Development Time:** 3-5 days (integration)
- **Monthly Cost:** $25-100 (depending on users)
- **Maintenance:** Minimal (they handle security)

### Supabase Auth:
- **Development Time:** 1-2 weeks (migration + integration)
- **Monthly Cost:** $0-25 (free tier covers most needs)
- **Maintenance:** Low (they handle most security)

---

## Questions to Consider

1. **How many users do you expect?**
   - < 1,000: Stay custom or use Supabase free tier
   - 1,000-10,000: Custom auth is fine
   - 10,000+: Consider Clerk or Supabase

2. **How important is time to market?**
   - Need it fast: Use Clerk (3 days)
   - Can wait: Build custom features (3-4 weeks)

3. **What's your budget?**
   - $0/month: Stay custom or Supabase free
   - $25-100/month: Clerk is worth it

4. **How technical is your team?**
   - Strong backend skills: Custom is fine
   - Prefer managed: Use Clerk

5. **Do you need advanced features?**
   - Basic auth only: Stay custom
   - MFA, social, magic links: Use provider

---

## Next Steps

1. **Review this document** with your team
2. **Decide on priority:** Security first vs UX first?
3. **Choose approach:** Build custom or migrate to provider?
4. **If building custom:** Start with Phase 1 (refresh tokens + password reset)
5. **If using provider:** I can help you migrate to Clerk or Supabase

Let me know which direction you want to go, and I can help implement it!

---

**Last Updated:** 2025-01-18
**Status:** Recommendations for review
