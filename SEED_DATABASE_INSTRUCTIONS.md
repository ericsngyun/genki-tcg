# Database Seeding Instructions

## Quick Method (Recommended)

### Option 1: Using Railway Dashboard

1. Open Railway Dashboard: https://railway.app/
2. Go to your project
3. Click on the "backend" service
4. Click on "Shell" tab
5. Run this command:
   ```bash
   npm run db:seed --workspace=apps/backend
   ```

### Option 2: Using Railway CLI

```bash
# From the monorepo root (genki-tcg/)
cd apps/backend
railway run npm run db:seed
```

### Option 3: Using the Custom Script

```bash
# From monorepo root
node scripts/seed-railway.js
```

**Note:** You'll need to set the DATABASE_URL environment variable. Get it from Railway dashboard → backend service → Variables → DATABASE_URL

## What Gets Created

After seeding successfully, you'll have:

✅ **Organization:** Genki TCG
- Invite Code: `GENKI`

✅ **Admin Accounts:**
- Owner: `owner@genki-tcg.com` / `password123`
- Staff: `staff@genki-tcg.com` / `password123`

✅ **Test Players:** `player1@test.com` through `player10@test.com`
- Password: `password123`
- Each has 100 initial credits

✅ **Sample Event:** Friday Night OPTCG tournament

## Verify Seeding Worked

Test the login:

```bash
curl -X POST https://genki-tcg-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@genki-tcg.com","password":"password123"}'
```

If successful, you'll get back an `access_token`.

## Next Steps After Seeding

1. Start admin web: `npm run dev:admin`
2. Login with: `owner@genki-tcg.com` / `password123`
3. Test credit management features
4. Create your own admin account
5. Change default passwords

---

**Please seed the database using one of the methods above, then we can continue with testing and enhancements!**
