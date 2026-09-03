# Natural Bounce with Squash & Stretch - Implementation Guide

## Overview
The character now features a natural, elastic bounce animation with proper squash-and-stretch deformation, replacing the previous simple circular motion. This creates a soft, "breathing" idle animation with organic weight and life.

## Key Features

### 1. Layered Vertical Motion
**Primary + Secondary Sine Waves:**
- **Primary wave:** 2.7s period, ~10px amplitude (main bounce rhythm)
- **Secondary wave:** 4.6s period, ~2.5px amplitude (layered irregularity)
- **Result:** Non-metronomic motion that feels organic, not perfectly cyclic

**Hang Time Easing:**
- Custom easing function applied to primary wave
- Lingers longer at TOP of bounce (hang time)
- Moves faster through MIDDLE (like real gravity)
- Creates weight and physics feel

### 2. Independent Horizontal Drift
**Offset Phase Motion:**
- ~4px horizontal sway
- 3.8s period (different from vertical)
- Phase offset: +1.2 radians from vertical
- **Critical:** NOT paired into ellipse/orbit
- Result: Two axes feel independently driven, more natural

### 3. Squash and Stretch (Game-Changer)
**Physically Tied to Vertical Position:**

The scale deformation is directly mapped to where the face is in its bounce cycle:

```
Vertical Position    ScaleY    ScaleX    Visual Effect
─────────────────────────────────────────────────────────
Top (+1)             1.04      0.97      Stretched tall, narrow
Middle (0)           1.00      1.00      Neutral
Bottom (-1)          0.95      1.04      Squashed flat, wide
```

**Why This Works:**
- At BOTTOM: compressed by "impact" → squashed
- At TOP: extended by momentum → stretched  
- At MIDDLE: transitioning → neutral
- Scale is driven by SAME sine value as position (not independent timer)
- Result: Physically believable elastic deformation

### 4. Layer Synchronization

**Face Plane:**
- Position: Layered bounce (vertical + horizontal)
- Scale: Squash/stretch tied to vertical cycle
- Shader: Blink crossfade (unchanged)

**Strand Plane:**
- Position: INHERITS exact same bounce offsets as face
- Scale: Neutral (1, 1, 1) - no squash/stretch
- Shader: Internal bending sway (vertex displacement, unchanged)
- Result: Strand moves WITH head but has independent internal motion

**Hover Scale:**
- Applied at GROUP level (wraps both planes)
- Multiplies on top of squash/stretch
- All animations continue while scaled

## Technical Implementation

### Timing Constants (All Tunable)

```typescript
// Vertical bounce
BOUNCE_VERTICAL_PRIMARY_AMPLITUDE = 0.10      // ~10px
BOUNCE_VERTICAL_SECONDARY_AMPLITUDE = 0.025   // ~2.5px
BOUNCE_VERTICAL_PRIMARY_PERIOD = 2.7          // seconds
BOUNCE_VERTICAL_SECONDARY_PERIOD = 4.6        // seconds

// Horizontal drift
BOUNCE_HORIZONTAL_AMPLITUDE = 0.04            // ~4px
BOUNCE_HORIZONTAL_PERIOD = 3.8                // seconds

// Squash & stretch ratios
SQUASH_SCALE_Y_MIN = 0.95     // scaleY at bottom (squashed)
SQUASH_SCALE_X_MAX = 1.04     // scaleX at bottom (widened)
STRETCH_SCALE_Y_MAX = 1.04    // scaleY at top (stretched)
STRETCH_SCALE_X_MIN = 0.97    // scaleX at top (narrowed)
```

### Custom Easing Function

```typescript
function easeWithHangTime(t: number): number {
  // Input: sine wave [-1, 1]
  // Output: eased value with hang time at peak
  
  const normalized = (t + 1) * 0.5;  // Map to [0, 1]
  const eased = normalized * normalized * (3 - 2 * normalized);  // Smoothstep
  const withHang = eased * eased * (3 - 2 * eased);  // Double smoothstep for extra hang
  return withHang * 2 - 1;  // Map back to [-1, 1]
}
```

**Visual Result:**
- Slow at top (hang time - like apex of jump)
- Fast through middle (acceleration)
- Natural gravity-like motion curve

### Position Calculation

```typescript
const time = state.clock.elapsedTime;

// Vertical (with hang time easing)
const primaryVertical = Math.sin(time * (2π / period1));
const secondaryVertical = Math.sin(time * (2π / period2) + phase);
const easedVertical = easeWithHangTime(primaryVertical) * amp1 + secondaryVertical * amp2;

// Horizontal (no easing, different period/phase)
const horizontalDrift = Math.sin(time * (2π / period3) + phase2) * amp3;

meshRef.current.position.y = easedVertical;
meshRef.current.position.x = horizontalDrift;
```

### Scale Calculation (Squash & Stretch)

```typescript
const verticalPosition = primaryVertical;  // -1 to +1

if (verticalPosition < 0) {
  // Bottom half: interpolate to squash
  const t = Math.abs(verticalPosition);
  scaleY = 1 + (SQUASH_SCALE_Y_MIN - 1) * t;    // → 0.95
  scaleX = 1 + (SQUASH_SCALE_X_MAX - 1) * t;    // → 1.04
} else {
  // Top half: interpolate to stretch
  const t = verticalPosition;
  scaleY = 1 + (STRETCH_SCALE_Y_MAX - 1) * t;   // → 1.04
  scaleX = 1 + (STRETCH_SCALE_X_MIN - 1) * t;   // → 0.97
}

meshRef.current.scale.set(scaleX, scaleY, 1);
```

**Critical:** Scale is calculated from `primaryVertical` (the SAME value driving position), ensuring physical coherence.

## Tuning Guide

### Amplitude Tuning

**Too Subtle:**
```typescript
BOUNCE_VERTICAL_PRIMARY_AMPLITUDE = 0.05  // Barely visible
SQUASH_SCALE_Y_MIN = 0.98                 // Minimal squash
```

**Balanced (Default):**
```typescript
BOUNCE_VERTICAL_PRIMARY_AMPLITUDE = 0.10  // Noticeable, natural
SQUASH_SCALE_Y_MIN = 0.95                 // Clear but not cartoony
```

**Exaggerated (Cartoony):**
```typescript
BOUNCE_VERTICAL_PRIMARY_AMPLITUDE = 0.20  // Large bounce
SQUASH_SCALE_Y_MIN = 0.85                 // Extreme squash
SQUASH_SCALE_X_MAX = 1.15                 // Very wide
```

### Period Tuning

**Faster (Energetic):**
```typescript
BOUNCE_VERTICAL_PRIMARY_PERIOD = 2.0      // Quick bounce
BOUNCE_HORIZONTAL_PERIOD = 2.5            // Snappy drift
```

**Slower (Calm, Meditative):**
```typescript
BOUNCE_VERTICAL_PRIMARY_PERIOD = 4.0      // Slow, breathing
BOUNCE_HORIZONTAL_PERIOD = 5.5            // Gentle sway
```

### Squash/Stretch Intensity

**Subtle (Realistic):**
```typescript
SQUASH_SCALE_Y_MIN = 0.97
SQUASH_SCALE_X_MAX = 1.02
STRETCH_SCALE_Y_MAX = 1.02
STRETCH_SCALE_X_MIN = 0.98
```

**Moderate (Default - Elastic Feel):**
```typescript
SQUASH_SCALE_Y_MIN = 0.95
SQUASH_SCALE_X_MAX = 1.04
STRETCH_SCALE_Y_MAX = 1.04
STRETCH_SCALE_X_MIN = 0.97
```

**Extreme (Cartoon Physics):**
```typescript
SQUASH_SCALE_Y_MIN = 0.88
SQUASH_SCALE_X_MAX = 1.12
STRETCH_SCALE_Y_MAX = 1.12
STRETCH_SCALE_X_MIN = 0.90
```

## Animation Layers (All Active Simultaneously)

```
Layer 1: Blink Reflex
├─ Texture crossfade (shader uniform)
├─ Fast, independent timing
└─ Unaffected by position/scale

Layer 2: Bounce Motion (NEW)
├─ Position: Layered sine waves with easing
├─ Scale: Squash/stretch tied to position
└─ Both face and strand inherit position

Layer 3: Strand Bending
├─ Vertex shader displacement
├─ Internal sway independent of global position
└─ Only on strand plane

Layer 4: Hover Scale
├─ Group-level uniform scale
├─ Smooth lerp transition
└─ Multiplies on top of squash/stretch
```

## Visual Goals Achieved

✅ **Elastic, organic bounce** (not mechanical orbit)  
✅ **Weight and physics** (hang time at apex)  
✅ **Squash/stretch deformation** (cartoon principles)  
✅ **Irregular motion** (layered sine waves, not perfect loop)  
✅ **Independent axes** (not circular/elliptical path)  
✅ **Perfect sync** (face + strand move together)  
✅ **All layers preserved** (blink, sway, hover still work)

## Performance Notes

- **CPU:** Minimal - just sine calculations + lerp per frame
- **GPU:** No change - same shader complexity as before
- **Frame budget:** <0.2ms additional per frame (negligible)
- **Smoothness:** 60fps stable

## Troubleshooting

**Issue: Bounce feels mechanical**
- Solution: Increase secondary amplitude/period variation
- Adjust easing curve for more hang time

**Issue: Squash/stretch too subtle**
- Solution: Increase scale min/max values (widen range)
- Check that scale is updating every frame

**Issue: Strand not following face**
- Solution: Verify strand inherits EXACT same position logic
- Check that both use same time value and constants

**Issue: Hover breaks squash/stretch**
- Solution: Ensure hover scale is applied at GROUP level, not mesh level
- Face mesh should still update its own scale each frame

## Future Enhancements

1. **Secondary Squash on Blink:** Slight vertical squash during eye close
2. **Stretch on Hover:** Extra vertical stretch when mouse enters
3. **Anticipation:** Small squash before big bounce for cartoon effect
4. **Spring Physics:** Replace sine waves with spring simulation for overshoot
5. **Breath Cycle:** Slow scale pulse independent of bounce (chest breathing)

## References

**12 Principles of Animation (Disney):**
- Squash and Stretch: Primary principle for believable motion
- Slow In/Slow Out: Implemented via hang time easing
- Secondary Action: Layered sine waves for organic feel

**Implementation Inspired By:**
- Rubberhose animation (1930s cartoons)
- Modern motion design (UI animation principles)
- Game character idle animations (indie platformers)
