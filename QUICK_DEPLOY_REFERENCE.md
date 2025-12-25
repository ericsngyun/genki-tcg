# Quick Deploy Reference Card

> **Print this or keep it open** - Your cheat sheet for all deployments

---

## 🚀 Mobile App

### OTA Update (2-5 min)
```bash
cd apps/mobile
npx eas-cli update --branch production --message "Bug fix"
```
**Use for:** Bug fixes, UI tweaks, new features (JS only)

### Full Build (1-7 days)
```bash
# 1. Update version in app.json: 1.0.0 → 1.1.0
# 2. Build and submit:
cd apps/mobile
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```
**Use for:** Native changes, new permissions, SDK upgrades

---

## ⚙️ Backend

### Deploy (5-10 min)
```bash
cd apps/backend
git add .
git commit -m "feat: description"
git push origin main
# Railway auto-deploys
```

### Verify
```bash
curl https://api.genkitcg.app/health
```

---

## 💻 Admin Web

### Deploy (2-5 min)
```bash
cd apps/admin-web
git add .
git commit -m "feat: description"
git push origin main
# Vercel auto-deploys
```

### Verify
Open: https://admin.genkitcg.app

---

## 🔄 Rollback

### Mobile OTA
```bash
npx eas-cli update:list --branch production
npx eas-cli update:republish --update-id <previous-id>
```

### Backend
Railway Dashboard → Deployments → Redeploy previous

### Admin Web
Vercel Dashboard → Deployments → Promote to Production

---

## 📋 Pre-Deploy Checklist

- [ ] Tests pass
- [ ] Tested locally
- [ ] No console errors
- [ ] Version incremented (if needed)
- [ ] Breaking changes documented

---

## 🆘 Emergency Hotfix

```bash
# Mobile (JS bug)
npx eas-cli update --branch production --message "HOTFIX: critical bug"

# Backend
git commit -m "hotfix: critical bug" && git push

# Admin
git commit -m "hotfix: critical bug" && git push
```

---

## 📞 Important Links

- **Railway:** https://railway.app/dashboard
- **Vercel:** https://vercel.com/dashboard
- **Expo:** https://expo.dev
- **App Store:** https://appstoreconnect.apple.com
- **Full Playbook:** `/DEPLOYMENT_PLAYBOOK.md`
