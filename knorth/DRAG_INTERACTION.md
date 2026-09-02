# Drag Interaction - "Ughh" Resistance Animation

## Overview
Users can **click and drag** the character around the screen. The character **resists** being pulled, showing a strained "ughh" face expression, shrinking in size, and shivering/shaking as if struggling against the pull.

## User Experience

### Interaction Flow

**1. Idle State (No Interaction)**
- Character bounces naturally with squash/stretch
- Normal face.png expression
- Smooth breathing motion
- Cursor: default

**2. Hover (Mouse Over, Not Dragging)**
- Face instantly switches to ohh.png (surprised)
- Character enlarges to 115%
- Bounce animation continues
- Cursor: grab (👋)

**3. Drag Start (Mouse Down)**
- Face instantly switches to ughh.png (strained)
- Character shrinks to 88% size (grabbed/compressed)
- Bounce animation STOPS
- Shivering/shaking starts immediately
- Cursor: grabbing (✊)

**4. While Dragging**
- Character follows mouse with **resistance**
  - Doesn't move as far as cursor (35% resistance)
  - Smooth spring-like following motion
- Continuous shivering (fast, jittery shaking)
  - Horizontal shake
  - Vertical shake (80% of horizontal intensity)
  - Rotational shake (50% of horizontal intensity)
- Ughh face stays visible
- All normal animations paused

**5. Drag Release (Mouse Up)**
- Ughh face stays until character returns to origin
- Character springs back to center (smooth elastic return)
- Shivering gradually stops as it returns
- Size returns to normal (88% → 100%)
- Bounce animation resumes
- Cursor: grab (if still hovering) or default

**6. Click (No Drag Movement)**
- If pointer down→up without significant movement
- Navigates to /home page
- Works same as before

## Technical Implementation

### Drag Physics

**Resistance System:**
```typescript
const pullX = cursorX - startX;
const pullY = cursorY - startY;

// Apply resistance (character doesn't move full distance)
const targetX = pullX * (1 - DRAG_RESISTANCE); // 0.35 resistance
const targetY = pullY * (1 - DRAG_RESISTANCE);

// Smooth spring following
characterX += (targetX - characterX) * delta * 8;
characterY += (targetY - characterY) * delta * 8;
```

**Result:**
- If you drag cursor 100px right → character moves ~65px right
- Creates "weight" and resistance feel
- Character lags behind cursor naturally

**Spring Return (On Release):**
```typescript
// Gradually return to origin (0, 0)
characterX += (0 - characterX) * delta * DRAG_SPRING_STIFFNESS; // 0.08
characterY += (0 - characterY) * delta * DRAG_SPRING_STIFFNESS;
```

**Result:**
- Smooth elastic return to center
- Not instant snap back
- Natural spring physics

### Shivering Animation

**Multi-Frequency Shake:**
```typescript
const time = currentTime * SHIVER_FREQUENCY; // 35 Hz

shiverX = sin(time × 2.7) × SHIVER_AMPLITUDE;
shiverY = cos(time × 3.1) × SHIVER_AMPLITUDE × 0.8;
shiverRotation = sin(time × 2.3) × SHIVER_AMPLITUDE × 0.5;
```

**Why Multiple Frequencies:**
- 2.7, 3.1, 2.3 multipliers create irregular shaking
- Not synchronized = more organic, nervous shake
- Prevents perfect circular motion

**Amplitude Scaling:**
- Horizontal: 100% (most visible)
- Vertical: 80% (less movement)
- Rotation: 50% (subtle tilt)

**Result:** Fast, jittery, nervous shaking that looks like resistance/strain

### Expression Priority

**Shader Blending Order:**
```
1. Base (face.png)
2. + Blink (bleft/bright) if blinking
3. + Hover (ohh.png) if hovering AND not dragging
4. + Drag (ughh.png) if dragging (HIGHEST PRIORITY)
```

**Drag Always Wins:**
- Even if hovering when drag starts
- Ughh face overrides ohh face
- No blinking while dragging

## Tuning Constants

### Resistance & Feel

```typescript
DRAG_RESISTANCE = 0.35  // Default

0.0  - No resistance (follows cursor exactly) - too responsive
0.2  - Light resistance (moves 80% of cursor distance) - floaty
0.35 - Moderate resistance (moves 65% of cursor distance) ← Default, balanced
0.5  - Heavy resistance (moves 50% of cursor distance) - very stiff
0.7  - Strong resistance (moves 30% of cursor distance) - barely moves
1.0  - Infinite resistance (doesn't move at all) - stuck
```

### Scale When Grabbed

```typescript
DRAG_SCALE_MIN = 0.88  // Default

0.95 - Barely shrinks (subtle)
0.88 - Noticeable shrink ← Default
0.80 - Significant compression
0.70 - Very squished
```

### Shivering Intensity

```typescript
SHIVER_AMPLITUDE = 0.012  // Default

0.005 - Subtle tremble
0.012 - Noticeable shake ← Default
0.020 - Vigorous shaking
0.030 - Extreme jittering
```

### Shivering Speed

```typescript
SHIVER_FREQUENCY = 35  // Hz, Default

20  - Slow wobble
35  - Fast nervous shake ← Default
50  - Very rapid jitter
70+ - Blur/vibration effect
```

### Spring Return Speed

```typescript
DRAG_SPRING_STIFFNESS = 0.08  // Default

0.03 - Very slow return (~3-4 seconds)
0.08 - Moderate spring ← Default (~1-2 seconds)
0.15 - Quick snap back (~0.5 seconds)
0.30 - Very fast return (instant feel)
```

## Animation State Machine

```
┌─────────────────────────────────────────────────────────┐
│                      IDLE                                │
│  • Bounce animation                                      │
│  • Squash/stretch                                        │
│  • Blink reflex                                          │
│  • Face: face.png                                        │
│  • Scale: normal (1.0)                                   │
└────────────┬───────────────────────────┬─────────────────┘
             │ Mouse Enter               │
             ▼                           │
┌─────────────────────────────────────┐  │
│          HOVER                      │  │
│  • Bounce continues                 │  │
│  • Face: ohh.png (surprised)        │  │
│  • Scale: enlarged (1.15)           │  │
│  • Cursor: grab                     │  │
└────────────┬────────────────────────┘  │
             │ Mouse Down                │
             ▼                           │
┌─────────────────────────────────────┐  │
│          DRAGGING                   │  │
│  • Face: ughh.png (strained)        │  │
│  • Scale: shrunk (0.88)             │  │
│  • Position: follows mouse          │  │
│  • Shivering: active                │  │
│  • Bounce: PAUSED                   │  │
│  • Blink: PAUSED                    │  │
│  • Cursor: grabbing                 │  │
└────────────┬────────────────────────┘  │
             │ Mouse Up                  │
             ▼                           │
┌─────────────────────────────────────┐  │
│       RETURNING TO IDLE             │  │
│  • Position: spring back to origin  │  │
│  • Scale: grow back to 1.0          │  │
│  • Shivering: fading out            │  │
│  • Face: ughh.png → face.png        │  │
│  • Bounce: resumes                  │  │
└─────────────────────────────────────┘  │
             │                           │
             │ Reached origin            │
             └───────────────────────────┘
```

## Cursor States

```
State        Cursor        Visual
─────────────────────────────────────
Idle         default       →
Hover        grab          👋
Dragging     grabbing      ✊
Returning    grab          👋
```

## Performance Notes

**Drag Tracking:**
- Event-based (onPointerMove)
- No polling/checking every frame
- Only updates when mouse moves
- Minimal CPU overhead

**Shivering Calculation:**
- 3 sine calculations per frame
- < 0.05ms per frame
- Negligible performance impact

**Spring Physics:**
- Simple lerp interpolation
- No complex physics engine
- Runs smoothly at 60fps

**Total Overhead:**
- Drag state: ~0.1ms per frame
- Barely measurable impact

## Asset Requirements

**ughh.png Specifications:**
- ✅ Size: 1563×1563 canvas (same as other faces)
- ✅ Format: PNG with transparency
- ✅ Expression: Strained, struggling (squinted eyes, grimacing mouth)
- ✅ Alignment: Centered, matching face.png position
- ✅ Location: `/public/hero/ughh.png`

**Design Tips for Ughh Face:**
- Eyes: Squinted or closed tight (strain)
- Mouth: Grimacing, teeth clenched, or "ugh" shape
- Eyebrows: Furrowed/stressed
- Overall: Uncomfortable, resisting, strained
- Think: Lifting something heavy, pulling hard

## Troubleshooting

**Issue: Character moves too far/too little**
- Adjust `DRAG_RESISTANCE` constant
- Higher = less movement (more resistance)
- Lower = more movement (less resistance)

**Issue: Shivering too subtle/intense**
- Adjust `SHIVER_AMPLITUDE` for intensity
- Adjust `SHIVER_FREQUENCY` for speed

**Issue: Character snaps back too fast/slow**
- Adjust `DRAG_SPRING_STIFFNESS`
- Higher = faster return
- Lower = slower, more elastic return

**Issue: Click navigates even when dragging**
- This is prevented by checking `if (!isDragging)` in onClick
- If it happens, increase drag detection threshold

**Issue: Shivering looks mechanical**
- Check that multiple frequencies (2.7, 3.1, 2.3) are in place
- Ensure amplitudes are scaled differently (1.0, 0.8, 0.5)

## Future Enhancements

**Possible Additions:**
1. **Velocity-based shiver:** Shake more when dragging faster
2. **Direction-aware expression:** Face looks toward drag direction
3. **Stretch on drag:** Elongate character in pull direction
4. **Sound effects:** Grunt sound when grabbed, sigh on release
5. **Particle effects:** Sweat drops while dragging
6. **Fatigue system:** If dragged too long, character goes limp
7. **Multi-touch:** Support touch devices for mobile drag

**Example - Velocity-Based Shiver:**
```typescript
const dragVelocity = Math.sqrt(velocityX² + velocityY²);
const intensityMultiplier = 1 + dragVelocity * 2;
shiverAmplitude = SHIVER_AMPLITUDE * intensityMultiplier;
```

## Comparison: Hover vs Drag

```
Feature              Hover          Drag
─────────────────────────────────────────────
Face Expression      ohh.png        ughh.png
Scale                115%           88%
Bounce Animation     Active         Paused
Position             Fixed          Follows Mouse
Extra Motion         None           Shivering
Cursor               grab           grabbing
Priority             Medium         Highest
```

## Visual Examples

### Expression States

```
Idle:              Hover:           Drag:
  ● ●               ◉ ◉              ╳ ╳
   -                 O                ︷
(face.png)        (ohh.png)       (ughh.png)
  100%              115%             88%
  bounce            bounce          shiver
```

### Drag Resistance Visualization

```
Cursor Position:    ────────────────→ (100px right)
                    
Character Position: ─────────→        (65px right)
(35% resistance)    
                    ↑
                    Resistance gap
                    (35px)
```

### Shivering Pattern

```
Time: ─────────────────────────────────→

X:    ╱╲╱╲╱╲╱╲╱╲  (sine 2.7)
Y:    ∩∪∩∪∩∪∩∪    (cosine 3.1)
Rot:  ⟨⟩⟨⟩⟨⟩⟨⟩    (sine 2.3)

Combined = Irregular, jittery shake
```
