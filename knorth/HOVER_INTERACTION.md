# Hover Interaction - Implementation Details

## Overview
The character has an interactive hover effect that enlarges it smoothly while maintaining all ongoing animations (blink, bounce, sway).

## How It Works

### Technical Implementation

**1. Group-Based Scaling**
- Both `FacePlane` and `StrandPlane` are wrapped in a THREE.Group
- The group handles all hover interactions and scaling
- Individual planes continue their animations independently

**2. Smooth Scale Transition**
- Uses linear interpolation (lerp) for smooth scaling
- Formula: `current += (target - current) × delta × speed`
- Speed factor: 5 (tunable via `HOVER_TRANSITION_SPEED`)
- Result: Natural ease-in/ease-out effect without explicit easing curves

**3. Pointer Events**
```typescript
<group
  onPointerEnter={handlePointerEnter}  // Mouse enters character bounds
  onPointerLeave={handlePointerLeave}  // Mouse leaves character bounds
  onClick={handleClick}                 // Click to navigate
>
```

**4. Multi-Layer Animation**
The character maintains THREE simultaneous animation layers:
- **Layer 1:** Blink reflex (texture crossfade)
- **Layer 2:** Head bounce (position offset)
- **Layer 3:** Hover scale (group scale) ← NEW

All layers run independently and combine seamlessly.

## User Experience Flow

### Idle State (No Hover)
- Character scale: 1.0 (100%)
- Cursor: default
- Hint text: hidden (opacity: 0)
- Animations: blink + bounce running

### Hover State
1. **Mouse enters character →**
   - Scale smoothly increases to 1.15 (115%)
   - Cursor changes to pointer
   - "Click to enter" hint fades in (300ms transition)
   - All animations continue (blink, bounce still active)

2. **While hovering:**
   - Character appears slightly larger but still bounces
   - Smooth breathing motion maintained
   - Blinks still occur naturally
   - Visual feedback: user knows it's interactive

3. **Mouse leaves character →**
   - Scale smoothly decreases back to 1.0
   - Cursor returns to default
   - Hint text fades out

### Click Interaction
- **Click on character** → Navigate to `/home` page
- Instant navigation (no delay)
- Can be replaced with custom interaction later

## Tuning Constants

```typescript
HOVER_SCALE = 1.15              // Target scale on hover (1.0 = normal)
HOVER_TRANSITION_SPEED = 5      // Lerp speed (higher = faster transition)
```

### Effect of Different Values

**HOVER_SCALE:**
- `1.05` - Subtle, barely noticeable
- `1.10` - Gentle enlargement
- `1.15` - Clear visual feedback (default)
- `1.20` - Bold, attention-grabbing
- `1.30+` - Excessive, may feel jarring

**HOVER_TRANSITION_SPEED:**
- `2` - Very slow, floaty transition (~1s)
- `5` - Smooth, natural speed (default, ~300ms)
- `8` - Quick, responsive (~150ms)
- `12+` - Near-instant (loses smooth feel)

## Visual Polish Details

### Cursor Feedback
```typescript
document.body.style.cursor = 'pointer';  // On hover
document.body.style.cursor = 'default';  // On leave
```
Sets global cursor (not just canvas) for consistent UX.

### Hint Text Animation
```html
<div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
  Click to enter
</div>
```
- Positioned bottom-center
- Only visible on hover
- Smooth 300ms fade
- Non-intrusive styling (white/70% opacity)

## Animation Preservation

**Critical:** The hover scale is applied to the GROUP, not individual meshes.

Why this matters:
- ✅ Head bounce still animates (position updates on individual meshes)
- ✅ Blink still works (shader uniforms on FacePlane)
- ✅ Strand still sways (vertex shader on StrandPlane)
- ✅ Everything scales together as one cohesive unit

**What would break this:**
- ❌ Scaling individual meshes → desync between face and strand
- ❌ Stopping animations on hover → feels dead/frozen
- ❌ Instant scale change → jarring, mechanical feel

## Performance Notes

### Frame Budget
- Hover detection: negligible (event-based)
- Scale lerp: runs every frame but very cheap (one multiplication per frame)
- No additional render passes or shader complexity
- Total overhead: <0.1ms per frame

### Interaction Latency
- Hover detection: immediate (browser-level event)
- Scale transition: starts same frame
- Visual feedback: <16ms (one frame at 60fps)
- Feels instant to users

## Future Enhancement Ideas

### Possible Additions
1. **Scale overshoot:** Briefly scale to 1.18, then settle to 1.15 (bounce effect)
2. **Rotation:** Slight tilt toward mouse position
3. **Eye tracking:** Eyes look at cursor position
4. **Click animation:** Quick scale pulse on click (1.15 → 1.2 → navigate)
5. **Sound effects:** Subtle sound on hover/click
6. **Particles:** Spawn sparkles around character on hover

### Implementation Example (Scale Overshoot)
```typescript
const targetScale = isHovered ? HOVER_SCALE + 0.03 * Math.sin(time * 10) : 1.0;
```
Creates a subtle oscillation on hover for extra life.

## Accessibility Considerations

### Keyboard Navigation
Currently mouse-only. To add keyboard support:
```typescript
<group
  tabIndex={0}
  onPointerEnter={handlePointerEnter}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
>
```

### Motion Sensitivity
For users with motion sensitivity, consider adding a reduced-motion check:
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOVER_TRANSITION_SPEED = prefersReducedMotion ? 15 : 5; // Instant vs smooth
```

### Screen Readers
Add ARIA label to canvas for accessibility:
```html
<Canvas aria-label="Interactive character - click to enter site">
```

## Testing Checklist

- [ ] Hover works on desktop (mouse)
- [ ] Hover works on touch devices (tap)
- [ ] Scale transition is smooth (no jitter)
- [ ] Bounce animation continues while hovered
- [ ] Blink still occurs while hovered
- [ ] Cursor changes to pointer
- [ ] Hint text fades in/out correctly
- [ ] Click navigates to /home
- [ ] No console errors on rapid hover/leave
- [ ] Works on multiple browsers (Chrome, Firefox, Safari)
