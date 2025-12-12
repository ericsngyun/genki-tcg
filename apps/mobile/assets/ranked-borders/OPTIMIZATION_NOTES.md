# Border Image Optimization Notes

## Current File Sizes
Your current border images are quite large (~1.4-1.7MB each). Here's how to optimize them for better performance:

## Recommended Optimizations

### 1. **Compress PNGs (Lossless)**

Use these tools to reduce file size without quality loss:

**Online Tools:**
- TinyPNG: https://tinypng.com
- ImageOptim: https://imageoptim.com/online
- Squoosh: https://squoosh.app

**Target:** Reduce from 1.4-1.7MB to ~50-200KB each

### 2. **Verify Resolution**

Your images should be:
- **512x512px** (recommended) - ~50-100KB compressed
- **1024x1024px** (high quality) - ~150-300KB compressed
- **2048x2048px** (current?) - ~1-2MB (too large!)

**Check current resolution:**
```bash
file apps/mobile/assets/ranked-borders/gold.png
```

If they're larger than 1024x1024, consider resizing:
```bash
# Using ImageMagick (if installed)
convert gold.png -resize 1024x1024 gold-optimized.png
```

### 3. **Optimization Commands**

**Using pngquant (lossy but high quality):**
```bash
pngquant --quality=80-95 --ext .png --force apps/mobile/assets/ranked-borders/*.png
```

**Using OptiPNG (lossless):**
```bash
optipng -o7 apps/mobile/assets/ranked-borders/*.png
```

### 4. **Batch Optimization (Windows)**

Download TinyPNG or use online service:
1. Upload all 7 PNGs to https://tinypng.com
2. Download compressed versions
3. Replace files in `apps/mobile/assets/ranked-borders/`

## Performance Impact

### Current (1.4-1.7MB × 7 = ~10MB total):
- ❌ Slow initial load
- ❌ High memory usage
- ❌ Longer bundle size
- ❌ May cause lag on older devices

### Optimized (~100KB × 7 = ~700KB total):
- ✅ Fast load times
- ✅ Low memory footprint
- ✅ Smaller app bundle
- ✅ Smooth on all devices

## Quality Check

After optimization:
1. Run the test component: `<RankedBorderTest />`
2. Check quality at all sizes (60px, 80px, 120px, 160px)
3. Ensure no visible pixelation or artifacts
4. Test on actual device (not just simulator)

## Recommended Settings for Future Borders

When creating new borders:
1. **Design at:** 1024x1024px or 2048x2048px
2. **Export at:** 1024x1024px (max)
3. **Compress:** Use TinyPNG before adding to project
4. **Target size:** < 200KB per file

## Current Component Optimizations

The component already includes:
- ✅ `resizeMode="contain"` - Maintains aspect ratio
- ✅ `resizeMethod="scale"` - High quality scaling
- ✅ `fadeDuration={0}` - No fade delay for instant display
- ✅ Responsive sizing at any dimension
- ✅ Proper layering (border behind avatar)

## Next Steps

1. **Compress your current PNGs** using TinyPNG or similar
2. **Test quality** with RankedBorderTest component
3. **Monitor performance** - app should feel snappy
4. **Adjust if needed** - balance quality vs file size
