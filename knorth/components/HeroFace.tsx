"use client";

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

// ============= TIMING CONSTANTS =============
// Blink timing
const BLINK_REFLEX_INTERVAL = 3000; // ms - wait time before starting a new blink reflex cycle
const BLINK_GAP = 200; // ms - gap between first eye blink and second eye blink (faster)
const BLINK_DURATION = 80; // ms (one-way fade - faster, smoother)

// Strand sway (independent internal motion)
const SWAY_AMPLITUDE = 0.015; // horizontal displacement at tip (relative units)
const SWAY_PERIOD = 3.5; // seconds per full cycle
const SWAY_SECONDARY_AMPLITUDE = 0.006; // layered irregularity
const SWAY_SECONDARY_PERIOD = 5.2; // seconds

// Natural bounce motion (position)
const BOUNCE_VERTICAL_PRIMARY_AMPLITUDE = 0.06; // ~6px vertical movement (more subtle)
const BOUNCE_VERTICAL_SECONDARY_AMPLITUDE = 0.015; // ~1.5px (layered irregularity)
const BOUNCE_VERTICAL_PRIMARY_PERIOD = 1.8; // seconds per full cycle (primary)
const BOUNCE_VERTICAL_SECONDARY_PERIOD = 3.2; // seconds (secondary, offset frequency)
const BOUNCE_HORIZONTAL_AMPLITUDE = 0.025; // ~2.5px horizontal drift (subtle)
const BOUNCE_HORIZONTAL_PERIOD = 2.5; // seconds (offset from vertical, not paired)
const BOUNCE_ROTATION_AMPLITUDE = 0.03; // subtle rotation (radians, ~1.7 degrees)

// Squash and stretch (scale tied to vertical position) - more subtle, natural
const SQUASH_SCALE_Y_MIN = 0.97; // scaleY at lowest point (gentle squash)
const SQUASH_SCALE_X_MAX = 1.02; // scaleX at lowest point (gentle widen)
const STRETCH_SCALE_Y_MAX = 1.02; // scaleY at highest point (gentle stretch)
const STRETCH_SCALE_X_MIN = 0.98; // scaleX at highest point (gentle narrow)

// Hover interaction
const HOVER_SCALE = 1.15; // scale multiplier on hover
const HOVER_TRANSITION_SPEED = 5; // lerp speed for smooth scale transition

// Grab interaction
const GRAB_SCALE_TARGET = 0.88; // target scale when grabbed (~12% smaller)
const GRAB_SCALE_UNDERSHOOT = 0.84; // undershoot during grab snap (~16% smaller at peak)
const GRAB_SCALE_DURATION = 550; // ms - duration of grab scale animation
const GRAB_POSITION_DIP_PEAK = -0.20; // ~20px downward at peak (negative = down)
const GRAB_POSITION_DIP_REST = -0.06; // ~6px downward while held (residual offset)
// Release spring (rubber-band rebound)
const GRAB_RELEASE_DURATION = 650;       // ms — total spring animation window
const SPRING_STIFFNESS = 200;            // higher = snappier snap-back
const SPRING_DAMPING = 14;               // lower = more bouncy (underdamped), higher = less bounce
const SPRING_SCALE_OVERSHOOT = 0.10;     // how far past 1.0 the scale springs (fraction, e.g. 0.10 = 10%)
const SPRING_POSITION_OVERSHOOT = 0.30;  // how far the Y position springs past 0 (fraction of rest offset)

// Elastic cursor-follow (while held)
const FOLLOW_DAMPING = 0.90;        // fraction of raw cursor delta applied as target (0–1, lower = more resistance)
const FOLLOW_MAX_OFFSET = 120;      // px — max radial displacement from grab origin (world units ≈ px at zoom 200)
const FOLLOW_LERP = 0.10;           // lerp factor per frame toward clamped target (lower = more lag)

// Shiver effect (tension while held)
const SHIVER_AMPLITUDE = 2.2;       // px — peak micro-jitter radius
const SHIVER_INTERVAL = 65;         // ms — how often shiver offset is randomised

// Release recoil
const RECOIL_HOLD_DURATION = 120;   // ms — hold squint expression before starting return animation
// ============================================

// Helper function: custom easing for natural breathing motion
// Input t: -1 (bottom) to +1 (top) of sine wave
// Output: eased value with gentle, breathing-like rhythm
function easeWithHangTime(t: number): number {
  // Map sine wave [-1, 1] to [0, 1] range
  const normalized = (t + 1) * 0.5;
  
  // Gentle easing with slight ease-out at peak (natural breathing)
  // Less aggressive than double smoothstep, more subtle
  const eased = normalized * normalized * normalized * (normalized * (normalized * 6 - 15) + 10);
  
  // Map back to [-1, 1]
  return eased * 2 - 1;
}

// Damped spring: returns a value that starts at 1 and oscillates toward 0.
// t: elapsed seconds, stiffness & damping: spring constants.
// Returns spring displacement (multiply by your start offset to get position/scale delta).
function dampedSpring(t: number, stiffness: number, damping: number): number {
  const omega = Math.sqrt(stiffness); // natural frequency
  const zeta = damping / (2 * omega);  // damping ratio
  if (zeta < 1) {
    // Underdamped — produces bouncy oscillation
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    return Math.exp(-zeta * omega * t) * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t));
  } else {
    // Critically / over-damped — no oscillation
    const r = -omega;
    return Math.exp(r * t) * (1 + (-r) * t);
  }
}


const blinkVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const blinkFragmentShader = `
  uniform sampler2D uTexBase;
  uniform sampler2D uTexBlink;
  uniform sampler2D uTexHover;
  uniform sampler2D uTexGrab;
  uniform float uBlinkMix;
  uniform float uHoverMix;
  uniform float uGrabMix;
  varying vec2 vUv;
  
  void main() {
    vec4 base = texture2D(uTexBase, vUv);
    vec4 blink = texture2D(uTexBlink, vUv);
    vec4 hover = texture2D(uTexHover, vUv);
    vec4 grab = texture2D(uTexGrab, vUv);
    
    // First blend base with blink (if blinking)
    vec4 baseWithBlink = mix(base, blink, uBlinkMix);
    
    // Then blend with hover expression (if hovering)
    vec4 withHover = mix(baseWithBlink, hover, uHoverMix);
    
    // Finally blend with grab expression (if grabbed) - takes priority
    gl_FragColor = mix(withHover, grab, uGrabMix);
  }
`;

// Vertex shader for natural bending strand motion
const strandVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    // Normalized distance from root (bottom = 0, top = 1)
    float heightFactor = uv.y;
    
    // Primary sway
    float primarySway = sin(uTime * ${(2.0 * Math.PI / SWAY_PERIOD).toFixed(4)}) * ${SWAY_AMPLITUDE.toFixed(4)};
    
    // Secondary irregularity
    float secondarySway = sin(uTime * ${(2.0 * Math.PI / SWAY_SECONDARY_PERIOD).toFixed(4)} + 1.3) * ${SWAY_SECONDARY_AMPLITUDE.toFixed(4)};
    
    // Combine and scale by height (root stays still, tip moves most)
    float totalSway = (primarySway + secondarySway) * heightFactor * heightFactor;
    
    vec3 pos = position;
    pos.x += totalSway;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const strandFragmentShader = `
  uniform sampler2D uTexStrand;
  varying vec2 vUv;
  
  void main() {
    gl_FragColor = texture2D(uTexStrand, vUv);
  }
`;

interface FacePlaneProps {
  isHovered: boolean;
  isGrabbed: boolean;
  /** Cursor delta from grab-start, in canvas px (updated every frame while grabbed) */
  cursorDelta: React.MutableRefObject<{ x: number; y: number }>;
}

function FacePlane({ isHovered, isGrabbed, cursorDelta }: FacePlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Load all textures including grabbed expression
  const [faceTexture, bleftTexture, brightTexture, ohhTexture, ughhTexture] = useTexture([
    '/hero/face.png',
    '/hero/bleft.png',
    '/hero/bright.png',
    '/hero/ohh.png',
    '/hero/ughh.png',
  ]);
  
  // Set texture properties
  [faceTexture, bleftTexture, brightTexture, ohhTexture, ughhTexture].forEach(tex => {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });
  
  // Blink reflex state machine
  // States: 'idle' -> 'firstBlink' -> 'gap' -> 'secondBlink' -> 'idle'
  const [blinkState, setBlinkState] = useState<'idle' | 'firstBlink' | 'gap' | 'secondBlink'>('idle');
  const [currentBlinkTex, setCurrentBlinkTex] = useState(bleftTexture);
  const blinkProgress = useRef(0);
  const stateTimer = useRef(0);
  const nextReflexTime = useRef(Date.now() + BLINK_REFLEX_INTERVAL);
  
  // Grab interaction state
  const grabExpressionMix = useRef(0); // 0 = normal, 1 = ughh.png
  const grabScale = useRef(1); // Current grab scale value
  const grabPositionY = useRef(0); // Current Y offset from grab
  const grabStartTime = useRef(0);
  const grabReleaseTime = useRef(0);
  const wasGrabbed = useRef(false);

  // Elastic cursor-follow state
  const followX = useRef(0); // current lerped X follow offset (world units)
  const followY = useRef(0); // current lerped Y follow offset
  const followReleaseStartX = useRef(0); // X position at moment of release
  const followReleaseStartY = useRef(0); // Y position at moment of release

  // Shiver state
  const shiverX = useRef(0);
  const shiverY = useRef(0);
  const lastShiverTime = useRef(0);
  
  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const now = Date.now();
    const deltaMs = delta * 1000;
    
    // ===== GRAB INTERACTION =====
    // Handle grab start
    if (isGrabbed && !wasGrabbed.current) {
      grabStartTime.current = now;
      grabReleaseTime.current = 0;
      wasGrabbed.current = true;
      // Reset follow position to 0 at grab start
      followX.current = 0;
      followY.current = 0;
    }
    
    // Handle grab release — snapshot follow position for return animation
    if (!isGrabbed && wasGrabbed.current) {
      grabReleaseTime.current = now;
      followReleaseStartX.current = followX.current;
      followReleaseStartY.current = followY.current;
      wasGrabbed.current = false;
    }

    // Instant expression switch — no fade
    const recoilElapsed = grabReleaseTime.current > 0 ? now - grabReleaseTime.current : 0;
    const recoilHolding = !isGrabbed && grabReleaseTime.current > 0 && recoilElapsed < RECOIL_HOLD_DURATION;

    if (isGrabbed || recoilHolding) {
      grabExpressionMix.current = 1; // snap to squint
    } else {
      grabExpressionMix.current = 0; // snap back to idle
    }

    // ===== ELASTIC CURSOR-FOLLOW (while held) =====
    if (isGrabbed) {
      // Convert raw cursor delta (px) to world units (camera zoom = 200 → 1 world unit = 200 px)
      const WORLD_PX = 200;
      const rawX = cursorDelta.current.x;
      const rawY = -cursorDelta.current.y; // canvas Y is flipped relative to screen Y

      // Apply resistance damping
      let targetX = rawX * FOLLOW_DAMPING / WORLD_PX;
      let targetY = rawY * FOLLOW_DAMPING / WORLD_PX;

      // Clamp to max offset radius (in world units)
      const maxWorld = FOLLOW_MAX_OFFSET / WORLD_PX;
      const dist = Math.sqrt(targetX * targetX + targetY * targetY);
      if (dist > maxWorld) {
        targetX = (targetX / dist) * maxWorld;
        targetY = (targetY / dist) * maxWorld;
      }

      // Lerp toward clamped target for spring-lag feel
      followX.current += (targetX - followX.current) * FOLLOW_LERP;
      followY.current += (targetY - followY.current) * FOLLOW_LERP;

      // Shiver: randomise micro-jitter at SHIVER_INTERVAL
      if (now - lastShiverTime.current >= SHIVER_INTERVAL) {
        const shiverWorld = SHIVER_AMPLITUDE / WORLD_PX;
        shiverX.current = (Math.random() * 2 - 1) * shiverWorld;
        shiverY.current = (Math.random() * 2 - 1) * shiverWorld;
        lastShiverTime.current = now;
      }
    } else {
      // Animate follow position back to 0 using the same spring
      if (grabReleaseTime.current > 0) {
        const effectiveElapsed = Math.max(0, recoilElapsed - RECOIL_HOLD_DURATION);
        const t = effectiveElapsed / 1000; // seconds
        const spring = dampedSpring(t, SPRING_STIFFNESS, SPRING_DAMPING);
        followX.current = followReleaseStartX.current * spring;
        followY.current = followReleaseStartY.current * spring;
      } else {
        followX.current = 0;
        followY.current = 0;
      }

      // Clear shiver when not held
      shiverX.current = 0;
      shiverY.current = 0;
    }

    // Animate grab scale and position
    let grabScaleValue = 1;
    let grabYOffset = 0;
    
    if (isGrabbed) {
      const grabElapsed = now - grabStartTime.current;
      const t = Math.min(1, grabElapsed / GRAB_SCALE_DURATION);
      
      // Easing with undershoot for squish effect
      if (t < 0.6) {
        // First 60% - snap down to undershoot
        const snapT = t / 0.6;
        const eased = snapT * snapT * (3 - 2 * snapT); // smoothstep
        grabScaleValue = 1 + (GRAB_SCALE_UNDERSHOOT - 1) * eased;
        grabYOffset = GRAB_POSITION_DIP_PEAK * eased;
      } else {
        // Last 40% - settle back up to target
        const settleT = (t - 0.6) / 0.4;
        const eased = settleT * settleT * (3 - 2 * settleT); // smoothstep
        grabScaleValue = GRAB_SCALE_UNDERSHOOT + (GRAB_SCALE_TARGET - GRAB_SCALE_UNDERSHOOT) * eased;
        grabYOffset = GRAB_POSITION_DIP_PEAK + (GRAB_POSITION_DIP_REST - GRAB_POSITION_DIP_PEAK) * eased;
      }
      
      grabScale.current = grabScaleValue;
      grabPositionY.current = grabYOffset;
    } else if (grabReleaseTime.current > 0) {
      // Delay scale/position return by the recoil hold duration
      const effectiveElapsed = Math.max(0, recoilElapsed - RECOIL_HOLD_DURATION);
      const t = effectiveElapsed / 1000; // convert to seconds for spring

      // Damped spring: starts at 1, rings toward 0
      const spring = dampedSpring(t, SPRING_STIFFNESS, SPRING_DAMPING);

      // Scale: starts at GRAB_SCALE_TARGET, springs to 1.0 with overshoot
      // spring=1 → at grabbed scale, spring=0 → at rest (1.0), spring<0 → overshoot above 1.0
      const scaleRange = 1.0 - GRAB_SCALE_TARGET;
      grabScaleValue = 1.0 - spring * scaleRange * (1 + SPRING_SCALE_OVERSHOOT);
      // Clamp so we never go below 0 (shouldn't happen with sane constants)
      grabScaleValue = Math.max(0.5, grabScaleValue);

      // Position Y: starts at GRAB_POSITION_DIP_REST, springs to 0 with overshoot
      grabYOffset = GRAB_POSITION_DIP_REST * spring * (1 + SPRING_POSITION_OVERSHOOT);

      grabScale.current = grabScaleValue;
      grabPositionY.current = grabYOffset;

      // Clear release once the spring has fully settled (spring < threshold)
      const totalDuration = RECOIL_HOLD_DURATION + GRAB_RELEASE_DURATION;
      if (recoilElapsed >= totalDuration) {
        grabReleaseTime.current = 0;
        grabScale.current = 1;
        grabPositionY.current = 0;
      }
    }
    
    // ===== HOVER EXPRESSION TRANSITION =====
    // Instant switch — disabled during grab or recoil
    const grabActive = isGrabbed || recoilHolding;
    const hoverMix = (isHovered && !grabActive) ? 1 : 0;
    
    // ===== NATURAL BOUNCE MOTION (always running — grab offsets layer on top) =====
    let easedVertical = 0;
    let horizontalDrift = 0;
    let rotation = 0;
    let scaleY = 1, scaleX = 1;
    
    if (!isGrabbed) {
      // Idle bounce runs at all times when not actively held (including during spring release)
      const primaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_PRIMARY_PERIOD));
      const secondaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_SECONDARY_PERIOD) + 0.7);
      
      easedVertical = easeWithHangTime(primaryVertical) * BOUNCE_VERTICAL_PRIMARY_AMPLITUDE +
                            secondaryVertical * BOUNCE_VERTICAL_SECONDARY_AMPLITUDE;
      
      horizontalDrift = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 1.2) * BOUNCE_HORIZONTAL_AMPLITUDE;
      rotation = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 0.5) * BOUNCE_ROTATION_AMPLITUDE;
      
      // Squash and stretch
      const verticalPosition = primaryVertical;
      
      if (verticalPosition < 0) {
        const t = Math.abs(verticalPosition);
        scaleY = 1 + (SQUASH_SCALE_Y_MIN - 1) * t;
        scaleX = 1 + (SQUASH_SCALE_X_MAX - 1) * t;
      } else {
        const t = verticalPosition;
        scaleY = 1 + (STRETCH_SCALE_Y_MAX - 1) * t;
        scaleX = 1 + (STRETCH_SCALE_X_MIN - 1) * t;
      }
    }
    
    // Apply position (bounce + grab dip + elastic follow + shiver)
    meshRef.current.position.y = easedVertical + grabPositionY.current + followY.current + (isGrabbed ? shiverY.current : 0);
    meshRef.current.position.x = horizontalDrift + followX.current + (isGrabbed ? shiverX.current : 0);
    meshRef.current.rotation.z = rotation;
    
    // Apply scale (idle squash/stretch * grab scale)
    const finalScaleY = scaleY * grabScale.current;
    const finalScaleX = scaleX * grabScale.current;
    meshRef.current.scale.set(finalScaleX, finalScaleY, 1);
    
    // ===== BLINK ANIMATION (paused only while actively held or in recoil beat) =====
    if (!isHovered && !grabActive) {
      switch (blinkState) {
        case 'idle':
          if (now >= nextReflexTime.current) {
            setBlinkState('firstBlink');
            blinkProgress.current = 0;
            setCurrentBlinkTex(bleftTexture);
          }
          materialRef.current.uniforms.uBlinkMix.value = 0;
          break;
          
        case 'firstBlink':
          blinkProgress.current += deltaMs / BLINK_DURATION;
          
          let firstMix = 0;
          if (blinkProgress.current < 1) {
            const t = blinkProgress.current;
            firstMix = t * t * t * (t * (t * 6 - 15) + 10);
          } else if (blinkProgress.current < 2) {
            const t = 2 - blinkProgress.current;
            firstMix = t * t * t * (t * (t * 6 - 15) + 10);
          } else {
            setBlinkState('gap');
            stateTimer.current = 0;
            firstMix = 0;
          }
          
          materialRef.current.uniforms.uBlinkMix.value = Math.max(0, Math.min(1, firstMix));
          break;
          
        case 'gap':
          stateTimer.current += deltaMs;
          materialRef.current.uniforms.uBlinkMix.value = 0;
          
          if (stateTimer.current >= BLINK_GAP) {
            setBlinkState('secondBlink');
            blinkProgress.current = 0;
            setCurrentBlinkTex(brightTexture);
          }
          break;
          
        case 'secondBlink':
          blinkProgress.current += deltaMs / BLINK_DURATION;
          
          let secondMix = 0;
          if (blinkProgress.current < 1) {
            const t = blinkProgress.current;
            secondMix = t * t * t * (t * (t * 6 - 15) + 10);
          } else if (blinkProgress.current < 2) {
            const t = 2 - blinkProgress.current;
            secondMix = t * t * t * (t * (t * 6 - 15) + 10);
          } else {
            setBlinkState('idle');
            nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
            secondMix = 0;
          }
          
          materialRef.current.uniforms.uBlinkMix.value = Math.max(0, Math.min(1, secondMix));
          break;
      }
      
      materialRef.current.uniforms.uTexBlink.value = currentBlinkTex;
    } else {
      // When hovering or grabbed, reset blink state
      if (blinkState !== 'idle') {
        setBlinkState('idle');
        nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
      }
      materialRef.current.uniforms.uBlinkMix.value = 0;
    }
    
    // ===== UPDATE SHADER UNIFORMS =====
    materialRef.current.uniforms.uTexBase.value = faceTexture;
    materialRef.current.uniforms.uTexHover.value = ohhTexture;
    materialRef.current.uniforms.uTexGrab.value = ughhTexture;
    materialRef.current.uniforms.uHoverMix.value = hoverMix;
    materialRef.current.uniforms.uGrabMix.value = grabExpressionMix.current;
  });
  
  const shaderMaterial = useMemo(() => ({
    uniforms: {
      uTexBase: { value: faceTexture },
      uTexBlink: { value: currentBlinkTex },
      uTexHover: { value: ohhTexture },
      uTexGrab: { value: ughhTexture },
      uBlinkMix: { value: 0 },
      uHoverMix: { value: 0 },
      uGrabMix: { value: 0 },
    },
    vertexShader: blinkVertexShader,
    fragmentShader: blinkFragmentShader,
    transparent: true,
  }), [faceTexture, currentBlinkTex, ohhTexture, ughhTexture]);
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={materialRef} {...shaderMaterial} />
    </mesh>
  );
}

function StrandPlane({ isGrabbed }: { isGrabbed?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [hasStrand, setHasStrand] = useState(false);
  
  // Grab state tracking
  const grabPositionY = useRef(0);
  const grabStartTime = useRef(0);
  const grabReleaseTime = useRef(0);
  const wasGrabbed = useRef(false);
  
  // Try to load strand texture, handle if it doesn't exist yet
  let strandTexture: THREE.Texture | null = null;
  try {
    const textures = useTexture(['/hero/strand.png']);
    strandTexture = textures as unknown as THREE.Texture;
    if (strandTexture) {
      strandTexture.minFilter = THREE.LinearFilter;
      strandTexture.magFilter = THREE.LinearFilter;
      setHasStrand(true);
    }
  } catch (error) {
    // Strand texture doesn't exist yet - this is expected
    console.log('Strand texture not found - strand animation will be hidden until strand.png is added to /public/hero/');
  }
  
  useFrame((state) => {
    if (materialRef.current && hasStrand && meshRef.current) {
      const time = state.clock.elapsedTime;
      const now = Date.now();
      
      // Update shader time for internal bending sway
      materialRef.current.uniforms.uTime.value = time;
      
      // ===== GRAB INTERACTION =====
      // Track grab state changes
      if (isGrabbed && !wasGrabbed.current) {
        grabStartTime.current = now;
        grabReleaseTime.current = 0;
        wasGrabbed.current = true;
      }
      
      if (!isGrabbed && wasGrabbed.current) {
        grabReleaseTime.current = now;
        wasGrabbed.current = false;
      }
      
      // Animate grab position (match face plane's Y offset)
      let grabYOffset = 0;
      
      if (isGrabbed) {
        const grabElapsed = now - grabStartTime.current;
        const t = Math.min(1, grabElapsed / GRAB_SCALE_DURATION);
        
        if (t < 0.6) {
          const snapT = t / 0.6;
          const eased = snapT * snapT * (3 - 2 * snapT);
          grabYOffset = GRAB_POSITION_DIP_PEAK * eased;
        } else {
          const settleT = (t - 0.6) / 0.4;
          const eased = settleT * settleT * (3 - 2 * settleT);
          grabYOffset = GRAB_POSITION_DIP_PEAK + (GRAB_POSITION_DIP_REST - GRAB_POSITION_DIP_PEAK) * eased;
        }
        
        grabPositionY.current = grabYOffset;
      } else if (grabReleaseTime.current > 0) {
        const releaseElapsed = now - grabReleaseTime.current;
        // Delay return by recoil hold, matching FacePlane behaviour
        const effectiveElapsed = Math.max(0, releaseElapsed - RECOIL_HOLD_DURATION);
        const t = effectiveElapsed / 1000; // seconds
        const spring = dampedSpring(t, SPRING_STIFFNESS, SPRING_DAMPING);

        grabYOffset = GRAB_POSITION_DIP_REST * spring * (1 + SPRING_POSITION_OVERSHOOT);
        grabPositionY.current = grabYOffset;
        
        const totalDuration = RECOIL_HOLD_DURATION + GRAB_RELEASE_DURATION;
        if (releaseElapsed >= totalDuration) {
          grabReleaseTime.current = 0;
          grabPositionY.current = 0;
        }
      }
      
      // ===== INHERIT FACE POSITION (stay in sync with head) =====
      // Idle bounce runs immediately when not held — grab offsets layer on top
      let easedVertical = 0;
      let horizontalDrift = 0;
      let rotation = 0;
      
      if (!isGrabbed) {
        // Match exact same position logic as FacePlane
        const primaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_PRIMARY_PERIOD));
        const secondaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_SECONDARY_PERIOD) + 0.7);
        
        easedVertical = easeWithHangTime(primaryVertical) * BOUNCE_VERTICAL_PRIMARY_AMPLITUDE +
                              secondaryVertical * BOUNCE_VERTICAL_SECONDARY_AMPLITUDE;
        
        horizontalDrift = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 1.2) * BOUNCE_HORIZONTAL_AMPLITUDE;
        
        rotation = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 0.5) * BOUNCE_ROTATION_AMPLITUDE;
      }
      
      // Apply position (idle bounce + grab offset)
      meshRef.current.position.y = easedVertical + grabPositionY.current;
      meshRef.current.position.x = horizontalDrift;
      meshRef.current.rotation.z = rotation;
      
      // Keep scale neutral (no squash/stretch on strand, only on face)
      // The strand has its own bending via vertex shader
      meshRef.current.scale.set(1, 1, 1);
    }
  });
  
  const shaderMaterial = useMemo(() => {
    if (!strandTexture) return null;
    
    return {
      uniforms: {
        uTexStrand: { value: strandTexture },
        uTime: { value: 0 },
      },
      vertexShader: strandVertexShader,
      fragmentShader: strandFragmentShader,
      transparent: true,
    };
  }, [strandTexture]);
  
  // Don't render if strand texture isn't available
  if (!hasStrand || !shaderMaterial) {
    return null;
  }
  
  // Subdivide geometry vertically for bending (12-16 segments)
  return (
    <mesh ref={meshRef} position={[0, 0, 0.01]}>
      <planeGeometry args={[2, 2, 1, 14]} />
      <shaderMaterial ref={materialRef} {...shaderMaterial} />
    </mesh>
  );
}

function Scene({ onHoverChange }: { onHoverChange?: (hovered: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isGrabbed, setIsGrabbed] = useState(false);
  const isGrabbedRef = useRef(false); // ref copy so window listeners can read current value
  const hoverScale = useRef(1);

  // Cursor-follow tracking
  const grabStartPos = useRef({ x: 0, y: 0 });   // canvas px at moment of grab
  const cursorDelta = useRef({ x: 0, y: 0 });     // live delta from grab start (canvas px)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Global window listeners: mousemove tracks delta while grabbed (even outside canvas),
  // pointerup releases the grab no matter where the cursor is.
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isGrabbedRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      cursorDelta.current = {
        x: e.clientX - rect.left - grabStartPos.current.x,
        y: e.clientY - rect.top  - grabStartPos.current.y,
      };
    };

    const onPointerUp = () => {
      if (!isGrabbedRef.current) return;
      isGrabbedRef.current = false;
      setIsGrabbed(false);
      cursorDelta.current = { x: 0, y: 0 };
      // Cursor style: if still over the face it will re-trigger onPointerEnter,
      // so just reset to default here.
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Smooth scale transition on hover (disabled during grab)
    const targetScale = (isHovered && !isGrabbed) ? HOVER_SCALE : 1.0;
    hoverScale.current += (targetScale - hoverScale.current) * delta * HOVER_TRANSITION_SPEED;
    
    groupRef.current.scale.set(hoverScale.current, hoverScale.current, 1);
  });
  
  const handlePointerEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
    document.body.style.cursor = isGrabbedRef.current ? 'grabbing' : 'grab';
  };
  
  const handlePointerLeave = () => {
    // Only clear hover — do NOT release the grab when cursor leaves the mesh.
    setIsHovered(false);
    onHoverChange?.(false);
    if (!isGrabbedRef.current) {
      document.body.style.cursor = 'default';
    }
  };
  
  const handlePointerDown = (e: React.PointerEvent) => {
    // Snapshot the canvas element and grab-start position
    const canvas = (e.nativeEvent.target as HTMLElement).closest('canvas') as HTMLCanvasElement | null;
    if (canvas) {
      canvasRef.current = canvas;
      const rect = canvas.getBoundingClientRect();
      grabStartPos.current = {
        x: e.nativeEvent.clientX - rect.left,
        y: e.nativeEvent.clientY - rect.top,
      };
    }
    cursorDelta.current = { x: 0, y: 0 };
    isGrabbedRef.current = true;
    setIsGrabbed(true);
    document.body.style.cursor = 'grabbing';
  };
  
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 5]}
        zoom={200}
        near={0.1}
        far={1000}
      />
      <group
        ref={groupRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      >
        <FacePlane isHovered={isHovered} isGrabbed={isGrabbed} cursorDelta={cursorDelta} />
        <StrandPlane isGrabbed={isGrabbed} />
      </group>
    </>
  );
}

export default function HeroFace() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Loading fallback - static image */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/hero/face.png"
            alt="Loading..."
            className="w-[400px] h-[400px] object-contain"
          />
        </div>
      )}
      
      {/* WebGL Canvas */}
      <Canvas
        className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onCreated={() => {
          // Small delay to ensure textures are ready
          setTimeout(() => setIsLoaded(true), 100);
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Scene onHoverChange={setIsHovered} />
      </Canvas>
      
      {/* Dev note - remove in production */}
      <div className="absolute top-4 right-4 text-xs text-white/50 bg-black/30 px-3 py-2 rounded backdrop-blur-sm">
        💡 Add strand.png to /public/hero/ for full animation
      </div>
    </div>
  );
}
