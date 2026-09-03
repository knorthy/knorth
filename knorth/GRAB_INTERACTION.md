# Grab Interaction - Complete Implementation Guide

## Overview
Click and hold the left mouse button on the character to "grab" it — the face squints (ughh.png), shrinks with a compressed snap, and dips downward. Release to spring back to idle with overshoot bounce. All existing animations (strand sway) continue running.

## Trigger
- **Grab Start:** Left mouse button down on face
- **Hold:** Keep mouse button held (while hovering)
- **Release:** Mouse button up (anywhere, or mouse leaves bounds)

## Asset
**ughh.png** - Squinting/strained expression
- Location: `/public/hero/ughh.png`
- Size: 1563×1563 canvas (same as all other expressions)
- Content: Eyes squinted/closed, face showing strain
- Alignment: Centered, matching face.png

## Animation Phases

### Phase 1: Grab Start (Mouse Down)

**Duration:** ~550ms total
- Expression fade: 150-200ms
- Scale + position: 550ms

#### Expression Change
```
face.png → ughh.png
Blend: Shader crossfade via uGrabMix uniform
Duration: 175ms
Priority: Takes precedence over blink and hover
```

#### Scale Animation (Squish Snap)
```
Time        Scale     Description
────────────────────────────────────────
0ms         1.00      Start (idle)
0-330ms     ↓         Snap down (60% of duration)
330ms       0.84      UNDERSHOOT (peak compression)
330-550ms   ↑         Settle back up (40% of duration)
550ms       0.88      Final held scale (target)
```

**Easing:** Smoothstep with undershoot creates "compressed snap" feel
- Fast drop to 0.84 (16% smaller than normal)
- Gentle settle to 0.88 (12% smaller - held state)

#### Position Animation (Downward Dip)
```
Time        Pos Y     Description
────────────────────────────────────────
0ms         0.00      Start (neutral)
0-330ms     ↓         Dip down (synced with scale)
330ms       -0.20     PEAK DIP (~20px down)
330-550ms   ↑         Settle (synced with scale)
550ms       -0.06     Rest offset (~6px down - held)
```

**Sync:** Position dip is perfectly synced to scale undershoot timing

#### Other Effects
- **Blink:** Paused immediately (no mid-blink interruption)
- **Idle Bounce:** Paused/overridden
- **Strand:** Follows face position (inherits Y offset), continues internal sway

### Phase 2: Held State

**Duration:** As long as mouse button stays down

```
Scale:      0.88 (constant)
Position Y: -0.06 (constant)
Expression: ughh.png (full)
Bounce:     Paused
Blink:      Paused
Strand:     Following grab offset + own sway
```

**Visual:** Character stays in compressed, dipped, squinting state at rest

### Phase 3: Release (Mouse Up)

**Duration:** ~450ms total

#### Scale Animation (Spring Release)
```
Time        Scale     Description
────────────────────────────────────────
0ms         0.88      Held state
0-315ms     ↑         Spring up (70% of duration)
315ms       1.04      OVERSHOOT (4% larger)
315-450ms   ↓         Settle down (30% of duration)
450ms       1.00      Normal idle scale
```

**Easing:** Smoothstep with overshoot creates "springy release" bounce

#### Position Animation (Rise Back)
```
Time        Pos Y     Description
────────────────────────────────────────
0ms         -0.06     Held offset
0-315ms     ↑         Rise (70%, synced with scale)
315ms       0.00      Neutral (synced with overshoot)
315-450ms   -         Hold at neutral
450ms       0.00      Neutral (final)
```

#### Expression Fade
```
ughh.png → face.png
Blend: Shader crossfade via uGrabMix uniform
Duration: 175ms
Start: Immediately on release (overlaps with motion)
```

**Result:** Expression relaxes AS the body springs back (feels reactive)

#### Resume Idle Behavior
- **Bounce:** Resumes smoothly from current position/scale
- **Blink:** Schedules new cycle (fresh start, not mid-cycle resume)
- **Strand:** Resumes idle bounce position + continues own sway

## Tuning Constants

All values at top of `HeroFace.tsx`:

```typescript
// Expression fade
GRAB_EXPRESSION_FADE_DURATION = 175        // ms

// Grab scale
GRAB_SCALE_TARGET = 0.88                   // Held scale (12% smaller)
GRAB_SCALE_UNDERSHOOT = 0.84               // Peak compression (16% smaller)
GRAB_SCALE_DURATION = 550                  // ms - grab animation

// Position dip
GRAB_POSITION_DIP_PEAK = -0.20             // Peak downward offset (~20px)
GRAB_POSITION_DIP_REST = -0.06             // Held offset (~6px)

// Release
GRAB_RELEASE_SCALE_OVERSHOOT = 1.04        // Spring overshoot (4% larger)
GRAB_RELEASE_DURATION = 450                // ms - release animation
```

### Feel Adjustments

**More Dramatic Grab:**
```typescript
GRAB_SCALE_TARGET = 0.80                   // Even smaller
GRAB_SCALE_UNDERSHOOT = 0.75               // More compression
GRAB_POSITION_DIP_PEAK = -0.30             // Dip further
```

**Gentler Grab:**
```typescript
GRAB_SCALE_TARGET = 0.92                   // Less shrink
GRAB_SCALE_UNDERSHOOT = 0.89               // Subtle compression
GRAB_POSITION_DIP_PEAK = -0.12             // Small dip
```

**Bouncier Release:**
```typescript
GRAB_RELEASE_SCALE_OVERSHOOT = 1.08        // Bigger bounce
GRAB_RELEASE_DURATION = 600                // Slower, exaggerated
```

**Snappier Release:**
```typescript
GRAB_RELEASE_DURATION = 300                // Faster snap back
```

## Technical Implementation

### State Management

**Grab State (Scene Component):**
```typescript
const [isGrabbed, setIsGrabbed] = useState(false);

// Events:
onPointerDown  → setIsGrabbed(true)
onPointerUp    → setIsGrabbed(false)
onPointerLeave → setIsGrabbed(false) // Auto-release
```

**Animation Tracking (FacePlane Component):**
```typescript
const grabExpressionMix = useRef(0);      // 0-1, expression blend
const grabScale = useRef(1);               // Current scale value
const grabPositionY = useRef(0);           // Current Y offset
const grabStartTime = useRef(0);           // Timestamp
const grabReleaseTime = useRef(0);         // Timestamp
```

### Shader Uniforms

**New Uniform:**
```glsl
uniform sampler2D uTexGrab;  // ughh.png
uniform float uGrabMix;       // 0-1 blend amount
```

**Blending Priority:**
```glsl
base → (blend with blink) → (blend with hover) → (blend with grab)
```

Grab takes final priority (overrides hover expression if both active)

### Timing Curves

**Grab Snap (Two-Phase):**
```
Phase 1 (0-60%): Undershoot
  t = elapsed / (0.6 * duration)
  eased = smoothstep(t)
  scale = lerp(1.0, UNDERSHOOT, eased)

Phase 2 (60-100%): Settle
  t = (elapsed - 0.6*duration) / (0.4 * duration)
  eased = smoothstep(t)
  scale = lerp(UNDERSHOOT, TARGET, eased)
```

**Release Spring (Two-Phase):**
```
Phase 1 (0-70%): Overshoot
  t = elapsed / (0.7 * duration)
  eased = smoothstep(t)
  scale = lerp(TARGET, OVERSHOOT, eased)

Phase 2 (70-100%): Settle
  t = (elapsed - 0.7*duration) / (0.3 * duration)
  eased = smoothstep(t)
  scale = lerp(OVERSHOOT, 1.0, eased)
```

## Cursor Feedback

```
State          Cursor       Trigger
───────────────────────────────────────
Outside        default      -
Hover          grab         onPointerEnter
Grabbing       grabbing     onPointerDown
Release hover  grab         onPointerUp (still hovering)
Leave grabbed  default      onPointerLeave
```

## Layer Interaction

### With Hover (ohh.png)
```
NOT grabbed, hovering  → ohh.png (surprised)
Grab starts            → ughh.png (squint) - overrides hover
Release                → ohh.png (if still hovering)
```

Hover expression disabled during grab, re-enabled after release

### With Blink
```
Blinking, grab starts  → Blink interrupted, face → ughh.png
Grabbed               → No blinking
Release               → Blink cycle resumes fresh
```

Blink state machine pauses in 'idle' mode while grabbed

### With Idle Bounce
```
Bouncing, grab starts  → Bounce paused, grab animations take over
Grabbed               → Static at grab offset
Release               → Bounce resumes from current position
```

Position/scale during grab completely override idle bounce values

### With Strand Sway
```
Always running!
Grab   → Strand follows face's grab Y offset
Held   → Strand at grab offset, continues internal bending
Release → Strand follows face back up
```

Strand **inherits** position offset but keeps **independent** vertex bending

## Animation Layers (All Simultaneous)

```
┌─────────────────────────────────────────┐
│ GROUP SCALE (Hover)                     │
│  Disabled during grab                   │
├─────────────────────────────────────────┤
│ FACE PLANE                              │
│  Position: idle bounce OR grab offset   │
│  Scale: idle squash OR grab scale       │
│  Shader Layer 1: Blink (paused on grab) │
│  Shader Layer 2: Hover (disabled on grab)│
│  Shader Layer 3: Grab ★ (new)          │
├─────────────────────────────────────────┤
│ STRAND PLANE                            │
│  Position: follows face (idle OR grab)  │
│  Shader: vertex bending (always active) │
└─────────────────────────────────────────┘
```

## Performance

**Additional Cost:**
- One texture load (ughh.png) - ~1MB, one-time
- One uniform (uGrabMix) - negligible
- Grab animation math - <0.1ms per frame
- No shader complexity increase (same mix operations)

**Total overhead:** Effectively zero

## Visual Timeline (Complete Grab → Release)

```
Time   Scale  Pos Y   Expression  State
─────────────────────────────────────────────
0ms    1.00   0.00    face.png    Idle bounce
       ↓ GRAB CLICK ↓
0ms    1.00   0.00    face→ughh   Grab start
100ms  0.92  -0.12    ughh 50%    Snapping
200ms  0.86  -0.18    ughh 100%   Near undershoot
330ms  0.84  -0.20    ughh        Undershoot peak
400ms  0.86  -0.14    ughh        Settling
550ms  0.88  -0.06    ughh        Held state
...    0.88  -0.06    ughh        [HOLDING]
       ↓ RELEASE ↓
0ms    0.88  -0.06    ughh→face   Release start
150ms  0.96  -0.02    face 50%    Rising
315ms  1.04   0.00    face        Overshoot peak
400ms  1.01   0.00    face        Settling
450ms  1.00   0.00    face        Idle resumed
```

## Edge Cases

**Grab during blink:**
- Blink immediately paused (uBlinkMix frozen)
- Expression switches to ughh.png
- On release, blink cycle resets (fresh start)

**Hover + grab simultaneously:**
- Grab takes priority (ughh.png overrides ohh.png)
- Hover scale disabled (grab scale takes over)
- On release, hover expression returns if still hovering

**Mouse leaves while grabbed:**
- Auto-release triggered (same as mouseup)
- Cursor returns to default
- Release animation plays normally

**Rapid click (grab → release → grab):**
- Each transition respects its own timing
- No jarring cuts (animations overlap smoothly)
- Expression blends continuously

## Troubleshooting

**Issue: Grab doesn't trigger**
- Check that ughh.png exists at `/public/hero/ughh.png`
- Verify onPointerDown event is firing (check console)
- Ensure isGrabbed state is updating

**Issue: No squish (just shrinks uniformly)**
- Check undershoot value (should be LESS than target)
- Verify two-phase timing (60/40 split)
- Ensure smoothstep easing is applied

**Issue: No springy release**
- Check overshoot value (should be MORE than 1.0)
- Verify two-phase timing (70/30 split)
- Test with exaggerated values (1.15 overshoot)

**Issue: Strand doesn't follow**
- Verify StrandPlane receives isGrabbed prop
- Check that position calc matches FacePlane
- Ensure grabPositionY is applied to position.y

**Issue: Blink happens during grab**
- Check that blink condition includes `&& !isGrabbed`
- Verify grabExpressionMix check (`&& grabExpressionMix.current === 0`)

## Future Enhancements

1. **Drag motion:** Track mouse position while grabbed, move face with cursor
2. **Shake on grab:** Small rapid oscillation at grab moment
3. **Sound effect:** "oof" sound on grab, "phew" on release
4. **Sweat drops:** Particle effect spawned during held state
5. **Recovery animation:** Small breathing cycle after release before resuming normal
6. **Double-click reaction:** Different expression (even more strained)

## Code Location

All grab logic located in:
- **Constants:** Lines 38-46 (tunable values)
- **Shader:** Lines 82-99 (uTexGrab, uGrabMix)
- **FacePlane:** Lines ~130-250 (grab state machine)
- **StrandPlane:** Lines ~380-450 (grab position sync)
- **Scene:** Lines ~560-600 (mouse event handlers)
