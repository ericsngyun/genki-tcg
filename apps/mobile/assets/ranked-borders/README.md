# Ranked Border Assets Guide

This directory contains PNG border overlays for each player tier.

## 📁 Directory Structure

```
ranked-borders/
├── README.md (this file)
├── sprout.png
├── bronze.png
├── silver.png
├── gold.png
├── platinum.png
├── diamond.png
├── genki.png
└── unranked.png
```

## 🎨 Image Specifications

### **Format:** PNG with transparency

### **Size:** 512x512px (recommended)
- The system will automatically scale to any size
- Higher resolution = better quality at large sizes
- 512x512px is a good balance between quality and file size

### **Transparency:** Required
- **Center:** Must be fully transparent (alpha = 0) for the avatar
- **Border:** Your decorative border with any alpha values
- The avatar will show through the transparent center

### **Design Guidelines:**

1. **Circular Design:**
   - Border should be designed for a circular avatar
   - Avatar will be positioned in the center

2. **Safe Zone:**
   - Keep decorative elements outside the center 60% of the image
   - Center 60% should be transparent (avatar space)
   - Outer 40% is your border area

3. **Visual Example:**
   ```
   ┌─────────────────────┐
   │  🎨 Border Area    │
   │   ┌───────────┐     │
   │   │           │     │ ← Transparent center
   │   │  Avatar   │     │   (60% of size)
   │   │   Area    │     │
   │   └───────────┘     │
   │  🎨 Border Area    │
   └─────────────────────┘
   ```

## 📏 Avatar Sizing Logic

The component uses this sizing:
- **Border Image:** 100% of the requested size
- **Avatar:** 60% of the border size (positioned in center)

Example: If `size={100}`:
- Border PNG displays at 100x100px
- Avatar displays at 60x60px in the center (matching the 60% transparent area)

This ensures the avatar fits perfectly within the transparent center circle.

## 🎯 Naming Convention

**IMPORTANT:** File names must match tier names exactly (lowercase):

| Tier | File Name | Rating Range |
|------|-----------|--------------|
| SPROUT | `sprout.png` | < 1300 |
| BRONZE | `bronze.png` | 1300-1449 |
| SILVER | `silver.png` | 1450-1599 |
| GOLD | `gold.png` | 1600-1749 |
| PLATINUM | `platinum.png` | 1750-1899 |
| DIAMOND | `diamond.png` | 1900-2099 |
| GENKI | `genki.png` | 2100+ |
| UNRANKED | `unranked.png` | No rating |

## 🔧 How to Add/Update Borders

### Step 1: Create Your PNG
- Size: 512x512px
- Format: PNG with transparency
- Center 60% transparent for avatar
- Outer 40% your decorative border

### Step 2: Name It Correctly
- Use lowercase tier name
- Example: `diamond.png`, `gold.png`

### Step 3: Drop It In
```bash
# Simply replace the file:
cp your-new-diamond-border.png apps/mobile/assets/ranked-borders/diamond.png
```

### Step 4: Restart Expo
```bash
# Clear cache and restart
cd apps/mobile
npx expo start --clear
```

That's it! The border will automatically be used.

## 🎨 Design Tips

### Color Schemes (Reference Current Tiers):

**SPROUT** (Green - New Player)
- Primary: #4CAF50
- Accent: #81C784
- Theme: Growth, fresh start

**BRONZE** (Brown/Orange)
- Primary: #CD7F32
- Accent: #DEB887
- Theme: Solid foundation

**SILVER** (Silver/Gray)
- Primary: #C0C0C0
- Accent: #E8E8E8
- Theme: Shining progress

**GOLD** (Gold/Yellow)
- Primary: #FFD700
- Accent: #FFF8DC
- Theme: Excellence, achievement

**PLATINUM** (Cyan/Blue)
- Primary: #00E5FF
- Accent: #E0F7FA
- Theme: Advanced mastery

**DIAMOND** (Deep Blue)
- Primary: #2979FF
- Accent: #B3E5FC
- Theme: Elite skill

**GENKI** (Red/Orange - Top Tier)
- Primary: #FF3D00
- Accent: #FF9E80
- Theme: Ultimate achievement

**UNRANKED** (Gray)
- Primary: #546E7A
- Accent: #78909C
- Theme: Neutral, starting out

## 🖼️ Example Photoshop/Figma Setup

### Layer Structure:
```
Layers:
├── Border Decorations (visible)
├── Glow Effects (visible)
├── Transparent Center (delete or mask)
└── Background (delete before export)
```

### Export Settings:
- Format: PNG-24
- Transparency: Yes
- Size: 512x512px
- Compression: Medium (balanced quality/size)

## 📦 Fallback Behavior

If a border image is missing:
- Component falls back to programmatic SVG border
- App won't crash
- Console warning: `"Border image not found for tier: X"`

## 🔍 Testing Your Borders

After adding a new border:

1. **Visual Check:**
   - Open the app
   - Navigate to Profile screen
   - Avatar should have your new border

2. **Size Test:**
   - Borders should look good at different sizes
   - Check leaderboard (small) and profile (large)

3. **Quality Check:**
   - Borders should be crisp, not pixelated
   - Transparency should be clean

## 🚀 Performance Notes

- PNGs are loaded once and cached by React Native
- Recommended file size: < 100KB per border
- Use PNG compression tools if needed (e.g., TinyPNG)
- 8 borders × ~50KB = ~400KB total (acceptable)

## 📝 Quick Reference

**To add a new tier in the future:**

1. Add tier to `PlayerTier` type in `RankedAvatar.tsx`
2. Add tier to `mapRatingToTier()` function
3. Add border PNG to this directory
4. Update `TIER_COLORS` if needed for fallback

---

**Need help?** See `apps/mobile/components/RankedAvatar.tsx` for implementation details.
