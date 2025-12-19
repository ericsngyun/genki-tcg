# Genki TCG Website - Deployment Guide

This guide covers deploying the Genki TCG website to Vercel with a custom domain.

## Prerequisites

- GitHub repository with the website code
- Custom domain (genkitcg.app) purchased and ready
- Vercel account (free tier works)

## Deployment Architecture

```
genkitcg.app          → Main website (Next.js static export)
admin.genkitcg.app    → Admin portal (separate Vercel project)
api.genkitcg.app      → Backend API (Railway, configured separately)
```

## Step 1: Initial Vercel Setup

### 1.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 1.2 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the `genki-tcg` repository

### 1.3 Configure Project

**Framework Preset:** Next.js

**Root Directory:** `apps/website`

**Build Command:** `npm run build`

**Output Directory:** `out`

**Install Command:** `npm install`

**Environment Variables:** None required for static site

## Step 2: Domain Configuration

### 2.1 Add Domain to Vercel

1. In your Vercel project, go to **Settings** → **Domains**
2. Add domain: `genkitcg.app`
3. Add domain: `www.genkitcg.app` (will redirect to main domain)

### 2.2 Configure DNS Records

Add these DNS records at your domain registrar:

#### For genkitcg.app (root domain):

| Type | Name | Value                | TTL  |
|------|------|----------------------|------|
| A    | @    | 76.76.21.21         | Auto |
| AAAA | @    | 2606:4700:4700::1111| Auto |

**OR** use CNAME (if supported):

| Type  | Name | Value              | TTL  |
|-------|------|--------------------|------|
| CNAME | @    | cname.vercel-dns.com | Auto |

#### For www subdomain:

| Type  | Name | Value              | TTL  |
|-------|------|--------------------|------|
| CNAME | www  | cname.vercel-dns.com | Auto |

### 2.3 Verify Domain

1. Wait 5-10 minutes for DNS propagation
2. Vercel will automatically verify and issue SSL certificate
3. Your site will be live at https://genkitcg.app

## Step 3: Admin Portal Subdomain

### 3.1 Deploy Admin Portal

1. Create a new Vercel project for the admin portal
2. Select root directory: `apps/admin-web`
3. Use the same build settings as the main website

### 3.2 Configure admin.genkitcg.app

1. In the admin portal Vercel project, go to **Settings** → **Domains**
2. Add domain: `admin.genkitcg.app`

### 3.3 Add DNS Record

| Type  | Name  | Value              | TTL  |
|-------|-------|--------------------|------|
| CNAME | admin | cname.vercel-dns.com | Auto |

## Step 4: Continuous Deployment

### 4.1 Automatic Deployments

Vercel automatically deploys:
- **Production:** Any push to `main` branch → https://genkitcg.app
- **Preview:** Any push to other branches → unique preview URL

### 4.2 Manual Deployment

Using Vercel CLI:

```bash
cd apps/website
vercel --prod
```

### 4.3 Deployment Settings

Configure in Vercel project settings:

- **Production Branch:** `main`
- **Ignored Build Step:** Leave empty (build on all commits)
- **Auto-assign Custom Domains:** Enabled

## Step 5: Post-Deployment Tasks

### 5.1 Update Mobile App URLs

Once the website is deployed, update these files:

**apps/mobile/app/settings.tsx:**

```typescript
// Replace Alert calls with actual URLs
{
  title: 'Privacy Policy',
  href: 'https://genkitcg.app/privacy',
},
{
  title: 'Terms of Service',
  href: 'https://genkitcg.app/terms',
}
```

**apps/mobile/app.json:**

```json
{
  "expo": {
    "extra": {
      "privacyPolicyUrl": "https://genkitcg.app/privacy",
      "termsOfServiceUrl": "https://genkitcg.app/terms",
      "supportUrl": "https://genkitcg.app/support"
    }
  }
}
```

### 5.2 Update EAS Build

After updating URLs, rebuild the mobile app:

```bash
cd apps/mobile
eas build --platform ios --profile production
```

### 5.3 App Store Submission

Add these URLs to your App Store Connect submission:
- **Privacy Policy:** https://genkitcg.app/privacy
- **Terms of Service:** https://genkitcg.app/terms
- **Support URL:** https://genkitcg.app/support

## Step 6: Testing

### 6.1 Test Checklist

- [ ] Homepage loads at https://genkitcg.app
- [ ] All navigation links work
- [ ] Privacy policy page displays correctly
- [ ] Terms of service page displays correctly
- [ ] Support page loads with FAQs
- [ ] Download page shows app store badges
- [ ] Mobile responsive design works
- [ ] SSL certificate is active (https://)
- [ ] www redirects to root domain

### 6.2 Performance Testing

Run these tests:
- **Lighthouse:** https://pagespeed.web.dev/
- **GTmetrix:** https://gtmetrix.com/

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

## Step 7: Monitoring

### 7.1 Vercel Analytics

Enable in Vercel dashboard:
1. Go to **Analytics** tab
2. Enable Web Analytics
3. View real-time visitor data

### 7.2 Uptime Monitoring

Free options:
- **UptimeRobot:** https://uptimerobot.com/
- **Better Uptime:** https://betteruptime.com/

Set up alerts for:
- Website downtime
- SSL certificate expiration
- Slow response times

## Troubleshooting

### DNS Not Propagating

```bash
# Check DNS propagation
nslookup genkitcg.app

# Or use online tool
# https://www.whatsmydns.net/
```

Wait 24-48 hours for full global propagation.

### Build Failures

Check Vercel build logs:
1. Go to **Deployments** tab
2. Click on failed deployment
3. View build logs for errors

Common issues:
- Missing dependencies: Run `npm install` locally
- TypeScript errors: Run `npm run build` locally to debug
- Environment variables: Ensure all required vars are set in Vercel

### SSL Certificate Issues

If SSL doesn't activate:
1. Remove and re-add domain in Vercel
2. Check DNS records are correct
3. Wait 10-15 minutes and try again

### 404 Errors

If pages show 404:
1. Check `next.config.mjs` has `output: 'export'`
2. Verify `vercel.json` rewrites are configured
3. Redeploy the project

## Costs

| Service | Plan | Cost |
|---------|------|------|
| Domain (genkitcg.app) | Annual | ~$12/year |
| Vercel (Main site) | Hobby | Free |
| Vercel (Admin portal) | Hobby | Free |
| SSL Certificate | Auto | Free |

**Total:** ~$12/year

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Custom Domain Setup](https://vercel.com/docs/concepts/projects/domains)

## Support

For deployment issues:
- **Vercel Support:** https://vercel.com/support
- **Next.js Discord:** https://discord.gg/nextjs
- **Project Email:** support@genkitcg.app
