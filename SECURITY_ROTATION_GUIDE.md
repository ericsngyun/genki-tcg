# 🔒 Security Credential Rotation Guide

## ⚠️ CRITICAL: Exposed Secrets Detected

The following secrets were previously committed to the repository and **MUST be rotated immediately**:

- JWT Secret
- Refresh Token Secret
- Database credentials
- Discord OAuth credentials

## Immediate Actions Required

### 1. Generate New Secrets

Run these commands to generate secure secrets:

```bash
# Generate JWT Secret
openssl rand -base64 64

# Generate Refresh Token Secret (must be different)
openssl rand -base64 64
```

### 2. Rotate Database Credentials

**Railway Database:**
1. Go to Railway dashboard: https://railway.app
2. Navigate to your project → Database service
3. Click "Settings" → "Danger Zone" → "Reset Database Password"
4. Update `DATABASE_URL` in your Railway environment variables
5. Update local `.env` file with new connection string

### 3. Rotate Discord OAuth Credentials

1. Go to: https://discord.com/developers/applications
2. Select your application
3. Go to "OAuth2" → "General"
4. Click "Reset Secret" to generate new client secret
5. Update `DISCORD_CLIENT_SECRET` in:
   - Railway environment variables
   - Local `.env` file

### 4. Update Environment Variables

**Railway (Production):**
```bash
# Set via Railway CLI or Dashboard
railway variables set JWT_SECRET="<new-jwt-secret>"
railway variables set REFRESH_TOKEN_SECRET="<new-refresh-secret>"
railway variables set DISCORD_CLIENT_SECRET="<new-discord-secret>"
railway variables set DATABASE_URL="<new-database-url>"
```

**Local Development:**
```bash
# Update your local .env file with new values
# Copy from .env.example and fill in new secrets
cp .env.example .env
# Then edit .env with your new secrets
```

### 5. Remove Secrets from Git History

**Option A: Using git-filter-repo (Recommended)**

```bash
# Install git-filter-repo
# macOS: brew install git-filter-repo
# Windows: pip install git-filter-repo

# Backup your repo first
cd ..
cp -r genki-tcg genki-tcg-backup

# Remove .env from history
cd genki-tcg
git filter-repo --path .env --invert-paths

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

**Option B: Using BFG Repo-Cleaner**

```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env file
java -jar bfg.jar --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

### 6. Verify .gitignore

Ensure `.env` is in `.gitignore`:

```bash
# Check if .env is ignored
git check-ignore .env

# Should output: .env
```

### 7. Audit Active Sessions

After rotating secrets, all existing JWT tokens will be invalidated:

1. Users will need to log in again
2. Check for any suspicious login activity
3. Monitor audit logs for unauthorized access attempts

## Configuration Checklist

After rotation, verify:

- [ ] New JWT_SECRET set (64-byte random)
- [ ] New REFRESH_TOKEN_SECRET set (different from JWT_SECRET)
- [ ] New database password set
- [ ] New Discord OAuth secret set
- [ ] Railway environment variables updated
- [ ] Local .env file updated
- [ ] .env removed from git history
- [ ] Git force-push completed
- [ ] All team members notified
- [ ] Active sessions logged out
- [ ] Application redeployed with new secrets

## Security Best Practices Going Forward

### Never Commit:
- `.env` files
- API keys, secrets, tokens
- Database credentials
- Private keys

### Always Use:
- `.env.example` with placeholder values
- Environment variables for secrets
- Separate secrets for dev/staging/production
- Secret rotation every 90 days
- Strong, randomly generated secrets

### Tools to Prevent Leaks:
1. **pre-commit hooks**: Install `git-secrets`
   ```bash
   npm install -g git-secrets
   git secrets --install
   git secrets --register-aws
   ```

2. **GitHub Secret Scanning**: Enabled by default for public repos

3. **Environment Variable Validation**: Add startup checks in `main.ts`

## Emergency Contact

If you believe credentials were accessed by unauthorized parties:

1. Rotate ALL secrets immediately
2. Review audit logs: `apps/backend/prisma/migrations`
3. Check for unauthorized database changes
4. Review user account activity
5. Consider notifying affected users
6. Document the incident

## Next Steps

After completing rotation:

1. Update this document with rotation date
2. Set calendar reminder for next rotation (90 days)
3. Train team on security practices
4. Implement automated secret scanning

---

**Last Rotation Date:** [UPDATE AFTER COMPLETING ROTATION]
**Next Rotation Due:** [90 DAYS FROM ROTATION]
**Responsible Party:** [YOUR NAME/TEAM]
