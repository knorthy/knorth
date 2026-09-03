# WebGL Hero Face - Implementation Guide

## Overview
A WebGL idle animation scene featuring a blinking face with a swaying hair strand, built with @react-three/fiber and @react-three/drei. This serves as the intro/landing page before the main site.

## Architecture

### Route Structure
- **`app/page.tsx`** - Intro page with WebGL hero face (first thing users see)
- **`app/home/page.tsx`** - Actual site content (moved from original page.tsx)
- **`components/HeroFace.tsx`** - WebGL scene component

### Components

#### HeroFace (Main Component)
- Renders the full-screen Canvas with loading fallback
- Shows static face.png while WebGL initializes (no blank flash)
- Includes navigation placeholder button to proceed to /home

#### Scene Setup
- **Orthographic camera** (zoom: 200) - treats the scene as 2D for flat illustration rendering
- **Two layered planes:**
  1. **Face Plane** (z: 0) - Base layer with blink animation
  2. **Strand Plane** (z: 0.01) - Top layer with sway animation

### Animation Systems

#### 1. Blink Behavior (Face Plane)
**Shader-Based Sequential Blink Reflex:**
- Loads 3 textures: `face.png`, `bleft.png`, `bright.png`
- Custom fragment shader blends between base and blink texture via `uBlinkMix` uniform
- **Blink Sequence:** Fast, natural double-blink reflex pattern
  1. **First eye blinks** (left eye - bleft.png): fade in → fade out (80ms each way = 160ms total)
  2. **200ms gap** - both eyes open (quick succession)
  3. **Second eye blinks** (right eye - bright.png): fade in → fade out (80ms each way = 160ms total)
  4. **3 second wait** before next reflex cycle
- **State Machine:** `idle` → `firstBlink` → `gap` → `secondBlink` → `idle`
- **Easing:** Smootherstep (Ken Perlin's improved noise function: `t³ × (t × (6t - 15) + 10)`) for ultra-smooth motion

**Why shader-based?**
- True smooth blend (no hard cuts or flicker)
- GPU-accelerated
- Precise timing control

#### 2. Head Bounce Animation
**Smooth Left-Right Sway:**
- Both face and strand planes move together as one unit
- **Horizontal Motion:** Sine wave with dynamic easing - `sin(t) × (1 - 0.3 × cos(2t))` creates organic variation
- **Vertical Bob:** Subtle figure-8 motion at 2× frequency adds breathing-like quality
- **Period:** 4 seconds for full left-right-left cycle
- **Result:** Character appears alive and gently swaying, like subtle idle breathing

**Motion Details:**
- Amplitude: ~0.08 units horizontal, ~0.02 units vertical
- The dynamic easing prevents mechanical back-and-forth, creating natural weight shift
- Both layers move in sync to maintain visual cohesion

#### 2. Strand Sway (Strand Plane)
**Vertex Shader Natural Bending:**
- Geometry subdivided vertically (14 segments) to allow bending
- Displacement formula: `position.x += (primarySway + secondarySway) × heightFactor²`
  - **heightFactor:** UV.y (0 at root, 1 at tip) - ensures root stays anchored
  - **primarySway:** `sin(time × 2π/period)` - main sway cycle
  - **secondarySway:** Different frequency/phase - adds irregularity
- **Head-Relative Motion:** Strand moves with the head bounce AND has its own internal sway
- **Result:** Hair bends naturally like real hair/rope, with both global (head) and local (strand) motion

**Motion Layering:**
1. **Global:** Follows head bounce (same position offset as face)
2. **Local:** Internal vertex displacement creates bending within the strand
3. **Combined:** Natural hair physics with head movement + wind-like sway

**Timing Constants (tunable):**
```typescript
BLINK_REFLEX_INTERVAL = 3000   // ms - wait before starting new blink cycle
BLINK_GAP = 200                // ms - gap between first and second blink (fast!)
BLINK_DURATION = 80            // ms (one-way fade - ultra smooth)
HEAD_BOUNCE_AMPLITUDE = 0.08   // horizontal sway distance
HEAD_BOUNCE_PERIOD = 4.0       // seconds per full bounce cycle
HEAD_BOUNCE_VERTICAL = 0.02    // subtle vertical bob
SWAY_AMPLITUDE = 0.015         // strand tip displacement
SWAY_PERIOD = 3.5              // seconds
SWAY_SECONDARY_AMPLITUDE = 0.006
SWAY_SECONDARY_PERIOD = 5.2    // seconds
```

## Assets

### Required Files (in `/public/hero/`)
- ✅ **face.png** - Base face, eyes open, strand removed
- ✅ **bleft.png** - Right eye closed (wink)
- ✅ **bright.png** - Left eye closed (wink)
- ⚠️ **strand.png** - Isolated hair strand (NEEDS TO BE ADDED)

**Status:** face/bleft/bright copied from `/public/char/`, strand.png still needed.

### Asset Specs
- Size: 1563×1563 canvas
- Format: PNG with transparency
- Alignment: All assets on same canvas coordinates for seamless layering

## Navigation

### Current Implementation
A placeholder "Enter Site" button at bottom-center navigates to `/home` using Next.js router.

### Integration Point
Replace the `proceedToHome()` function in `HeroFace.tsx` with your custom pull/click interaction trigger when ready:

```typescript
const proceedToHome = () => {
  // Wire your custom interaction here
  router.push('/home');
};
```

## Performance Notes

### Fast Load Optimization
1. **Loading State:** Static face.png displayed immediately while Canvas initializes
2. **Texture Preloading:** `useTexture()` from drei preloads all assets before render
3. **Smooth Transition:** Opacity fade-in once WebGL is ready (100ms delay)
4. **Result:** No blank flash on first paint

### GPU Considerations
- Shaders run on GPU (minimal CPU usage)
- Two planes with simple geometry (low poly count)
- Texture updates happen via uniforms (no texture swapping overhead)

## Development

### Local Testing
```bash
cd knorth
npm run dev
```
Visit `http://localhost:3000` - you'll see the intro page
Visit `http://localhost:3000/home` - the original site content

### Tuning the Animation
All timing constants are at the top of `HeroFace.tsx` for easy adjustment:
- Adjust `BLINK_REFLEX_INTERVAL` for time between blink cycles (default: 3s)
- Adjust `BLINK_GAP` for delay between first and second eye blink (default: 1s)
- Adjust `BLINK_DURATION` for speed of each blink fade (default: 175ms)
- Adjust `SWAY_AMPLITUDE` for more/less strand movement
- Adjust `SWAY_PERIOD` for faster/slower sway cycles

### Debugging
- If textures don't load: Check browser console for 404s
- If no animation: Check that `useFrame` is firing (add console.log to `uTime`)
- If strand doesn't bend: Verify geometry subdivision (should see `args={[2, 2, 1, 14]}`)

## Dependencies Added
```json
"@react-three/fiber": "^8.x",
"@react-three/drei": "^9.x",
"three": "^0.x"
```

## Technical Details

### Why Orthographic Camera?
The face is a flat 2D illustration, not a 3D object. We're using WebGL for:
- Shader access (smooth blending, vertex displacement)
- GPU performance
- NOT for perspective/3D depth

Orthographic camera removes perspective distortion, keeping everything flat.

### Why Vertex Subdivision?
A single quad (4 vertices) can only rotate/scale rigidly. By subdividing the strand plane into 14 vertical segments (giving us 30 vertices), each vertex can be displaced independently, allowing the strand to **bend** naturally.

### Shader Math
**Smoothstep Easing:** `t² × (3 - 2t)`
- At t=0: result = 0
- At t=0.5: result ≈ 0.5 (smooth acceleration/deceleration)
- At t=1: result = 1
- Natural ease-in/ease-out, better than linear

**Height-based scaling:** `heightFactor²`
- Squared (not linear) creates more natural taper
- Root barely moves, middle moves some, tip moves most
- Mimics real physics of flexible materials

## Future Enhancements
- Add custom pull/swipe interaction to trigger navigation
- Add subtle ambient particles/lighting
- Add sound effects on blink
- Add easter eggs (rare blink patterns)
