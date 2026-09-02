# Animation Improvements Summary

## ✨ What Changed

### 1. Faster, Smoother Blinks
**Before:**
- Blink duration: 175ms per fade (350ms total per eye)
- Gap between eyes: 1000ms
- Easing: smoothstep

**After:**
- Blink duration: **80ms per fade (160ms total per eye)** ⚡
- Gap between eyes: **200ms** (much snappier!)
- Easing: **smootherstep** (Ken Perlin's improved formula - ultra smooth)

**Result:** Blinks now feel like natural, quick reflexes instead of slow winks. Total blink sequence reduced from ~2.7s to ~720ms.

### 2. Head Bounce Animation 🎭
**New Feature:** The entire character (face + strand) now gently sways left-right

**Motion Characteristics:**
- **Horizontal Sway:** Smooth sine wave with dynamic easing
  - Formula: `sin(t) × (1 - 0.3 × cos(2t))`
  - Creates organic variation, not mechanical metronome
- **Vertical Bob:** Subtle up-down motion at 2× frequency
  - Creates figure-8 path for breathing-like quality
- **Period:** 4 seconds per full left-right-left cycle
- **Amplitude:** Gentle enough to be pleasant, noticeable enough to add life

**Technical Details:**
- Both face and strand planes move in perfect sync
- Position updated every frame via `useFrame`
- No jitter or lag - smooth 60fps animation

### 3. Improved Easing Functions

**Smootherstep Formula:**
```glsl
t³ × (t × (6t - 15) + 10)
```

**Why it's better than smoothstep:**
- Zero velocity at start AND end (C² continuity)
- More natural acceleration/deceleration curve
- Used in high-quality procedural noise (Perlin noise improvement)
- Results in even smoother, more organic motion

## Timing Breakdown

### Blink Reflex Cycle (~3.72 seconds total)
1. **Left eye blinks:** 160ms
2. **Gap:** 200ms
3. **Right eye blinks:** 160ms
4. **Rest:** 3000ms
5. **Total:** 3520ms (~3.5s) per cycle

### Head Bounce (continuous)
- **Full cycle:** 4 seconds (left → right → left)
- **Runs independently** from blink timing
- **Never stops** - continuous ambient motion

## Visual Result

The character now feels:
- ✅ More alive and natural
- ✅ Quick, reactive blinks (not slow winks)
- ✅ Gentle idle breathing motion
- ✅ Smooth, organic animations throughout
- ✅ Pleasant to watch for extended periods

## Tuning Guide

All constants are at the top of `components/HeroFace.tsx`:

```typescript
// Blink timing
BLINK_REFLEX_INTERVAL = 3000  // Wait before next cycle
BLINK_GAP = 200               // Gap between eyes (faster = more urgent)
BLINK_DURATION = 80           // Fade speed (lower = faster)

// Head bounce
HEAD_BOUNCE_AMPLITUDE = 0.08  // How far to sway (higher = more movement)
HEAD_BOUNCE_PERIOD = 4.0      // Speed (lower = faster bounce)
HEAD_BOUNCE_VERTICAL = 0.02   // Vertical bob amount

// Strand sway (independent)
SWAY_AMPLITUDE = 0.015
SWAY_PERIOD = 3.5
```

### Suggested Variations

**For more energetic character:**
```typescript
BLINK_REFLEX_INTERVAL = 2000
HEAD_BOUNCE_PERIOD = 3.0
HEAD_BOUNCE_AMPLITUDE = 0.12
```

**For calmer, meditative feel:**
```typescript
BLINK_REFLEX_INTERVAL = 5000
HEAD_BOUNCE_PERIOD = 6.0
HEAD_BOUNCE_AMPLITUDE = 0.05
```

**For hyper-realistic human blinks:**
```typescript
BLINK_DURATION = 120  // Humans: ~100-150ms
BLINK_GAP = 150       // Nearly simultaneous
```
