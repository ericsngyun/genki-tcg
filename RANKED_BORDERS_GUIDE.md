# Ranked Avatar Border System - Complete Guide

## 🎨 Overview

The ranked avatar border system allows you to add custom PNG border overlays for each player tier. Simply drop PNG files into a folder and they'll automatically wrap around player avatars.

---

## 📁 Quick Start

### **Step 1: Prepare Your Border Images**

Create 8 PNG files (one for each tier) with these specifications:

**Image Specs:**
- **Format:** PNG with transparency
- **Size:** 512x512px (recommended)
- **Design:** Circular border with transparent center
- **Center Area:** 60% transparent (for avatar)
- **Border Area:** 40% outer ring (your decorative border)

**Visual Template:**
```
┌─────────────────────────────────────┐
│                                     │
│    🎨 Your Decorative Border       │
│         (Outer 40%)                │
│                                     │
│        ┌─────────────┐              │
│        │             │              │
│        │  TRANSPARENT│  ← Avatar shows here
│        │   (60%)     │              │
│        │             │              │
│        └─────────────┘              │
│                                     │
│    🎨 Your Decorative Border       │
│                                     │
└─────────────────────────────────────┘
```

### **Step 2: Name Your Files**

Use these EXACT names (lowercase):

| Tier | File Name | Player Rating |
|------|-----------|---------------|
| Sprout | `sprout.png` | < 1300 (Beginner) |
| Bronze | `bronze.png` | 1300-1449 |
| Silver | `silver.png` | 1450-1599 |
| Gold | `gold.png` | 1600-1749 |
| Platinum | `platinum.png` | 1750-1899 |
| Diamond | `diamond.png` | 1900-2099 |
| Genki | `genki.png` | 2100+ (Top Tier) |
| Unranked | `unranked.png` | No rating yet |

### **Step 3: Add to Project**

```bash
# Copy your PNG files to this directory:
apps/mobile/assets/ranked-borders/

# Example:
cp your-borders/diamond.png apps/mobile/assets/ranked-borders/diamond.png
cp your-borders/gold.png apps/mobile/assets/ranked-borders/gold.png
# ... repeat for all 8 tiers
```

### **Step 4: Update the Component**

Edit `apps/mobile/components/RankedAvatar.tsx` and replace the entire file with `RankedAvatarWithImages.tsx`:

```bash
# Backup current version
cp apps/mobile/components/RankedAvatar.tsx apps/mobile/components/RankedAvatar.tsx.backup

# Replace with image-based version
cp apps/mobile/components/RankedAvatarWithImages.tsx apps/mobile/components/RankedAvatar.tsx
```

### **Step 5: Test**

```bash
# Clear Expo cache and restart
cd apps/mobile
npx expo start --clear
```

---

## 🎨 Design Guidelines

### Color Schemes (Current Tier Themes):

#### **SPROUT** (Green - New Player)
- Primary: #4CAF50 (Green)
- Accent: #81C784 (Light Green)
- Theme: Growth, fresh start, leaves/vines
- Suggested Style: Simple, encouraging, organic shapes

#### **BRONZE** (Brown/Orange)
- Primary: #CD7F32 (Bronze)
- Accent: #DEB887 (Burlywood)
- Theme: Solid foundation, achievement
- Suggested Style: Shield, studs, metallic texture

#### **SILVER** (Silver/Gray)
- Primary: #C0C0C0 (Silver)
- Accent: #E8E8E8 (Light Gray)
- Theme: Shining progress, refined skill
- Suggested Style: Star accents, polished metal, elegant

#### **GOLD** (Gold/Yellow)
- Primary: #FFD700 (Gold)
- Accent: #FFF8DC (Cornsilk)
- Theme: Excellence, prestige
- Suggested Style: Crown, ornate patterns, luxury

#### **PLATINUM** (Cyan/Blue)
- Primary: #00E5FF (Bright Cyan)
- Accent: #E0F7FA (Very Light Cyan)
- Theme: Advanced mastery, celestial
- Suggested Style: Geometric, crystalline, technological

#### **DIAMOND** (Deep Blue)
- Primary: #2979FF (Blue)
- Accent: #B3E5FC (Light Blue)
- Theme: Elite skill, brilliance
- Suggested Style: Crystal shards, sharp facets, brilliant

#### **GENKI** (Red/Orange - Top Tier)
- Primary: #FF3D00 (Deep Orange/Red)
- Accent: #FF9E80 (Peach)
- Theme: Ultimate achievement, legendary
- Suggested Style: Flames, energy, intense glow, epic

#### **UNRANKED** (Gray)
- Primary: #546E7A (Blue Gray)
- Accent: #78909C (Light Blue Gray)
- Theme: Neutral, starting out
- Suggested Style: Simple ring, minimal, subtle

---

## 📐 Technical Specifications

### Image Resolution:

**Recommended:** 512x512px
- Good quality at all display sizes
- ~50KB per file (compressed)
- Total ~400KB for all 8 borders

**Minimum:** 256x256px
- Acceptable for mobile
- May pixelate on large displays

**Maximum:** 1024x1024px
- Excellent quality
- Larger file sizes (~150KB+)
- May impact performance on older devices

### Transparency Requirements:

1. **Center Circle (60% of image):**
   - **Must be 100% transparent** (alpha = 0)
   - This is where the avatar shows through
   - Example: In a 512x512 image, center 307x307px should be transparent

2. **Border Ring (40% outer area):**
   - Your decorative border design
   - Can use any alpha values (0-255)
   - Can have glow effects extending inward

3. **No Background:**
   - Entire PNG should have transparency
   - No solid background layer

### File Size:

**Target:** < 100KB per border
- Use PNG compression (TinyPNG, ImageOptim)
- Maintain visual quality
- Balance quality vs performance

---

## 🛠️ Creating Borders in Design Tools

### Photoshop:

1. **Create New Document:**
   - Size: 512x512px
   - Color Mode: RGB
   - Background: Transparent

2. **Create Center Cutout:**
   - Add circular shape layer (307px diameter, centered)
   - Use as layer mask (inverted)
   - This creates transparent center

3. **Design Border:**
   - Add decorative elements in outer ring
   - Use layer effects (glow, shadows, gradients)
   - Keep design circular/symmetrical

4. **Export:**
   - File > Export > Export As
   - Format: PNG
   - Transparency: Checked
   - Size: 512x512px

### Figma:

1. **Create Frame:**
   - 512x512px frame

2. **Add Circular Mask:**
   - Create circle (512px)
   - Create inner circle (307px, centered)
   - Subtract inner from outer (boolean subtract)

3. **Design Border:**
   - Add gradients, effects
   - Use auto-layout for symmetry

4. **Export:**
   - Select frame
   - Export as PNG
   - 1x scale (512x512)

### Procreate (iPad):

1. **New Canvas:**
   - 512x512px, RGB, transparent

2. **Create Border:**
   - Use circular guides
   - Draw/paint border design
   - Keep center clear

3. **Export:**
   - Share > PNG
   - Ensure transparency preserved

---

## 🔧 Component Usage

### Basic Usage:

```tsx
import { RankedAvatar } from '@/components/RankedAvatar';

// Automatically shows border based on tier
<RankedAvatar
  avatarUrl="https://..."
  name="Player Name"
  tier="DIAMOND"
  size={100}
/>
```

### Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `avatarUrl` | `string \| null` | - | URL to avatar image |
| `name` | `string` | **required** | Player name (for initials fallback) |
| `tier` | `PlayerTier` | `'UNRANKED'` | Player's tier |
| `size` | `number` | `80` | Total size (border + avatar) |
| `showBorder` | `boolean` | `true` | Show/hide border |
| `style` | `ViewStyle` | - | Additional styling |

### Size Examples:

```tsx
// Small (leaderboard)
<RankedAvatar tier="GOLD" name="Alice" size={60} />

// Medium (default)
<RankedAvatar tier="PLATINUM" name="Bob" size={80} />

// Large (profile header)
<RankedAvatar tier="GENKI" name="Charlie" size={120} />

// Extra Large (tournament winner)
<RankedAvatar tier="DIAMOND" name="Diana" size={160} />
```

### Sizing Logic:

The component automatically scales:
- **Border image:** 100% of `size` prop
- **Avatar:** 78% of `size` (centered within border)

Example with `size={100}`:
- Border displays at 100x100px
- Avatar displays at 78x78px (centered)

---

## 🎯 Design Tips

### 1. **Test at Multiple Sizes:**
   Your borders will be displayed at various sizes (60px - 160px typically). Design at 512px but test scaling down.

### 2. **High Contrast:**
   Borders should be visible against various backgrounds (dark theme, light theme).

### 3. **Clear Center:**
   Keep the center completely clear - no semi-transparent elements that might obscure the avatar.

### 4. **Consistent Style:**
   All 8 tier borders should feel like they belong to the same visual system.

### 5. **Progressive Enhancement:**
   Each tier should feel more impressive than the last:
   - SPROUT: Simple, minimal
   - BRONZE/SILVER: Basic decorative elements
   - GOLD/PLATINUM: Ornate, multiple layers
   - DIAMOND: Complex, brilliant effects
   - GENKI: Maximum visual impact, animated feel

### 6. **Consider Animation:**
   While static PNGs, design with future animation in mind:
   - Glowing elements could pulse
   - Particles could float
   - Flames could flicker

---

## 🐛 Troubleshooting

### Border Not Showing:

**Check:**
1. File name matches exactly (lowercase, correct spelling)
2. File is in `apps/mobile/assets/ranked-borders/`
3. File format is PNG (not JPG, GIF, etc.)
4. Expo cache cleared (`npx expo start --clear`)

**Fallback:** If PNG missing, component uses SVG emblem automatically.

### Border Looks Pixelated:

**Solution:**
- Increase image resolution (try 1024x1024px)
- Use lossless PNG compression
- Check if source file was upscaled from smaller size

### Border Too Large/Small:

**Check:**
- Verify center transparent area is 60% of total size
- Adjust avatar size ratio if needed (currently 0.78, can modify in component)

### Performance Issues:

**Solutions:**
- Compress PNGs (use TinyPNG, ImageOptim)
- Reduce resolution if file sizes > 100KB
- Ensure transparency is true transparency (not white/black)

---

## 📊 Before & After Comparison

### Current System (SVG):
- ✅ Scalable to any size
- ✅ Small file size (code only)
- ❌ Limited customization
- ❌ All borders must be coded
- ❌ Hard to update designs

### New System (PNG Images):
- ✅ Fully customizable designs
- ✅ Easy to update (just replace PNG)
- ✅ No coding required for new borders
- ✅ Designer-friendly workflow
- ⚠️ Slightly larger file size (~400KB total)

---

## 🚀 Migration Checklist

- [ ] Design 8 border PNGs (512x512px with transparency)
- [ ] Name files correctly (sprout.png, bronze.png, etc.)
- [ ] Place in `apps/mobile/assets/ranked-borders/`
- [ ] Replace `RankedAvatar.tsx` with image-based version
- [ ] Clear Expo cache
- [ ] Test at multiple sizes (60px, 80px, 120px)
- [ ] Test all 8 tiers
- [ ] Check performance on device
- [ ] Commit border images to git

---

## 📝 Quick Reference

### File Checklist:
```
✓ sprout.png (512x512, transparent center)
✓ bronze.png (512x512, transparent center)
✓ silver.png (512x512, transparent center)
✓ gold.png (512x512, transparent center)
✓ platinum.png (512x512, transparent center)
✓ diamond.png (512x512, transparent center)
✓ genki.png (512x512, transparent center)
✓ unranked.png (512x512, transparent center)
```

### Tier Order (by rating):
1. UNRANKED (no rating)
2. SPROUT (< 1300)
3. BRONZE (1300-1449)
4. SILVER (1450-1599)
5. GOLD (1600-1749)
6. PLATINUM (1750-1899)
7. DIAMOND (1900-2099)
8. GENKI (2100+) ⭐ Top Tier

---

## 🎨 Need Help?

**Resources:**
- Component: `apps/mobile/components/RankedAvatar.tsx`
- Assets: `apps/mobile/assets/ranked-borders/`
- Asset README: `apps/mobile/assets/ranked-borders/README.md`
- Current SVG implementation: `apps/mobile/components/TierEmblem.tsx` (for reference)

**Tips:**
- Start with one tier (e.g., GOLD) to test workflow
- Use current SVG designs as inspiration
- Test on actual device, not just simulator
- Consider colorblind-friendly designs

---

**Ready to create your custom borders!** 🎨✨

Follow the steps above and you'll have a fully customizable ranked border system where you can simply drop in PNG files to update the look of any tier.
