# Natural Bounce - Visual Guide

## The Bounce Cycle

```
                    ╭─────╮  ← TOP (stretch)
                   ╱       ╲   scaleY: 1.04
                  │         │  scaleX: 0.97
                 │           │ (tall & narrow)
                 │           │ HANG TIME (lingers here)
                │             │
               │               │
              │                 │
             │                   │ ← MIDDLE (neutral)
            │                     │  scale: 1.0, 1.0
           │                       │ (normal proportions)
          │                         │ FAST (accelerates)
         │                           │
        │                             │
       ╱                               ╲
      ╱                                 ╲ ← BOTTOM (squash)
    ═════════════════════════════════════  scaleY: 0.95
           ╲                   ╱          scaleX: 1.04
            ╲                 ╱           (flat & wide)
             ─────────────────            "impact" compression

```

## Motion Path (Top View)

```
Traditional Circular Motion (OLD):        New Organic Bounce (NEW):
       ╭───╮                                    ╱╲
      ╱     ╲                                  ╱  ╲  ← Irregular
     │   •   │  ← Perfect circle             ╱    ╲    vertical
      ╲     ╱                                │  •   │   emphasis
       ╰───╯                               ╱        ╲
                                          ╱            ╲ ← Independent
   (mechanical, paired axes)                            horizontal drift
                                         (organic, independent axes)
```

## Squash & Stretch Examples

### Subtle (Realistic)
```
Bottom:  ▔▔▔▔▔▔▔    Top:   ╷╷╷╷╷╷
         ▁▁▁▁▁▁▁           ╰╰╰╰╰╰
```

### Moderate (Default - Elastic)
```
Bottom:  ▔▔▔▔▔▔▔▔    Top:   ║║║║║║
         ▁▁▁▁▁▁▁▁           ╰╰╰╰╰╰
```

### Extreme (Cartoon)
```
Bottom:  ▔▔▔▔▔▔▔▔▔▔    Top:   ║║║
         ▁▁▁▁▁▁▁▁▁▁           ╰╰╰
```

## Layer Visualization

```
┌─────────────────────────────────────────┐
│  GROUP (Hover Scale)                    │
│  ┌───────────────────────────────────┐  │
│  │ FACE PLANE                        │  │
│  │  • Position: Bounce (X, Y)        │  │
│  │  • Scale: Squash/Stretch          │  │
│  │  • Shader: Blink crossfade        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ STRAND PLANE (z: 0.01)           │  │
│  │  • Position: SAME as face        │  │
│  │  • Scale: Neutral (1, 1, 1)      │  │
│  │  • Shader: Vertex bending        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Timeline (One Full Bounce Cycle - 2.7s)

```
Time:    0s      0.7s     1.35s    2.0s     2.7s
         │        │         │        │        │
Position: bottom → rising → top → falling → bottom
         
ScaleY:  0.95  →  1.0   →  1.04  →  1.0   →  0.95
ScaleX:  1.04  →  1.0   →  0.97  →  1.0   →  1.04

Speed:   slow  → FAST   →  slow  → FAST   →  slow
         (squashed)     (stretched)       (squashed)
         
         ▔▔▔▔▔     ▌▌▌▌     ║║║║     ▌▌▌▌     ▔▔▔▔▔
         ▁▁▁▁▁               ╰╰╰╰              ▁▁▁▁▁
```

## Easing Curve (Vertical Motion)

```
     ^  Position
     │
 1.0 │         ╭─────────╮  ← TOP (hang time - stays longer)
     │       ╱             ╲
     │     ╱                 ╲
     │   ╱                     ╲
 0.0 │ ╱                         ╲  ← MIDDLE (fast transition)
     │╱                           ╲
-1.0 │▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│
     └─────────────────────────────> Time
     0s                          2.7s

Linear sine (boring):     Eased with hang time (natural):
      ╱╲                          ╱──╲
     ╱  ╲                        ╱    ╲
    ╱    ╲                      ╱      ╲
   ╱      ╲                    ╱        ╲
  ╱        ╲                  ╱          ╲
```

## Horizontal vs Vertical Motion

```
Horizontal (X):                  Vertical (Y):
   ~4px amplitude                  ~10px amplitude
   3.8s period                     2.7s period
   Phase: +1.2 rad                 Phase: 0
   
   ╭──╮                            ╭──────╮
  ╱    ╲                          ╱        ╲
 ╱      ╲                        ╱          ╲
╱        ╰                      ╱            ╰

RESULT: NOT synchronized → independent feel → organic
```

## Combined Effect (Actual Path)

```
Y ^
  │     ╱╲
  │    ╱  ╲
  │   ╱    ╲     ← Tall loop
  │  │      │
  │  │  •   │
  │   ╲    ╱
  │    ╲  ╱      ← Wide base
  │     ╲╱
  └────────────> X

NOT a perfect ellipse!
Irregular shape due to:
- Different periods (2.7s vs 3.8s)
- Phase offset (+1.2 rad)
- Layered secondary waves
- Custom easing on Y only
```

## What Each Constant Controls

```
BOUNCE_VERTICAL_PRIMARY_AMPLITUDE
├─ How HIGH the bounce goes
└─ Larger = more dramatic motion

BOUNCE_VERTICAL_PRIMARY_PERIOD
├─ How FAST the bounce repeats
└─ Smaller = quicker, energetic

BOUNCE_HORIZONTAL_AMPLITUDE
├─ How FAR the horizontal drift
└─ Larger = more side-to-side sway

SQUASH_SCALE_Y_MIN (e.g., 0.95)
├─ How FLAT at bottom
└─ Smaller = more squashed (0.85 = extreme)

SQUASH_SCALE_X_MAX (e.g., 1.04)
├─ How WIDE at bottom
└─ Larger = more spread out (1.15 = extreme)
```

## Feel Guide

```
Subtle       Moderate      Pronounced    Extreme
───────      ────────      ──────────    ───────
  │            │▌│            ║│║          ╠═╣
  │            │▌│            ║│║          ╠═╣
  
Realistic    Default        Elastic      Cartoon
```

## Before vs After

### BEFORE (Simple Circular Motion):
```
• Mechanical left-right sway
• Small vertical bob (2x frequency)
• No deformation (rigid)
• Perfect ellipse path
• Felt robotic/metronome-like
```

### AFTER (Natural Bounce with Squash/Stretch):
```
✓ Elastic vertical bounce (main motion)
✓ Independent horizontal drift
✓ Squash/stretch deformation (weight)
✓ Irregular, organic path
✓ Hang time at apex (physics)
✓ Breathing, alive feel
```

## Testing Checklist

Visual checks:
- [ ] Face bounces up and down (vertical emphasis)
- [ ] Face squashes flat at bottom
- [ ] Face stretches tall at top
- [ ] Face returns to normal in middle
- [ ] Horizontal drift is subtle and independent
- [ ] Motion doesn't feel like perfect loop
- [ ] Strand moves WITH face (same position)
- [ ] Strand doesn't squash (neutral scale)
- [ ] Blink still works during bounce
- [ ] Hover scale works on top of squash/stretch

Feel checks:
- [ ] Feels elastic/soft (not rigid)
- [ ] Has weight (not floating)
- [ ] Lingers at top (hang time)
- [ ] Moves fast through middle
- [ ] Looks organic (not mechanical)
- [ ] Pleasant to watch for 30+ seconds
