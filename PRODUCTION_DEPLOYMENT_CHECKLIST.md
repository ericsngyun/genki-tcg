# =€ Production Deployment Checklist

**Project:** Genki TCG
**Last Updated:** December 12, 2025
**Version:** 1.0

---

## =Ë PRE-DEPLOYMENT CHECKLIST

Complete ALL items before deploying to production. Each section must be signed off by the responsible team member.

---

## 1.  CODE QUALITY & TESTING

### Test Coverage
- [ ] **Unit test coverage e 70%**
  - Current coverage: ____%
  - Run: `npm run test:cov`
  - Location: `apps/backend/coverage/`

- [ ] **All tests passing (0 failures)**
  - Run: `npm run test`
  - Backend tests: ___/___passing
  - Frontend tests: ___/___  passing

- [ ] **E2E tests passing**
  - Critical user flows tested
  - Tournament lifecycle tested
  - Payment flow tested

### Code Quality
- [ ] **No critical security vulnerabilities**
  - Run: `npm audit --production`
  - Critical: 0, High: 0

- [ ] **TypeScript compiles without errors**
  - Run: `npm run build`
  - No compilation errors

- [ ] **Linting passes**
  - Run: `npm run lint`
  - No linting errors

- [ ] **Code reviewed and approved**
  - PR approved by: ___________
  - Security review completed: Yes/No

**Sign-off:** ___________ (Tech Lead) Date: _____

---

## 2. = SECURITY

### Authentication & Authorization
- [ ] **JWT secrets are cryptographically strong**
  - Generated with: `openssl rand -base64 64`
  - Not placeholder values
  - Different for JWT_SECRET and REFRESH_TOKEN_SECRET

- [ ] **Discord OAuth configured correctly**
  - Client ID and Secret set
  - Callback URLs include production domains
  - Tested login flow

- [ ] **Rate limiting enabled**
  - Global: 100 req/min
  - Auth endpoints: 10 req/min
  - Configured in `apps/backend/src/app.module.ts`

### Data Protection
- [ ] **Database backups configured**
  - Railway automatic backups enabled
  - Backup schedule: Daily at 2 AM UTC
  - Retention: 7 days minimum
  - Restore procedure tested: Yes/No

- [ ] **HTTPS enforced**
  - Railway provides HTTPS by default
  - No HTTP-only endpoints

- [ ] **CORS configured for production**
  - CORS_ORIGINS includes only production URLs
  - No wildcards (e.g., `*`) in production

- [ ] **Secrets management**
  - All secrets in Railway environment variables
  - No secrets in code or version control
  - `.env` files in `.gitignore`

### Compliance
- [ ] **Privacy policy published**
  - URL: ___________
  - Accessible from app

- [ ] **Terms of service published**
  - URL: ___________
  - Accessible from app

**Sign-off:** ___________ (Security Lead) Date: _____

---

## 3. =Ä DATABASE

### Schema & Migrations
- [ ] **All migrations applied**
  - Run: `npx prisma migrate deploy`
  - Migration status: ___/___  applied

- [ ] **Database indexes optimized**
  - Slow query analysis completed
  - Indexes added where needed

- [ ] **Seed data loaded (if needed)**
  - Default organization created
  - Initial data populated

### Backup & Recovery
- [ ] **Backup strategy documented**
  - See: `DATABASE_BACKUP_STRATEGY.md`
  - Team trained on restore procedure

- [ ] **Pre-deployment backup created**
  - Backup timestamp: ___________
  - Backup verified: Yes/No

**Sign-off:** ___________ (DBA) Date: _____

---

## 4. < INFRASTRUCTURE

### Railway Configuration
- [ ] **Production environment variables set**
  - All required env vars configured
  - Use checklist from: `apps/backend/.env.local.example`
  - Validation passes on startup

- [ ] **Resources allocated appropriately**
  - Database: Sufficient storage and connections
  - API: Adequate CPU/memory
  - Redis: Configured and connected

- [ ] **Health checks configured**
  - Endpoint: `GET /health`
  - Health check interval: 30s
  - Startup period: 60s

### Domain & SSL
- [ ] **Custom domain configured (if applicable)**
  - Domain: ___________
  - DNS records set
  - SSL certificate issued

- [ ] **CDN configured (if applicable)**
  - Static assets served via CDN
  - Cache headers set correctly

**Sign-off:** ___________ (DevOps) Date: _____

---

## 5. =Ê MONITORING & OBSERVABILITY

### Error Tracking
- [ ] **Sentry configured**
  - SENTRY_DSN set
  - SENTRY_ORG and SENTRY_PROJECT set
  - Test error sent and received
  - Alerts configured

### Logging
- [ ] **Structured logging enabled**
  - Production log level: `error`, `warn`, `log`
  - Logs accessible via Railway dashboard

### Performance Monitoring
- [ ] **Database query monitoring**
  - Slow query log enabled
  - Alert threshold set

- [ ] **API response time monitoring**
  - Baseline metrics captured
  - Alert threshold set

**Sign-off:** ___________ (SRE/DevOps) Date: _____

---

## 6. =¦ CI/CD PIPELINE

### GitHub Actions
- [ ] **CI/CD workflow passing**
  - Run on: `main` branch
  - Workflow file: `.github/workflows/ci.yml`
  - Test, build, deploy stages all passing

- [ ] **Automated deployments configured**
  - Staging: `develop` branch ’ Staging environment
  - Production: `main` branch ’ Production environment

- [ ] **Deploy keys and secrets configured**
  - Railway API token set in GitHub Secrets
  - All required secrets configured

**Sign-off:** ___________ (DevOps) Date: _____

---

## 7. =ñ MOBILE APP

### App Configuration
- [ ] **API endpoints point to production**
  - EXPO_PUBLIC_API_URL set correctly
  - No localhost URLs

- [ ] **Push notifications configured**
  - Expo push token configured
  - Test notification sent and received

### App Store Readiness (if launching)
- [ ] **App Store builds created**
  - iOS build via EAS
  - Android build via EAS

- [ ] **App Store metadata complete**
  - Screenshots uploaded
  - Descriptions written
  - Privacy policy linked

**Sign-off:** ___________ (Mobile Lead) Date: _____

---

## 8. < ADMIN WEB

### Configuration
- [ ] **API endpoint configured**
  - NEXT_PUBLIC_API_URL points to production
  - No localhost URLs

- [ ] **Build optimized**
  - Run: `npm run build`
  - No build warnings or errors
  - Bundle size acceptable

- [ ] **Deployment configured**
  - Hosting platform: ___________
  - Deploy successful
  - URL: ___________

**Sign-off:** ___________ (Frontend Lead) Date: _____

---

## 9. =Ö DOCUMENTATION

### User Documentation
- [ ] **User guides available**
  - For players
  - For tournament organizers

### Technical Documentation
- [ ] **API documentation available**
  - Swagger/OpenAPI (future)
  - Endpoint list documented

- [ ] **Deployment documentation updated**
  - This checklist
  - Runbooks for common operations
  - Incident response procedures

### Operational Runbooks
- [ ] **Backup & restore procedure**
  - Documented in `DATABASE_BACKUP_STRATEGY.md`
  - Team trained

- [ ] **Rollback procedure**
  - See section below
  - Team trained

**Sign-off:** ___________ (Tech Writer/Lead) Date: _____

---

## 10. >ê PRE-LAUNCH TESTING

### Smoke Tests
- [ ] **Authentication works**
  - Discord OAuth login successful
  - JWT tokens issued correctly
  - Logout works

- [ ] **Core features functional**
  - Tournament creation
  - Player registration
  - Swiss pairing generation
  - Match result reporting
  - Standings calculation

- [ ] **Real-time features work**
  - WebSocket connections established
  - Live updates received
  - No connection drops

### Load Testing
- [ ] **API performance acceptable**
  - Response time < 200ms for 95th percentile
  - Can handle expected concurrent users
  - Database connections adequate

### Cross-platform Testing
- [ ] **Mobile app tested on real devices**
  - iOS tested
  - Android tested
  - No critical bugs

- [ ] **Admin web tested on browsers**
  - Chrome
  - Firefox
  - Safari

**Sign-off:** ___________ (QA Lead) Date: _____

---

## 11. =¨ INCIDENT RESPONSE

### Preparation
- [ ] **On-call rotation scheduled**
  - Primary: ___________
  - Secondary: ___________
  - Escalation path defined

- [ ] **Emergency contacts documented**
  - Team contact list updated
  - Railway support contact available
  - Vendor contacts available

- [ ] **Rollback procedure tested**
  - See section below
  - Team familiar with process

**Sign-off:** ___________ (Team Lead) Date: _____

---

## 12. <¯ LAUNCH PLAN

### Launch Timing
- [ ] **Launch date/time selected**
  - Date: ___________
  - Time: ___________  (timezone: ___)
  - During business hours: Yes/No
  - Team available for support

### Communication Plan
- [ ] **Users notified of launch**
  - Announcement prepared
  - Channels: ___________

- [ ] **Team briefed**
  - All team members aware of launch
  - Roles and responsibilities clear

### Monitoring During Launch
- [ ] **War room scheduled**
  - Location: ___________  (physical/virtual)
  - Duration: First 2-4 hours after launch

- [ ] **Monitoring dashboards ready**
  - Railway dashboard
  - Sentry dashboard
  - Error log streaming

**Sign-off:** ___________ (Project Manager) Date: _____

---

## = DEPLOYMENT PROCEDURE

### Step-by-Step Deployment

#### 1. Pre-Deployment (T-24 hours)
```bash
# Create pre-deployment backup
# Via Railway dashboard: Postgres ’ Backups ’ Create Backup
# Label: "pre-production-launch-2025-12-XX"

# Verify all environment variables
railway variables

# Run final test suite
npm run test
npm run test:e2e

# Tag release
git tag -a v1.0.0 -m "Production launch v1.0.0"
git push origin v1.0.0
```

#### 2. Deployment (T-0)
```bash
# Merge to main branch (triggers auto-deployment via GitHub Actions)
git checkout main
git merge --no-ff develop
git push origin main

# Monitor deployment
# Watch GitHub Actions: https://github.com/[your-repo]/actions
# Watch Railway deployment: https://railway.app/dashboard

# Wait for deployment to complete (~5-10 minutes)
```

#### 3. Post-Deployment Verification (T+10 min)
```bash
# Verify health check
curl https://your-api.railway.app/health

# Expected response: {"status":"ok","database":"connected"}

# Test authentication
# Login via Discord OAuth on admin web and mobile

# Test critical endpoints
curl https://your-api.railway.app/api/events

# Check error logs
# Railway dashboard ’ Logs
# Sentry dashboard
```

#### 4. Monitoring Period (T+2 hours)
- [ ] Monitor error rates in Sentry
- [ ] Watch Railway logs for errors
- [ ] Check database connections and performance
- [ ] Monitor user activity and feedback
- [ ] Be ready to rollback if critical issues found

**Deployment Lead:** ___________ Date/Time: _____

---

## î ROLLBACK PROCEDURE

**When to Rollback:**
- Critical bugs affecting core functionality
- Security vulnerabilities discovered
- Database corruption
- Service degradation > 50% of users

### Rollback Steps

#### Option A: Quick Rollback (Recommended)
```bash
# 1. Revert to previous Railway deployment
# Via Railway dashboard:
# - Go to Deployments tab
# - Find previous successful deployment
# - Click "Redeploy"
# - Wait for redeployment (~5 min)

# 2. Verify rollback successful
curl https://your-api.railway.app/health

# 3. Notify team and users
```

#### Option B: Git Rollback
```bash
# 1. Revert the merge commit
git revert -m 1 HEAD
git push origin main

# 2. Trigger new deployment (auto via GitHub Actions)

# 3. Monitor deployment

# 4. Verify rollback successful
```

#### Database Rollback (if schema changed)
```bash
# If database migrations were applied and need to be reverted:

# 1. Restore database from pre-deployment backup
# Via Railway dashboard: Postgres ’ Backups ’ Select backup ’ Restore

# 2. Verify data integrity
# Connect to database and run verification queries

# 3. Restart application
```

**Rollback Lead:** ___________ Date/Time: _____

---

## =Ê POST-LAUNCH MONITORING

### First 24 Hours
- [ ] Monitor error rates every hour
- [ ] Check user feedback and support tickets
- [ ] Review performance metrics
- [ ] Verify backups running successfully
- [ ] Document any issues encountered

### First Week
- [ ] Daily error rate review
- [ ] Performance baseline established
- [ ] User adoption metrics reviewed
- [ ] Any hot fixes deployed

### First Month
- [ ] Weekly performance review
- [ ] User feedback incorporated
- [ ] Documentation updated
- [ ] Retrospective conducted

**Monitoring Lead:** ___________

---

##  FINAL SIGN-OFF

All sections above must be completed and signed off before proceeding to production deployment.

### Executive Approval

- [ ] **Product Owner Approval**
  - Name: ___________
  - Signature: ___________
  - Date: ___________

- [ ] **Technical Lead Approval**
  - Name: ___________
  - Signature: ___________
  - Date: ___________

- [ ] **Security Approval**
  - Name: ___________
  - Signature: ___________
  - Date: ___________

### Deployment Authorization

**I authorize the deployment of Genki TCG to production.**

- **Name:** ___________
- **Role:** ___________
- **Signature:** ___________
- **Date/Time:** ___________

---

## =Þ EMERGENCY CONTACTS

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **Tech Lead** | ___________ | ___________ | 24/7 |
| **DevOps Lead** | ___________ | ___________ | 24/7 |
| **DBA** | ___________ | ___________ | Business hours |
| **Product Owner** | ___________ | ___________ | Business hours |
| **Railway Support** | Railway Team | https://railway.app/help | 24/7 |

---

## =Ú REFERENCES

- Environment Variables: `apps/backend/.env.local.example`
- Backup Strategy: `DATABASE_BACKUP_STRATEGY.md`
- Production Audit: `PRODUCTION_READINESS_AUDIT.md`
- GitHub Actions: `.github/workflows/ci.yml`
- Railway Dashboard: https://railway.app/dashboard

---

**Last Review:** December 12, 2025
**Next Review:** Before every production deployment
**Document Owner:** DevOps Team

---

## =Ý DEPLOYMENT LOG

Use this table to track all production deployments:

| Date | Version | Deployed By | Deployment Time | Rollback | Notes |
|------|---------|-------------|-----------------|----------|-------|
| | | | | | |
| | | | | | |
| | | | | | |

---

**<‰ Good luck with your deployment!**

Remember: It's better to delay a launch than to launch with known critical issues.
