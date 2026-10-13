"use client";

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { useTexture, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { CircleWipe } from '@/components/CircleWipe';

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
const IDLE_BLEND_RATE = 8; // 1/s — how fast the idle bounce fades out on grab / back in after release

// Squash and stretch (scale tied to vertical position) - more subtle, natural
const SQUASH_SCALE_Y_MIN = 0.97; // scaleY at lowest point (gentle squash)
const SQUASH_SCALE_X_MAX = 1.02; // scaleX at lowest point (gentle widen)
const STRETCH_SCALE_Y_MAX = 1.02; // scaleY at highest point (gentle stretch)
const STRETCH_SCALE_X_MIN = 0.98; // scaleX at highest point (gentle narrow)

// Hover interaction
const HOVER_SCALE = 1.15; // scale multiplier on hover
const HOVER_TRANSITION_SPEED = 5; // 1/s — exponential approach rate for hover scale

// Grab squish (whole body shrinks + dips while held) — spring-driven
const GRAB_SCALE_TARGET = 0.88; // scale while held (~12% smaller)
const GRAB_POSITION_DIP_REST = -0.06; // ~6px downward while held
const GRAB_SCALE_KICK = -1.4; // initial scale velocity on grab (1/s) — gives the snap-in undershoot
const GRAB_DIP_KICK = -2.2; // initial dip velocity on grab (units/s) — gives the ~20px dip
const SQUISH_STIFFNESS = 300;
const SQUISH_DAMPING = 18; // ζ ≈ 0.52 — one soft undershoot on grab, one overshoot on release

// Pull / stretch
const WORLD_PX = 200; // camera zoom → 1 world unit = 200 px
const FOLLOW_DAMPING = 0.9; // fraction of raw cursor delta used as the pull target
const FOLLOW_MAX_OFFSET = 140; // px — soft limit; pulling further gets progressively harder (tanh)
const BODY_FOLLOW = 0.2; // fraction of the pull that moves the whole head; the rest is stretch
const STRETCH_RADIUS = 0.85; // local units — gaussian falloff radius around the grab point (face is 2×2)
const STRETCH_SQUEEZE = 0.55; // perpendicular squeeze per unit of pull (volume preservation)
const FACE_SEGMENTS = 48; // grid resolution of the face plane

// Pull spring — semi-implicit Euler, fixed substeps
const HOLD_STIFFNESS = 420; // while held: firm follow
const HOLD_DAMPING = 36; // ζ ≈ 0.88 — tracks the cursor without wobble
const RELEASE_STIFFNESS = 240; // on release: snap back
const RELEASE_DAMPING = 11; // ζ ≈ 0.36 — ~30% overshoot, a couple of settling bounces
const SPRING_SUBSTEP = 1 / 240; // s
const MAX_FRAME_DELTA = 1 / 30; // s — avoid explosions after a tab switch / dropped frames
const SETTLE_EPSILON = 0.0015;

// Shiver effect (tension while held — scales with how far you pull)
const SHIVER_AMPLITUDE = 2.2; // px — peak micro-jitter radius at full pull
const SHIVER_INTERVAL = 65; // ms — how often shiver offset is randomised

// Circle wipe — delay after release so the first overshoot + rebound are visible
const WIPE_TRIGGER_DELAY = 450; // ms
// ============================================

type GrabPhase = 'idle' | 'held' | 'released';

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

interface Spring { x: number; v: number; }

// One semi-implicit Euler step of a damped spring toward `target`.
function stepSpring(s: Spring, target: number, stiffness: number, damping: number, dt: number) {
  const a = -stiffness * (s.x - target) - damping * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

// Shared deformation: pulls vertices toward uPull with a gaussian falloff around uGrab,
// and squeezes them perpendicular to the pull so the face keeps its volume.
// Used by every layer so face, expressions and hair bend identically.
const deformGLSL = `
  uniform vec2 uGrab;
  uniform vec2 uPull;
  uniform float uRadius;
  uniform float uSqueeze;

  vec3 deform(vec3 p) {
    vec2 d = p.xy - uGrab;
    float w = exp(-dot(d, d) / (uRadius * uRadius));
    vec2 offset = uPull * w;
    float len = length(uPull);
    if (len > 1e-5) {
      vec2 n = vec2(-uPull.y, uPull.x) / len;
      offset -= n * dot(d, n) * uSqueeze * len * w;
    }
    return vec3(p.xy + offset, p.z);
  }
`;

const blinkVertexShader = `
  ${deformGLSL}
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(deform(position), 1.0);
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
  ${deformGLSL}
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

    gl_Position = projectionMatrix * modelViewMatrix * vec4(deform(pos), 1.0);
  }
`;

const strandFragmentShader = `
  uniform sampler2D uTexStrand;
  varying vec2 vUv;

  void main() {
    gl_FragColor = texture2D(uTexStrand, vUv);
  }
`;

type DeformUniforms = {
  uGrab: { value: THREE.Vector2 };
  uPull: { value: THREE.Vector2 };
  uRadius: { value: number };
  uSqueeze: { value: number };
};

interface FacePlaneProps {
  isHovered: boolean;
  grabPhase: GrabPhase;
  deformUniforms: DeformUniforms;
}

// Face layer: textures, expressions and blink. Position/scale come from the parent body group,
// stretch comes from the shared deform uniforms.
function FacePlane({ isHovered, grabPhase, deformUniforms }: FacePlaneProps) {
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

  // Blink reflex state machine (refs — no re-render per blink)
  // States: 'idle' -> 'firstBlink' -> 'gap' -> 'secondBlink' -> 'idle'
  const blinkState = useRef<'idle' | 'firstBlink' | 'gap' | 'secondBlink'>('idle');
  const blinkProgress = useRef(0);
  const stateTimer = useRef(0);
  const nextReflexTime = useRef(0); // set on the first frame

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    const now = Date.now();
    if (nextReflexTime.current === 0) nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
    const deltaMs = delta * 1000;
    const u = material.uniforms;

    // ===== GRAB EXPRESSION (instant switch) =====
    if (grabPhase === 'held') {
      u.uTexGrab.value = ughhTexture; // squint while held
      u.uGrabMix.value = 1;
    } else if (grabPhase === 'released') {
      u.uTexGrab.value = ohhTexture; // ohh! on release — stays until wipe
      u.uGrabMix.value = 1;
    } else {
      u.uGrabMix.value = 0;
    }

    // ===== HOVER EXPRESSION — disabled during grab or any post-release state =====
    u.uHoverMix.value = isHovered && grabPhase === 'idle' ? 1 : 0;

    // ===== BLINK ANIMATION (paused while hovered, held or releasing) =====
    const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const blinkMix = () => {
      const p = blinkProgress.current;
      return p < 1 ? smoother(p) : p < 2 ? smoother(2 - p) : 0;
    };

    if (!isHovered && grabPhase === 'idle') {
      switch (blinkState.current) {
        case 'idle':
          if (now >= nextReflexTime.current) {
            blinkState.current = 'firstBlink';
            blinkProgress.current = 0;
            u.uTexBlink.value = bleftTexture;
          }
          u.uBlinkMix.value = 0;
          break;

        case 'firstBlink':
          blinkProgress.current += deltaMs / BLINK_DURATION;
          if (blinkProgress.current >= 2) {
            blinkState.current = 'gap';
            stateTimer.current = 0;
          }
          u.uBlinkMix.value = Math.max(0, Math.min(1, blinkMix()));
          break;

        case 'gap':
          stateTimer.current += deltaMs;
          u.uBlinkMix.value = 0;
          if (stateTimer.current >= BLINK_GAP) {
            blinkState.current = 'secondBlink';
            blinkProgress.current = 0;
            u.uTexBlink.value = brightTexture;
          }
          break;

        case 'secondBlink':
          blinkProgress.current += deltaMs / BLINK_DURATION;
          if (blinkProgress.current >= 2) {
            blinkState.current = 'idle';
            nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
          }
          u.uBlinkMix.value = Math.max(0, Math.min(1, blinkMix()));
          break;
      }
    } else {
      // When hovering or grabbed, reset blink state
      if (blinkState.current !== 'idle') {
        blinkState.current = 'idle';
        nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
      }
      u.uBlinkMix.value = 0;
    }
  });

  const shaderMaterial = useMemo(() => ({
    uniforms: {
      ...deformUniforms,
      uTexBase: { value: faceTexture },
      uTexBlink: { value: bleftTexture },
      uTexHover: { value: ohhTexture },
      uTexGrab: { value: ughhTexture },
      uBlinkMix: { value: 0 },
      uHoverMix: { value: 0 },
      uGrabMix: { value: 0 },
    },
    vertexShader: blinkVertexShader,
    fragmentShader: blinkFragmentShader,
    transparent: true,
  }), [deformUniforms, faceTexture, bleftTexture, ohhTexture, ughhTexture]);

  return (
    <mesh>
      <planeGeometry args={[2, 2, FACE_SEGMENTS, FACE_SEGMENTS]} />
      <shaderMaterial ref={materialRef} {...shaderMaterial} />
    </mesh>
  );
}

// Hair strand layer. Optional: renders only once /hero/strand.png exists.
// Shares the body transform and deform uniforms with the face, so it never separates.
function StrandPlane({ deformUniforms }: { deformUniforms: DeformUniforms }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [strandTexture, setStrandTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    new THREE.TextureLoader().load(
      '/hero/strand.png',
      (tex) => {
        if (cancelled) return;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        setStrandTexture(tex);
      },
      undefined,
      () => { /* strand.png not added yet — layer stays hidden */ },
    );
    return () => { cancelled = true; };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const shaderMaterial = useMemo(() => {
    if (!strandTexture) return null;
    return {
      uniforms: {
        ...deformUniforms,
        uTexStrand: { value: strandTexture },
        uTime: { value: 0 },
      },
      vertexShader: strandVertexShader,
      fragmentShader: strandFragmentShader,
      transparent: true,
    };
  }, [deformUniforms, strandTexture]);

  if (!shaderMaterial) return null;

  // Subdivided both ways: vertically for sway, horizontally so the stretch bends it smoothly
  return (
    <mesh position={[0, 0, 0.01]}>
      <planeGeometry args={[2, 2, FACE_SEGMENTS / 2, FACE_SEGMENTS]} />
      <shaderMaterial ref={materialRef} {...shaderMaterial} />
    </mesh>
  );
}

function Scene({ onHoverChange, onGrabSettle }: { onHoverChange?: (hovered: boolean) => void; onGrabSettle?: () => void }) {
  const groupRef = useRef<THREE.Group>(null); // hover scale
  const bodyRef = useRef<THREE.Group>(null);  // idle bounce + grab squish + body follow — shared by all layers
  const [isHovered, setIsHovered] = useState(false);
  const [grabPhase, setGrabPhase] = useState<GrabPhase>('idle');
  const phaseRef = useRef<GrabPhase>('idle'); // ref copy so window listeners / useFrame read the current value
  const hoverScale = useRef(1);
  const reducedMotion = useRef(false);

  // Cursor tracking (canvas px)
  const grabStartPos = useRef({ x: 0, y: 0 });
  const cursorDelta = useRef({ x: 0, y: 0 });
  const wipeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Physics state
  const pullX = useRef<Spring>({ x: 0, v: 0 }); // world units, screen-aligned
  const pullY = useRef<Spring>({ x: 0, v: 0 });
  const squish = useRef<Spring>({ x: 1, v: 0 });
  const dip = useRef<Spring>({ x: 0, v: 0 });
  const idleWeight = useRef(1);
  const shiver = useRef({ x: 0, y: 0, last: 0 });

  const deformUniforms = useMemo<DeformUniforms>(() => ({
    uGrab: { value: new THREE.Vector2(0, 0) },
    uPull: { value: new THREE.Vector2(0, 0) },
    uRadius: { value: STRETCH_RADIUS },
    uSqueeze: { value: STRETCH_SQUEEZE },
  }), []);

  const setPhase = useCallback((phase: GrabPhase) => {
    phaseRef.current = phase;
    setGrabPhase(phase);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => { reducedMotion.current = e.matches; };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Global window listeners: pointermove tracks delta while held (even outside the canvas),
  // pointerup / pointercancel release the grab no matter where the pointer is.
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (phaseRef.current !== 'held') return;
      cursorDelta.current = {
        x: e.clientX - grabStartPos.current.x,
        y: e.clientY - grabStartPos.current.y,
      };
    };

    const onPointerUp = () => {
      if (phaseRef.current !== 'held') return;
      setPhase('released');
      cursorDelta.current = { x: 0, y: 0 };
      document.body.style.cursor = 'default';
      // Let the first overshoot + rebound play before the wipe covers it
      wipeTimer.current = setTimeout(() => onGrabSettle?.(), WIPE_TRIGGER_DELAY);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (wipeTimer.current) clearTimeout(wipeTimer.current);
    };
  }, [onGrabSettle, setPhase]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const body = bodyRef.current;
    if (!group || !body) return;

    const phase = phaseRef.current;
    const held = phase === 'held';
    const reduce = reducedMotion.current;
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    const time = state.clock.elapsedTime;

    // ===== HOVER SCALE (frame-rate independent exponential approach) =====
    const targetScale = isHovered && phase === 'idle' ? HOVER_SCALE : 1.0;
    hoverScale.current += (targetScale - hoverScale.current) * (1 - Math.exp(-HOVER_TRANSITION_SPEED * dt));
    group.scale.set(hoverScale.current, hoverScale.current, 1);

    // ===== PULL TARGET (soft-limited cursor delta, world units) =====
    let targetX = 0;
    let targetY = 0;
    const maxWorld = (FOLLOW_MAX_OFFSET / WORLD_PX) * (reduce ? 0.5 : 1);
    if (held) {
      const rawX = (cursorDelta.current.x * FOLLOW_DAMPING) / WORLD_PX;
      const rawY = (-cursorDelta.current.y * FOLLOW_DAMPING) / WORLD_PX; // screen Y is flipped
      const dist = Math.hypot(rawX, rawY);
      if (dist > 0) {
        const banded = maxWorld * Math.tanh(dist / maxWorld); // rubber-band: harder the further you go
        targetX = (rawX / dist) * banded;
        targetY = (rawY / dist) * banded;
      }
    }

    // ===== SPRINGS (fixed substeps → same feel at 60/120/144 Hz) =====
    const k = held ? HOLD_STIFFNESS : RELEASE_STIFFNESS;
    const c = held ? HOLD_DAMPING : reduce ? 2 * Math.sqrt(RELEASE_STIFFNESS) : RELEASE_DAMPING;
    const squishTarget = held ? GRAB_SCALE_TARGET : 1;
    const dipTarget = held ? GRAB_POSITION_DIP_REST : 0;
    for (let remaining = dt; remaining > 0; remaining -= SPRING_SUBSTEP) {
      const h = Math.min(SPRING_SUBSTEP, remaining);
      stepSpring(pullX.current, targetX, k, c, h);
      stepSpring(pullY.current, targetY, k, c, h);
      stepSpring(squish.current, squishTarget, SQUISH_STIFFNESS, SQUISH_DAMPING, h);
      stepSpring(dip.current, dipTarget, SQUISH_STIFFNESS, SQUISH_DAMPING, h);
    }
    const px = pullX.current.x;
    const py = pullY.current.x;

    // Settle detection: back to idle once everything has come to rest
    if (phase === 'released') {
      const resting =
        Math.abs(px) + Math.abs(py) + Math.abs(squish.current.x - 1) + Math.abs(dip.current.x) < SETTLE_EPSILON &&
        Math.abs(pullX.current.v) + Math.abs(pullY.current.v) + Math.abs(squish.current.v) < SETTLE_EPSILON * 10;
      if (resting) setPhase('idle');
    }

    // ===== IDLE BOUNCE (faded out while held, faded back in after) =====
    idleWeight.current += ((held ? 0 : 1) - idleWeight.current) * (1 - Math.exp(-IDLE_BLEND_RATE * dt));
    const w = idleWeight.current;

    const primaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_PRIMARY_PERIOD));
    const secondaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_SECONDARY_PERIOD) + 0.7);
    const easedVertical = easeWithHangTime(primaryVertical) * BOUNCE_VERTICAL_PRIMARY_AMPLITUDE +
      secondaryVertical * BOUNCE_VERTICAL_SECONDARY_AMPLITUDE;
    const horizontalDrift = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 1.2) * BOUNCE_HORIZONTAL_AMPLITUDE;
    const rotation = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 0.5) * BOUNCE_ROTATION_AMPLITUDE * w;

    // Squash and stretch tied to the bounce
    let idleScaleX = 1;
    let idleScaleY = 1;
    if (primaryVertical < 0) {
      const t = -primaryVertical;
      idleScaleY = 1 + (SQUASH_SCALE_Y_MIN - 1) * t;
      idleScaleX = 1 + (SQUASH_SCALE_X_MAX - 1) * t;
    } else {
      const t = primaryVertical;
      idleScaleY = 1 + (STRETCH_SCALE_Y_MAX - 1) * t;
      idleScaleX = 1 + (STRETCH_SCALE_X_MIN - 1) * t;
    }
    const scaleX = (1 + (idleScaleX - 1) * w) * squish.current.x;
    const scaleY = (1 + (idleScaleY - 1) * w) * squish.current.x;

    // ===== SHIVER (tension grows with pull distance) =====
    if (held && !reduce) {
      const now = performance.now();
      if (now - shiver.current.last >= SHIVER_INTERVAL) {
        const tension = Math.min(1, Math.hypot(px, py) / maxWorld);
        const amp = (SHIVER_AMPLITUDE / WORLD_PX) * tension;
        shiver.current = { x: (Math.random() * 2 - 1) * amp, y: (Math.random() * 2 - 1) * amp, last: now };
      }
    } else {
      shiver.current.x = 0;
      shiver.current.y = 0;
    }

    // ===== BODY TRANSFORM (shared by face + strand) =====
    const hs = hoverScale.current;
    body.position.x = horizontalDrift * w + (px * BODY_FOLLOW) / hs + shiver.current.x;
    body.position.y = easedVertical * w + dip.current.x + (py * BODY_FOLLOW) / hs + shiver.current.y;
    body.rotation.z = rotation;
    body.scale.set(scaleX, scaleY, 1);

    // ===== STRETCH (rest of the pull, converted into the face's local space) =====
    const sx = (px * (1 - BODY_FOLLOW)) / hs;
    const sy = (py * (1 - BODY_FOLLOW)) / hs;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    deformUniforms.uPull.value.set(
      (sx * cos - sy * sin) / scaleX,
      (sx * sin + sy * cos) / scaleY,
    );
  });

  const handlePointerEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
    document.body.style.cursor = phaseRef.current === 'held' ? 'grabbing' : 'grab';
  };

  const handlePointerLeave = () => {
    // Only clear hover — do NOT release the grab when cursor leaves the mesh.
    setIsHovered(false);
    onHoverChange?.(false);
    if (phaseRef.current !== 'held') {
      document.body.style.cursor = 'default';
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // Anchor the stretch where the face was actually grabbed (face-local coordinates)
    if (bodyRef.current) {
      const local = bodyRef.current.worldToLocal(e.point.clone());
      deformUniforms.uGrab.value.set(
        THREE.MathUtils.clamp(local.x, -1, 1),
        THREE.MathUtils.clamp(local.y, -1, 1),
      );
    }
    grabStartPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    cursorDelta.current = { x: 0, y: 0 };
    if (wipeTimer.current) clearTimeout(wipeTimer.current);

    // Kick the squish springs so the grab snaps in with a little undershoot
    if (!reducedMotion.current) {
      squish.current.v += GRAB_SCALE_KICK;
      dip.current.v += GRAB_DIP_KICK;
    }

    setPhase('held');
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
        <group ref={bodyRef}>
          <FacePlane isHovered={isHovered} grabPhase={grabPhase} deformUniforms={deformUniforms} />
          <StrandPlane deformUniforms={deformUniforms} />
        </group>
      </group>
    </>
  );
}


// Doodle frames cycle: 1 → 2 → 3 → 2 → repeat (hand-drawn wiggle effect)
const DOODLE_FRAMES = ['/hero/1.png', '/hero/2.png', '/hero/3.png', '/hero/2.png'];
const DOODLE_FPS = 500; // ms per frame

function DoodleText() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % DOODLE_FRAMES.length);
    }, DOODLE_FPS);
    return () => clearInterval(id);
  }, []);

  return (
    <img
      src={DOODLE_FRAMES[frame]}
      alt="doodle text"
      style={{ imageRendering: 'pixelated' }}
      className="w-auto h-auto max-w-[260px] select-none pointer-events-none"
    />
  );
}

// Interaction hint frames: int1 → int2 → repeat
const INT_FRAMES = ['/hero/int1.png', '/hero/int2.png'];
const INT_FPS = 500; // ms per frame

function DoodleInteract() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % INT_FRAMES.length);
    }, INT_FPS);
    return () => clearInterval(id);
  }, []);

  return (
    <img
      src={INT_FRAMES[frame]}
      alt="interaction hint"
      style={{ imageRendering: 'pixelated' }}
      className="w-auto h-auto max-w-[260px] select-none pointer-events-none"
    />
  );
}

// ── FloatingDots ──────────────────────────────────────────────────────────────
const DOT_COLORS = ['#ffffff', '#f72585', '#b5ff4d', '#ffe566', '#a855f7'];

interface Dot {
  x: number; y: number;
  ox: number; oy: number; // home/origin position
  angle: number;          // current orbit angle (radians)
  orbitR: number;         // orbit radius around home
  orbitSpeed: number;     // radians per frame
  size: number;
  color: string;
  vx: number; vy: number;
  opacity: number;
}

function FloatingDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // Spawn dots
    const COUNT = 55;
    const REPEL_RADIUS = 90;
    const REPEL_STRENGTH = 0.55;
    const RETURN_SPRING = 0.04;
    const DAMPING = 0.80;

    const dots: Dot[] = Array.from({ length: COUNT }, () => {
      const ox = Math.random() * window.innerWidth;
      const oy = Math.random() * window.innerHeight;
      const angle = Math.random() * Math.PI * 2;
      const orbitR = Math.random() * 18 + 4;           // orbit 4–22px around home
      const orbitSpeed = (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1); // CW or CCW
      return {
        x: ox + Math.cos(angle) * orbitR,
        y: oy + Math.sin(angle) * orbitR,
        ox, oy,
        angle, orbitR, orbitSpeed,
        size:    Math.random() * 2.5 + 1,
        color:   DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
        vx: 0, vy: 0,
        opacity: Math.random() * 0.45 + 0.1,
      };
    });

    // ── Shooting stars ────────────────────────────────────────────────────
    interface Star {
      x: number; y: number;
      vx: number; vy: number;
      len: number;
      life: number;
      speed: number;
      color: string;
    }

    const STAR_COLORS = ['#ffffff', '#ffffff', '#ffffff', '#f72585', '#b5ff4d', '#ffe566', '#a855f7'];
    const stars: Star[] = [];
    let nextStarIn = 0;

    const spawnStar = () => {
      const fromRight = Math.random() < 0.5;
      let baseAngle: number;
      if (fromRight) {
        baseAngle = Math.PI - (Math.random() * 0.4 - 0.2) - Math.PI * 0.12;
      } else {
        baseAngle = (Math.random() * 0.4 - 0.2) + Math.PI * 0.12;
      }
      const speed = Math.random() * 6 + 5;
      stars.push({
        x:     fromRight ? canvas.width * 0.4 + Math.random() * canvas.width * 0.6 : Math.random() * canvas.width * 0.6,
        y:     Math.random() * canvas.height,
        vx:    Math.cos(baseAngle) * speed,
        vy:    Math.sin(baseAngle) * speed,
        len:   Math.random() * 60 + 30,
        life:  0,
        speed,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
      nextStarIn = Math.floor(Math.random() * 180 + 60);
    };

    let frameCount = 0;

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // ── Dots ──────────────────────────────────────────────────────────
      for (const d of dots) {
        d.angle += d.orbitSpeed;
        const targetX = d.ox + Math.cos(d.angle) * d.orbitR;
        const targetY = d.oy + Math.sin(d.angle) * d.orbitR;

        const dx = d.x - mx;
        const dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          d.vx += (dx / dist) * force * REPEL_STRENGTH;
          d.vy += (dy / dist) * force * REPEL_STRENGTH;
        }

        d.vx += (targetX - d.x) * RETURN_SPRING;
        d.vy += (targetY - d.y) * RETURN_SPRING;
        d.vx *= DAMPING;
        d.vy *= DAMPING;
        d.x += d.vx;
        d.y += d.vy;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = d.opacity;
        ctx.fill();
      }

      // ── Shooting stars ─────────────────────────────────────────────────
      frameCount++;
      if (frameCount >= nextStarIn) {
        spawnStar();
        frameCount = 0;
      }

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life += s.speed / 400;
        s.x += s.vx;
        s.y += s.vy;

        const alpha = s.life < 0.2
          ? s.life / 0.2
          : s.life > 0.7
            ? 1 - (s.life - 0.7) / 0.3
            : 1;

        const tailX = s.x - s.vx / s.speed * s.len;
        const tailY = s.y - s.vy / s.speed * s.len;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, s.color);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.random() * 0.5 + 0.8;
        ctx.globalAlpha = alpha * 0.7;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.9;
        ctx.fill();

        if (s.life >= 1 || s.x > canvas.width + 50 || s.x < -50 || s.y > canvas.height + 50) {
          stars.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    spawnStar();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

export default function HeroFace() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  // Circle wipe state
  const [wipeOrigin, setWipeOrigin] = useState<{ x: number; y: number } | null>(null);
  const [wipeActive, setWipeActive] = useState(false);

  // Called by FacePlane once the spring fully settles after a grab-and-release
  const handleGrabSettle = useCallback(() => {
    // Origin = centre of the viewport (where the character lives)
    const origin = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    setWipeOrigin(origin);
    setWipeActive(true);
  }, []);

  const handleWipeCovered = useCallback(() => {
    // Navigate while the screen is fully covered
    router.push('/home');
  }, [router]);

  const handleWipeDone = useCallback(() => {
    setWipeActive(false);
    setWipeOrigin(null);
  }, []);

  return (
    <div className="relative w-full h-screen" style={{ background: '#0e0e0e' }}>
      {/* Floating ambient dots */}
      <FloatingDots />

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
        style={{ touchAction: 'none' }} // dragging the face on touch shouldn't scroll the page
        onCreated={() => {
          setTimeout(() => setIsLoaded(true), 100);
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Scene onHoverChange={setIsHovered} onGrabSettle={handleGrabSettle} />
      </Canvas>

      {/* Doodle text — left side of character */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="w-1/2 flex justify-center">
          <DoodleText />
        </div>
      </div>

      {/* Interaction hint — right side of character */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="w-1/2 ml-auto flex justify-center">
          <DoodleInteract />
        </div>
      </div>

      {/* Circle wipe — mounts only when triggered */}
      {wipeActive && wipeOrigin && (
        <CircleWipe
          origin={wipeOrigin}
          onCovered={handleWipeCovered}
          onDone={handleWipeDone}
        />
      )}
    </div>
  );
}
