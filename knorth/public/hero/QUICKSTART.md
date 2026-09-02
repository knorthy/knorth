# Hero Face - Quick Start

## ✅ What's Done
1. ✅ Installed @react-three/fiber, @react-three/drei, three
2. ✅ Created `HeroFace.tsx` component with:
   - Blink animation (shader-based texture crossfade)
   - Strand sway animation (vertex shader with natural bending)
   - Loading fallback (no blank flash)
   - Navigation placeholder
3. ✅ Moved original site to `/home` route
4. ✅ Set intro page (`/`) to render HeroFace
5. ✅ Copied face/bleft/bright from `/public/char/`

## ⚠️ Missing Asset
**`strand.png`** - The isolated hair strand file needs to be added to this directory.

Without it, the strand sway animation won't render (but face blink works fine).

## 🚀 Test It
```bash
npm run dev
```
- Visit `http://localhost:3000` → See intro with face animation
- Click "Enter Site" → Navigate to `/home` (original content)

## 🎨 Tune It
Edit timing constants at top of `components/HeroFace.tsx`:

**Blink Timing:**
- `BLINK_REFLEX_INTERVAL` - Wait time between blink cycles (default: 3s)
- `BLINK_GAP` - Gap between first and second eye blink (default: 200ms)
- `BLINK_DURATION` - Speed of blink fade (default: 80ms)

**Natural Bounce Motion:**
- `BOUNCE_VERTICAL_PRIMARY_AMPLITUDE` - Main vertical bounce height (default: 0.10 = ~10px)
- `BOUNCE_VERTICAL_PRIMARY_PERIOD` - Bounce speed (default: 2.7s per cycle)
- `BOUNCE_HORIZONTAL_AMPLITUDE` - Horizontal drift amount (default: 0.04 = ~4px)
- `BOUNCE_HORIZONTAL_PERIOD` - Drift speed (default: 3.8s)

**Squash & Stretch:**
- `SQUASH_SCALE_Y_MIN` - How flat at bottom (default: 0.95)
- `SQUASH_SCALE_X_MAX` - How wide at bottom (default: 1.04)
- `STRETCH_SCALE_Y_MAX` - How tall at top (default: 1.04)
- `STRETCH_SCALE_X_MIN` - How narrow at top (default: 0.97)

**Strand Sway:**
- `SWAY_AMPLITUDE` - Internal strand bend amount
- `SWAY_PERIOD` - Sway speed

**Hover:**
- `HOVER_SCALE` - Scale multiplier on hover (default: 1.15)
- `HOVER_TRANSITION_SPEED` - Smoothness (default: 5)

## Animation Behavior

**Natural Bounce with Squash & Stretch:**
- Elastic vertical bounce with hang time at top (like real gravity)
- Independent horizontal drift (not circular motion)
- **Squash at bottom:** Face compresses (scaleY: 0.95, scaleX: 1.04)
- **Stretch at top:** Face extends (scaleY: 1.04, scaleX: 0.97)
- **Neutral at middle:** Normal proportions (1.0, 1.0)
- Layered sine waves create organic, non-repetitive motion

**Blink Reflex:**
1. Left eye blinks (bleft.png) - 80ms fade in/out
2. 200ms pause
3. Right eye blinks (bright.png) - 80ms fade in/out
4. 3 second wait before repeating

**Strand Synchronization:**
- Inherits face position (moves WITH head)
- No squash/stretch (keeps neutral scale)
- Internal vertex bending sway continues independently

**Hover Effect:**
- Hover → smoothly enlarges to 115%
- All animations continue (bounce, squash, blink, sway)
- Click to navigate to /home

## 📝 Full Docs
See `/HERO_FACE_SETUP.md` for complete technical documentation.
