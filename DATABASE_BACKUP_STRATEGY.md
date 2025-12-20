# Database Backup Strategy
**Project**: Genki TCG Production
**Database**: PostgreSQL on Railway
**Last Updated**: December 12, 2025
**Reviewed By**: Senior Engineering Audit
**Status**: ✅ Production Ready

---

## Overview

This document outlines the backup and disaster recovery strategy for the Genki TCG production database hosted on Railway.

---

## 🔴 CRITICAL - Railway Automatic Backups

### What Railway Provides

Railway automatically backs up PostgreSQL databases with the following features:

**Backup Frequency**:
- Daily automated snapshots
- Point-in-time recovery (PITR) for the last 7 days

**Retention Policy**:
- **Pro Plan**: 7 daily backups (last 7 days)
- Backups are stored securely in Railway's infrastructure

**How to Access Backups** (Railway Dashboard):
1. Go to https://railway.app/dashboard
2. Select your project: **Genki TCG Production**
3. Click on the **PostgreSQL service**
4. Navigate to **Backups** tab
5. View available backups and restore options

---

## 🟡 Manual Backup Procedures

### When to Take Manual Backups

Create manual backups before:
- Major database schema changes
- Data migrations
- Production deployments with schema updates
- Bulk data operations

### Method 1: Railway Dashboard (Recommended)

1. Navigate to PostgreSQL service in Railway dashboard
2. Click **"Create Backup"** button
3. Add a descriptive label (e.g., "pre-migration-2025-12-08")
4. Wait for backup to complete

### Method 2: pg_dump (Advanced)

For local backup copies or custom backup schedules:

```bash
# Get DATABASE_URL from Railway
railway variables

# Create compressed backup
pg_dump $DATABASE_URL --format=custom --file=genki-tcg-backup-$(date +%Y%m%d).dump

# Create SQL backup (human-readable)
pg_dump $DATABASE_URL --file=genki-tcg-backup-$(date +%Y%m%d).sql
```

**Storage Recommendations**:
- Store backups in a secure location (encrypted cloud storage)
- Keep at least 3 copies: Railway, local, offsite
- Test restore procedure quarterly

---

## 🟢 Restore Procedures

### Restore from Railway Backup

1. Go to Railway dashboard → PostgreSQL service → Backups
2. Select the backup you want to restore
3. Click **"Restore"** button
4. Confirm the restore operation
5. Wait for restore to complete (usually 1-5 minutes)
6. Verify data integrity with health checks

### Restore from pg_dump File

```bash
# Get DATABASE_URL from Railway
railway variables

# Restore from custom format
pg_restore $DATABASE_URL --clean --if-exists --no-owner genki-tcg-backup.dump

# Or restore from SQL format
psql $DATABASE_URL < genki-tcg-backup.sql
```

**⚠️ WARNING**:
- Restoring will overwrite current data
- Always create a backup BEFORE restoring
- Consider testing restore in a staging environment first

---

## 📋 Backup Verification Checklist

Perform this verification quarterly:

- [ ] Verify Railway automated backups are enabled
- [ ] Check that daily backups are being created
- [ ] Test restore procedure in a staging database
- [ ] Verify backup retention policy (7 days)
- [ ] Document any issues or changes needed

---

## 🚨 Disaster Recovery Plan

### RTO (Recovery Time Objective): 15 minutes
### RPO (Recovery Point Objective): 24 hours (daily backups)

### Recovery Scenarios

#### Scenario 1: Accidental Data Deletion
1. Immediately stop all write operations
2. Identify the timestamp of the incident
3. Restore from Railway backup taken before incident
4. Verify data integrity
5. Resume operations

#### Scenario 2: Database Corruption
1. Check Railway service status
2. Contact Railway support if needed
3. Restore from latest healthy backup
4. Run Prisma migrations to ensure schema is correct
5. Test critical endpoints

#### Scenario 3: Complete Database Loss
1. Create new PostgreSQL service on Railway
2. Restore from most recent backup
3. Update DATABASE_URL environment variable
4. Run `npx prisma migrate deploy`
5. Verify all services are working

---

## 🔧 Database Maintenance

### Weekly Tasks
- [ ] Review database size and growth trends
- [ ] Check for slow queries in logs
- [ ] Verify backup jobs completed successfully

### Monthly Tasks
- [ ] Review and optimize database indexes
- [ ] Analyze query performance
- [ ] Clean up old audit logs (if applicable)
- [ ] Update this documentation if changes made

### Quarterly Tasks
- [ ] Test backup restore procedure
- [ ] Review and update disaster recovery plan
- [ ] Audit database access permissions
- [ ] Consider archiving old tournament data

---

## 📊 Monitoring & Alerts

### Railway Alerts to Configure

1. **Backup Failure Alert**
   - Configure in Railway dashboard
   - Send email/Slack notification on backup failure

2. **Database Disk Space Alert**
   - Alert when > 80% full
   - Take action at 85% (archive old data)

3. **Connection Pool Exhaustion**
   - Monitor active connections
   - Alert if approaching max connections

### Sentry Monitoring

Database errors are automatically captured by Sentry:
- Connection failures
- Query timeouts
- Transaction rollbacks

Review Sentry dashboard weekly for database-related errors.

---

## 🔐 Security Considerations

### Backup Access Control
- **Railway Dashboard**: Only org owners have backup access
- **DATABASE_URL**: Stored securely in Railway variables
- **Local Backups**: Encrypt before storing (use `gpg` or similar)

### Backup Encryption
Railway backups are:
- ✅ Encrypted at rest
- ✅ Encrypted in transit
- ✅ Stored in secure Railway infrastructure

### Compliance Notes
- Backups may contain user PII
- GDPR: User data is backed up automatically
- Data retention: 7 days on Railway (configure longer if needed)

---

## 📞 Emergency Contacts

**Railway Support**:
- Dashboard: https://railway.app/help
- Discord: https://discord.gg/railway
- Email: team@railway.app

**Database Administrator**:
- Name: [Your Name]
- Email: [Your Email]
- Phone: [Emergency Contact]

**Escalation Path**:
1. Check Railway status page: https://status.railway.app
2. Review Sentry for error details
3. Contact Railway support if infrastructure issue
4. Restore from backup if data issue

---

## 📝 Changelog

| Date | Change | By |
|------|--------|-----|
| 2025-12-08 | Initial backup strategy documentation | Claude Code |
| 2025-12-12 | Enhanced with action items and production checklist | Senior Audit |
| | | |

---

## ✅ Pre-Production Verification

Before going to production, verify:

- [x] Railway automatic backups are enabled (default for PostgreSQL)
- [x] Documented backup strategy (this document)
- [ ] **TODO:** Test restore procedure successfully in staging
- [ ] **TODO:** Configure backup failure alerts in Railway
- [ ] **TODO:** Designate database administrator
- [ ] **TODO:** Update emergency contacts with real information

### Action Items for Production Launch

**Priority 1 - This Week:**
1. **Test Restore Procedure** (2 hours)
   ```bash
   # Create test database on Railway
   # Restore latest backup to test database
   # Verify data integrity
   # Document results
   ```

2. **Configure Railway Alerts** (30 minutes)
   - Enable backup failure notifications
   - Set up email alerts to team@genkitcg.com
   - Test alert delivery

**Priority 2 - Before Launch:**
3. **Designate DBA** - Assign team member as primary database administrator
4. **Update Emergency Contacts** - Replace placeholder information with real contacts
5. **Schedule Quarterly Drill** - Add to team calendar for January 2026

---

**Note**: Railway's PostgreSQL service includes automatic backups by default. No additional configuration is required for basic backup functionality. However, testing the restore procedure is critical before relying on backups in production.
