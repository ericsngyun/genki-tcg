# Production Readiness Roadmap

**Current Status:** 70% Production Ready
**Target:** 95%+ Production Ready
**Timeline:** 4-6 weeks to full production readiness

---

## Executive Summary

Your codebase is **already in good shape** with:
- ✅ Strong security foundation (auth, RBAC, rate limiting, CORS)
- ✅ Comprehensive CI/CD pipeline
- ✅ Error monitoring (Sentry)
- ✅ Health checks and observability
- ✅ Clean architecture and type safety

**Key gaps to address:**
1. Test coverage (22.79% → 70%)
2. Redis caching implementation
3. API documentation (Swagger/OpenAPI)
4. Email service configuration
5. Performance optimization
6. Database backup strategy

---

## Priority Matrix

### 🔴 HIGH PRIORITY (Weeks 1-2)

#### 1. Increase Test Coverage (22.79% → 70%)
**Current:** 86 tests, 22.79% coverage
**Target:** 70% coverage with unit + integration tests
**Impact:** 🔴 CRITICAL - Required for production confidence

**Action Items:**
- [ ] Set up test database for integration tests
- [ ] Add unit tests for all service methods
- [ ] Add integration tests for critical API endpoints
- [ ] Mock external dependencies (Discord OAuth, Email)
- [ ] Fix test setup to work without database running (use test containers or mocks)

**Files to prioritize:**
```
apps/backend/src/
├── auth/auth.service.spec.ts (40 tests) ✅ Good coverage
├── events/events.service.spec.ts (67 tests) ✅ Good coverage
├── credits/credits.service.spec.ts (19 tests) ⚠️ Needs more
├── rounds/rounds.service.spec.ts (22 tests) ⚠️ Needs more
├── matches/matches.service.spec.ts (29 tests) ⚠️ Needs more
└── ratings/ratings.service.spec.ts (2 tests) ❌ Severely lacking
```

**New test files needed:**
- `orgs/orgs.service.spec.ts` ❌ Missing
- `decklists/decklists.service.spec.ts` ❌ Missing
- `standings/standings.service.spec.ts` ❌ Missing
- `notifications/notifications.service.spec.ts` ❌ Missing
- `leaderboard/leaderboard.service.spec.ts` ❌ Missing

**Estimated Effort:** 2-3 weeks
**Files Modified:** ~15 new test files, jest config updates

---

#### 2. Configure Email Service
**Current:** TODO comments in code, no email sending
**Impact:** 🔴 CRITICAL - Password reset and email verification don't work

**Action Items:**
- [ ] Choose email provider (SendGrid recommended for simplicity)
- [ ] Install dependencies: `npm install @sendgrid/mail` or `nodemailer`
- [ ] Create email service module
- [ ] Implement password reset email (apps/backend/src/auth/auth.service.ts:446)
- [ ] Implement email verification (apps/backend/src/auth/auth.service.ts:541)
- [ ] Add email templates (HTML + plain text)
- [ ] Configure environment variables
- [ ] Test email delivery in staging

**SendGrid Setup:**
```bash
npm install @sendgrid/mail --workspace=apps/backend
```

**Environment Variables:**
```env
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@genki-tcg.com"
EMAIL_REPLY_TO="support@genki-tcg.com"
```

**Estimated Effort:** 1 week
**Files Modified:**
- New: `apps/backend/src/email/email.service.ts`
- New: `apps/backend/src/email/email.module.ts`
- New: `apps/backend/src/email/templates/` (directory with templates)
- Modified: `apps/backend/src/auth/auth.service.ts`

---

#### 3. API Documentation (Swagger/OpenAPI)
**Current:** No API documentation
**Impact:** 🟡 HIGH - Developers need to read code to understand API

**Action Items:**
- [ ] Install Swagger dependencies
- [ ] Configure Swagger in main.ts
- [ ] Add decorators to all DTOs (@ApiProperty)
- [ ] Add decorators to all controllers (@ApiTags, @ApiOperation, @ApiResponse)
- [ ] Generate OpenAPI spec
- [ ] Host documentation at `/api/docs`
- [ ] Add authentication to Swagger UI (JWT bearer)

**Installation:**
```bash
npm install @nestjs/swagger --workspace=apps/backend
```

**Configuration in main.ts:**
```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Genki TCG API')
  .setDescription('Tournament and credits management API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Estimated Effort:** 1 week
**Files Modified:** ~50 files (all DTOs and controllers)

---

### 🟡 MEDIUM PRIORITY (Weeks 3-4)

#### 4. Implement Redis Caching
**Current:** Redis installed but not used
**Impact:** 🟡 HIGH - Performance and scalability

**Why Redis:**
- Cache tournament pairings and standings
- Rate limiting storage
- Session management
- Real-time leaderboard updates
- Reduce database load

**Action Items:**
- [ ] Create Redis module and service
- [ ] Implement caching for tournament standings (apps/backend/src/standings/)
- [ ] Implement caching for leaderboards (apps/backend/src/leaderboard/)
- [ ] Cache event details (frequently accessed)
- [ ] Add cache invalidation on data updates
- [ ] Configure Redis connection pooling
- [ ] Add Redis health check to health controller
- [ ] Monitor Redis memory usage

**Installation:**
```bash
npm install @nestjs/cache-manager cache-manager cache-manager-ioredis --workspace=apps/backend
```

**Example Implementation:**
```typescript
// apps/backend/src/redis/redis.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      ttl: 300, // 5 minutes default
    }),
  ],
})
export class RedisModule {}
```

**Cache Strategy:**
```typescript
// Cache standings for 30 seconds
@Cacheable('standings', { ttl: 30 })
async getStandings(eventId: string) { ... }

// Cache leaderboard for 5 minutes
@Cacheable('leaderboard', { ttl: 300 })
async getLeaderboard(orgId: string) { ... }

// Invalidate cache on update
@CacheEvict('standings')
async updateMatch(matchId: string) { ... }
```

**Estimated Effort:** 1 week
**Files Modified:**
- New: `apps/backend/src/redis/redis.module.ts`
- New: `apps/backend/src/redis/redis.service.ts`
- Modified: `apps/backend/src/standings/standings.service.ts`
- Modified: `apps/backend/src/leaderboard/leaderboard.service.ts`
- Modified: `apps/backend/src/health/health.controller.ts`

---

#### 5. Performance Optimization
**Current:** No specific performance issues identified yet
**Impact:** 🟡 MEDIUM - Important for scalability

**Action Items:**

**Database Optimization:**
- [ ] Add database indexes for frequently queried fields
- [ ] Review and optimize N+1 queries (use Prisma's `include` wisely)
- [ ] Add query logging to identify slow queries
- [ ] Consider database connection pooling

**API Optimization:**
- [ ] Add response compression (already in main.ts ✅)
- [ ] Implement pagination for list endpoints
- [ ] Add request/response size limits (already done ✅)
- [ ] Review and optimize large payload endpoints

**Frontend Optimization:**
- [ ] Implement lazy loading for routes
- [ ] Optimize bundle size (admin web at 87.3 kB is good ✅)
- [ ] Add service worker for offline support (mobile)
- [ ] Optimize images (compression, WebP format)

**Estimated Effort:** 1 week
**Files Modified:** Multiple files across services

---

#### 6. Database Backup & Disaster Recovery
**Current:** Railway has automatic backups (verify configuration)
**Impact:** 🔴 CRITICAL - Data loss prevention

**Action Items:**
- [ ] Verify Railway automatic backups are enabled
- [ ] Test database restore process
- [ ] Document backup retention policy (30 days recommended)
- [ ] Set up automated backup notifications
- [ ] Create disaster recovery runbook
- [ ] Test full system recovery (annually)
- [ ] Consider point-in-time recovery (PITR)

**Railway Backup Commands:**
```bash
# Create manual backup
railway backup create --service postgres

# List backups
railway backup list --service postgres

# Restore from backup
railway backup restore <backup-id> --service postgres
```

**Estimated Effort:** 3-4 days (mostly documentation and testing)
**Files Modified:**
- New: `DISASTER_RECOVERY.md`

---

### 🔵 LOW PRIORITY (Weeks 5-6)

#### 7. Advanced Monitoring & Alerting
**Current:** Sentry for errors ✅, basic health checks ✅
**Impact:** 🟡 MEDIUM - Proactive issue detection

**Action Items:**
- [ ] Set up application performance monitoring (APM)
- [ ] Configure Sentry alerts for critical errors
- [ ] Add custom metrics (tournament count, active users, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Create operational dashboard
- [ ] Configure alert thresholds
- [ ] Set up on-call rotation (if team size permits)

**Sentry Configuration:**
```typescript
// apps/backend/src/instrument.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0, // 100% in production (adjust as needed)
  beforeSend(event) {
    // Filter sensitive data
    if (event.request?.headers) {
      delete event.request.headers.authorization;
    }
    return event;
  },
});
```

**Estimated Effort:** 1 week
**Files Modified:** Sentry config, new monitoring service

---

#### 8. Load Testing & Stress Testing
**Current:** No load testing performed
**Impact:** 🟡 MEDIUM - Understand system limits

**Action Items:**
- [ ] Install load testing tool (k6, Artillery, or JMeter)
- [ ] Create load test scenarios
- [ ] Test critical endpoints (tournament pairing, standings)
- [ ] Identify performance bottlenecks
- [ ] Test concurrent user scenarios
- [ ] Document system limits (max tournaments, max players)
- [ ] Create scaling strategy based on results

**k6 Setup:**
```bash
npm install -g k6
```

**Example Load Test:**
```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100, // 100 virtual users
  duration: '5m',
};

export default function () {
  const res = http.get('https://your-api.railway.app/events');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

**Estimated Effort:** 3-4 days
**Files Modified:**
- New: `load-tests/` directory

---

#### 9. Security Audit & Penetration Testing
**Current:** Good security practices ✅, but no formal audit
**Impact:** 🔴 CRITICAL - Before public launch

**Action Items:**
- [ ] Run OWASP ZAP security scan
- [ ] Test for SQL injection (Prisma protects ✅, but verify)
- [ ] Test for XSS vulnerabilities
- [ ] Verify CSRF protection (API is stateless ✅)
- [ ] Test rate limiting effectiveness
- [ ] Review CORS configuration
- [ ] Test authentication bypass attempts
- [ ] Review sensitive data exposure
- [ ] Consider hiring professional penetration tester

**OWASP ZAP:**
```bash
# Install OWASP ZAP
# Run automated scan against staging environment
zap-cli quick-scan https://staging-api.railway.app
```

**Estimated Effort:** 1 week (internal), 2-3 weeks (external audit)
**Files Modified:** Security fixes based on findings

---

#### 10. Mobile App Optimization
**Current:** Expo app functional, no specific issues
**Impact:** 🟡 MEDIUM - User experience

**Action Items:**
- [ ] Implement offline mode with AsyncStorage
- [ ] Add app loading skeleton screens
- [ ] Optimize image loading (lazy loading, caching)
- [ ] Reduce app bundle size
- [ ] Add error boundary components
- [ ] Implement background refresh for standings
- [ ] Add haptic feedback for actions
- [ ] Test on low-end devices
- [ ] Implement analytics (Expo Analytics or Firebase)

**Estimated Effort:** 1-2 weeks
**Files Modified:** Mobile app components

---

## Implementation Timeline

### Week 1-2: Critical Foundations
- ✅ Environment fixes (COMPLETED)
- 🔴 Email service configuration
- 🔴 Start increasing test coverage (unit tests)

### Week 3-4: Documentation & Performance
- 🟡 Complete test coverage to 70%
- 🟡 API documentation (Swagger)
- 🟡 Redis caching implementation

### Week 5-6: Production Hardening
- 🔵 Database backup verification
- 🔵 Performance optimization
- 🔵 Load testing
- 🔵 Security audit

---

## Quick Wins (Can Do This Week)

### 1. Fix Test Database Setup (2 hours)
Make tests work without local database running:

```typescript
// apps/backend/test/setup.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

beforeAll(async () => {
  // Use TEST_DATABASE_URL or in-memory database
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL not set');
  }

  prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await prisma.$connect();

  // Clean database before tests
  await prisma.$executeRawUnsafe('TRUNCATE TABLE ...');
});
```

### 2. Add Missing Test Files (1 day)
Create skeleton test files for modules without tests:

```bash
touch apps/backend/src/orgs/orgs.service.spec.ts
touch apps/backend/src/decklists/decklists.service.spec.ts
touch apps/backend/src/standings/standings.service.spec.ts
touch apps/backend/src/notifications/notifications.service.spec.ts
touch apps/backend/src/leaderboard/leaderboard.service.spec.ts
```

### 3. Configure SendGrid (1 day)
Get email working:

```bash
# Sign up for SendGrid free tier (100 emails/day)
npm install @sendgrid/mail --workspace=apps/backend
```

### 4. Add Swagger Documentation (2 days)
Basic API docs:

```bash
npm install @nestjs/swagger --workspace=apps/backend
# Add to main.ts, decorate a few key endpoints
```

### 5. Enable Redis Caching for Standings (1 day)
Immediate performance boost:

```bash
npm install @nestjs/cache-manager cache-manager-ioredis --workspace=apps/backend
# Cache standings endpoint only
```

---

## Metrics to Track

### Current Baseline
- Test Coverage: 22.79%
- Build Time: Unknown (measure)
- API Response Time: Unknown (measure)
- Error Rate: Unknown (check Sentry)
- Deployment Time: Unknown (measure)

### Production Targets
- Test Coverage: ≥ 70%
- Build Time: < 5 minutes
- API Response Time (p95): < 500ms
- Error Rate: < 0.1%
- Deployment Time: < 3 minutes
- Uptime: ≥ 99.9%

---

## Dependencies & Costs

### Required Services (Current)
- ✅ Railway (PostgreSQL + Backend): ~$5-20/month
- ✅ Vercel (Admin Web): Free tier
- ✅ Expo (Mobile): Free tier
- ✅ Sentry: Free tier (5k events/month)

### Additional Services Needed
- 🔴 SendGrid: Free tier (100 emails/day) or $15/month (40k emails)
- 🟡 Redis: Railway add-on ~$10/month OR use Upstash free tier
- 🔵 Uptime Monitoring: UptimeRobot free tier (50 monitors)
- 🔵 APM (optional): Datadog/New Relic ~$15-100/month

**Total Monthly Cost: $20-50** (with free tiers optimized)

---

## Risk Assessment

### HIGH RISK (Must Address)
- ❌ **No email service** - Password reset doesn't work
- ⚠️ **Low test coverage** - High risk of regressions
- ⚠️ **No API docs** - Developer onboarding friction

### MEDIUM RISK (Address Soon)
- ⚠️ **Redis unused** - Missing performance optimizations
- ⚠️ **No load testing** - Unknown system limits
- ⚠️ **No backup testing** - Unverified disaster recovery

### LOW RISK (Nice to Have)
- ℹ️ **Mobile optimizations** - App works but could be better
- ℹ️ **Advanced monitoring** - Sentry is sufficient for now

---

## Definition of "Production Ready"

### Minimum Viable Production (80%)
- [x] Security: Auth, RBAC, rate limiting ✅
- [x] Deployment: CI/CD pipeline ✅
- [ ] Testing: 70% coverage ❌
- [ ] Email: Password reset works ❌
- [x] Monitoring: Sentry + health checks ✅
- [x] Documentation: README, setup guides ✅
- [ ] API Docs: Swagger/OpenAPI ❌

### Full Production Ready (95%)
All of above PLUS:
- [ ] Redis caching
- [ ] Load testing completed
- [ ] Database backups verified
- [ ] Security audit passed
- [ ] Performance optimized

### Enterprise Ready (100%)
All of above PLUS:
- [ ] 90%+ test coverage
- [ ] External penetration test
- [ ] SLA guarantees
- [ ] 24/7 monitoring
- [ ] Disaster recovery drills

---

## Next Actions (This Week)

1. **Today:**
   - [ ] Sign up for SendGrid free tier
   - [ ] Install email dependencies
   - [ ] Create `apps/backend/src/email/email.service.ts`

2. **Tomorrow:**
   - [ ] Implement password reset email
   - [ ] Implement verification email
   - [ ] Test email delivery

3. **This Week:**
   - [ ] Install Swagger dependencies
   - [ ] Add API documentation to 5 key endpoints
   - [ ] Create 2-3 missing test files

4. **Next Week:**
   - [ ] Continue test coverage to 50%
   - [ ] Set up Redis caching for standings
   - [ ] Configure test database properly

---

## Questions to Answer

Before proceeding, clarify:
1. **Launch timeline:** When do you need to be production-ready?
2. **Budget:** What's the monthly budget for services?
3. **Team size:** How many developers working on this?
4. **Email volume:** How many emails per day expected?
5. **User scale:** Expected concurrent users at launch?

---

**Status: Ready to Implement**
**Priority: Start with Email Service + Test Coverage**
**Estimated to 95% Production Ready: 4-6 weeks**
