# Hover Expression - Surprised "Ohh" Face

## Overview
When the mouse hovers over the character, the face smoothly transitions from the normal idle expression to a surprised "ohh" face (open mouth, wide eyes) using `ohh.png`. All other animations (bounce, squash/stretch, strand sway) continue running seamlessly.

## How It Works

### Texture Loading
The component now loads **four** textures:
1. `face.png` - Normal idle face (eyes open, mouth closed)
2. `bleft.png` - Left eye wink
3. `bright.png` - Right eye wink  
4. `ohh.png` - Surprised expression (NEW)

### Shader-Based Crossfade
The fragment shader handles **two simultaneous blends**:

```glsl
// Layer 1: Blend normal face with blink (if blinking)
baseWithBlink = mix(base, blink, uBlinkMix);

// Layer 2: Blend result with surprised face (if hovering)
final = mix(baseWithBlink, hover, uHoverMix);
```

**Blending Priority:**
1. Start with base face
2. Apply blink if currently blinking
3. Apply hover expression on top

This means:
- ✅ When hovering, you see the surprised face
- ✅ When not hovering but blinking, you see the blink
- ✅ Smooth crossfade between all states

### Hover Transition

**Smooth Lerp Animation:**
```typescript
const targetHover = isHovered ? 1 : 0;
hoverTransition.current += (targetHover - hoverTransition.current) * delta * 8;
```

- **Speed:** 8 (fast but smooth)
- **Result:** ~125ms transition time
- **Feel:** Quick reaction, responsive to mouse

### Blink Behavior During Hover

**Paused When Surprised:**
- Blinking is **disabled** while hovering (surprised face doesn't blink)
- Blink state machine pauses in 'idle' mode
- When hover ends, blinking resumes from fresh cycle
- No mid-blink interruption (clean state management)

**Logic:**
```typescript
if (!isHovered && hoverTransition.current < 0.1) {
  // Normal blink state machine runs
} else {
  // Reset to idle, pause blinking
}
```

## Animation Layers (All Active)

```
┌─────────────────────────────────────────────┐
│ GROUP SCALE (Hover)                         │
│  Multiplier: 1.0 → 1.15 on hover           │
├─────────────────────────────────────────────┤
│ FACE PLANE                                  │
│  ┌─────────────────────────────────────┐   │
│  │ Position: Bounce (X, Y, rotation)   │   │
│  │ Scale: Squash/Stretch (tied to Y)   │   │
│  │ Shader Layer 1: Blink crossfade     │   │
│  │ Shader Layer 2: Hover expression ★  │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ STRAND PLANE                                │
│  Position: Same as face                     │
│  Scale: Neutral                             │
│  Shader: Vertex bending (independent)       │
└─────────────────────────────────────────────┘
```

## User Experience Flow

### Hover Enter
1. **Mouse enters character bounds** →
2. `isHovered` state becomes `true` →
3. `hoverTransition.current` smoothly animates 0 → 1 (~125ms) →
4. Shader blends `face.png` → `ohh.png` →
5. Blink state machine pauses →
6. Group scale enlarges to 115% →
7. Cursor changes to pointer →
8. "Click to enter" hint fades in

**Visual Result:** Character reacts with surprise! 😮

### Hover Exit
1. **Mouse leaves character bounds** →
2. `isHovered` state becomes `false` →
3. `hoverTransition.current` smoothly animates 1 → 0 (~125ms) →
4. Shader blends `ohh.png` → `face.png` →
5. Blink state machine resumes from new cycle →
6. Group scale returns to 100% →
7. Cursor returns to default →
8. "Click to enter" hint fades out

**Visual Result:** Character returns to calm idle state

## Technical Details

### Shader Uniforms

```typescript
uniforms: {
  uTexBase: { value: faceTexture },      // Normal face
  uTexBlink: { value: currentBlinkTex }, // Current blink (bleft/bright)
  uTexHover: { value: ohhTexture },      // Surprised face ★
  uBlinkMix: { value: 0 },               // 0-1, blink blend amount
  uHoverMix: { value: 0 },               // 0-1, hover blend amount ★
}
```

### State Management

**Hover Transition (useRef):**
- Persists across renders
- Updates every frame via `useFrame`
- Smooth lerp interpolation
- Clamped to [0, 1] range

**Blink State Machine:**
- Paused when `isHovered === true`
- Also paused when `hoverTransition > 0.1` (prevents mid-transition blinks)
- Reset to 'idle' when hovering starts
- Schedules new blink cycle when hover ends

### Performance

**No Additional Cost:**
- One extra texture load (ohh.png) - 1-time cost at init
- One extra uniform (uHoverMix) - negligible GPU overhead
- Lerp calculation per frame - < 0.01ms CPU
- Shader mix operation - free (already doing blink mix)

**Total overhead:** Effectively zero

## Tuning

### Transition Speed
```typescript
const transitionSpeed = 8; // Current value

// Options:
5  - Slower, more gradual (~200ms)
8  - Balanced, responsive (~125ms) ← Default
12 - Very fast, snappy (~80ms)
15 - Near-instant (~50ms)
```

### Hover Expression
To use a different expression:
1. Replace `/hero/ohh.png` with your image
2. Ensure same canvas size (1563×1563)
3. Transparent background
4. No code changes needed!

### Blink Resume Behavior
Currently: Fresh cycle after hover ends

To resume mid-cycle instead:
```typescript
// Don't reset nextReflexTime when hover ends
// Comment out this line:
// nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
```

## Asset Requirements

**ohh.png Specifications:**
- ✅ Size: 1563×1563 canvas (same as face.png)
- ✅ Format: PNG with transparency
- ✅ Content: Surprised expression (wide eyes, open mouth)
- ✅ Alignment: Centered on canvas, matching face.png position
- ✅ Location: `/public/hero/ohh.png`

**Design Tips:**
- Eyes should be noticeably wider than normal face
- Mouth should be open (O-shape)
- Eyebrows raised (if visible)
- Overall expression: surprise, curiosity, or excitement

## Troubleshooting

**Issue: Expression doesn't change on hover**
- Check that ohh.png exists at `/public/hero/ohh.png`
- Verify texture is loading (check browser console)
- Check `isHovered` prop is being passed to FacePlane

**Issue: Transition is too slow/fast**
- Adjust `transitionSpeed` constant (line 8 in transition logic)
- Higher = faster, lower = slower

**Issue: Blink happens during hover**
- Check that `!isHovered` condition is working
- Verify `hoverTransition.current < 0.1` check exists
- May be mid-transition - this is expected and correct

**Issue: Jagged/flickering transition**
- Ensure textures have same dimensions
- Check that transparency is properly set
- Verify antialiasing is enabled on Canvas

## Visual Examples

### State Transitions

```
Normal Idle:        Hovering:          Blink (no hover):
   ● ●                 ◉ ◉                •   •
    -                   O                  -
 (face.png)         (ohh.png)       (bleft.png/bright.png)
 uHoverMix: 0       uHoverMix: 1      uBlinkMix: 1
```

### Timeline (Hover Event)

```
Time:     0ms      50ms     125ms    (hover duration)    125ms    250ms
Event:    Enter →  ................ Stay ............... → Exit
          
uHoverMix: 0    →   0.4   →   1.0   →   1.0   →   0.6   →   0.0
Expression: face .......... ohh .......... ohh .......... face
Blink:     on   →    pausing  →  paused  →  paused  →  resuming → on
Scale:    1.0   →    1.06  →  1.15   →  1.15   →  1.08  →  1.0
```

## Future Enhancements

**Possible Additions:**
1. **Multiple hover expressions:** Randomize between 2-3 surprised faces
2. **Hover duration state:** Different expression if hovering >2 seconds
3. **Click expression:** Brief "excited" face on click before navigate
4. **Hover follow:** Eyes track mouse position within bounds
5. **Sound effect:** Subtle "oh!" sound on first hover

**Example - Click Expression:**
```typescript
const [clickState, setClickState] = useState(false);
// Add uClickMix uniform
// Blend: base → blink → hover → click
// Trigger on handleClick, auto-reset after 200ms
```
