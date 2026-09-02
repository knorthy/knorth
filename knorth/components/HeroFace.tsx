"use client";

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

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

// Fragment shader for smooth crossfade between two textures
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
  uniform float uBlinkMix;
  uniform float uHoverMix;
  varying vec2 vUv;
  
  void main() {
    vec4 base = texture2D(uTexBase, vUv);
    vec4 blink = texture2D(uTexBlink, vUv);
    vec4 hover = texture2D(uTexHover, vUv);
    
    // First blend base with blink (if blinking)
    vec4 baseWithBlink = mix(base, blink, uBlinkMix);
    
    // Then blend with hover expression (if hovering)
    gl_FragColor = mix(baseWithBlink, hover, uHoverMix);
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

function FacePlane({ isHovered }: { isHovered: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Load all textures including surprised expression
  const [faceTexture, bleftTexture, brightTexture, ohhTexture] = useTexture([
    '/hero/face.png',
    '/hero/bleft.png',
    '/hero/bright.png',
    '/hero/ohh.png',
  ]);
  
  // Set texture properties
  [faceTexture, bleftTexture, brightTexture, ohhTexture].forEach(tex => {
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
  
  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // ===== HOVER EXPRESSION TRANSITION =====
    // Instant switch between normal and surprised expression (no fade)
    const hoverMix = isHovered ? 1 : 0;
    
    // ===== NATURAL BOUNCE MOTION =====
    // 1. Vertical motion with layered sine waves
    const primaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_PRIMARY_PERIOD));
    const secondaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_SECONDARY_PERIOD) + 0.7); // Phase offset
    
    // Combine waves
    const combinedVertical = 
      primaryVertical * BOUNCE_VERTICAL_PRIMARY_AMPLITUDE +
      secondaryVertical * BOUNCE_VERTICAL_SECONDARY_AMPLITUDE;
    
    // Apply easing for hang time at top
    const easedVertical = easeWithHangTime(primaryVertical) * BOUNCE_VERTICAL_PRIMARY_AMPLITUDE +
                          secondaryVertical * BOUNCE_VERTICAL_SECONDARY_AMPLITUDE;
    
    // 2. Horizontal drift (independent phase from vertical)
    const horizontalDrift = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 1.2) * BOUNCE_HORIZONTAL_AMPLITUDE;
    
    // 3. Subtle rotation for natural movement (tied to horizontal drift)
    const rotation = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 0.5) * BOUNCE_ROTATION_AMPLITUDE;
    
    // Apply position and rotation
    meshRef.current.position.y = easedVertical;
    meshRef.current.position.x = horizontalDrift;
    meshRef.current.rotation.z = rotation;
    
    // ===== SQUASH AND STRETCH =====
    // Tied directly to vertical position in cycle
    // primaryVertical ranges from -1 (bottom) to +1 (top)
    
    // At bottom (primaryVertical = -1): squash (scaleY small, scaleX large)
    // At top (primaryVertical = +1): stretch (scaleY large, scaleX small)
    // At middle (primaryVertical = 0): neutral (scaleY = 1, scaleX = 1)
    
    // Map primaryVertical [-1, 1] to scale values
    const verticalPosition = primaryVertical; // -1 to +1
    
    let scaleY, scaleX;
    
    if (verticalPosition < 0) {
      // Moving through bottom half: interpolate from neutral (0) to squash (-1)
      const t = Math.abs(verticalPosition); // 0 to 1
      scaleY = 1 + (SQUASH_SCALE_Y_MIN - 1) * t;
      scaleX = 1 + (SQUASH_SCALE_X_MAX - 1) * t;
    } else {
      // Moving through top half: interpolate from neutral (0) to stretch (1)
      const t = verticalPosition; // 0 to 1
      scaleY = 1 + (STRETCH_SCALE_Y_MAX - 1) * t;
      scaleX = 1 + (STRETCH_SCALE_X_MIN - 1) * t;
    }
    
    meshRef.current.scale.set(scaleX, scaleY, 1);
    
    // ===== BLINK ANIMATION (only when not hovering) =====
    const now = Date.now();
    const deltaMs = delta * 1000;
    
    // Pause blinking when hovering (surprised face doesn't blink)
    if (!isHovered) {
      switch (blinkState) {
        case 'idle':
          // Wait for next blink reflex cycle
          if (now >= nextReflexTime.current) {
            setBlinkState('firstBlink');
            blinkProgress.current = 0;
            // First eye blinks (left eye = bleft)
            setCurrentBlinkTex(bleftTexture);
          }
          materialRef.current.uniforms.uBlinkMix.value = 0;
          break;
          
        case 'firstBlink':
          // Animate first eye blink: 0 -> 1 -> 0
          blinkProgress.current += deltaMs / BLINK_DURATION;
          
          let firstMix = 0;
          if (blinkProgress.current < 1) {
            // Fade to blink - use cubic easing for extra smoothness
            const t = blinkProgress.current;
            firstMix = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
          } else if (blinkProgress.current < 2) {
            // Fade back to base
            const t = 2 - blinkProgress.current;
            firstMix = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
          } else {
            // First blink complete, start gap timer
            setBlinkState('gap');
            stateTimer.current = 0;
            firstMix = 0;
          }
          
          materialRef.current.uniforms.uBlinkMix.value = Math.max(0, Math.min(1, firstMix));
          break;
          
        case 'gap':
          // Wait between blinks (now shorter - 200ms)
          stateTimer.current += deltaMs;
          materialRef.current.uniforms.uBlinkMix.value = 0;
          
          if (stateTimer.current >= BLINK_GAP) {
            setBlinkState('secondBlink');
            blinkProgress.current = 0;
            // Second eye blinks (right eye = bright)
            setCurrentBlinkTex(brightTexture);
          }
          break;
          
        case 'secondBlink':
          // Animate second eye blink: 0 -> 1 -> 0
          blinkProgress.current += deltaMs / BLINK_DURATION;
          
          let secondMix = 0;
          if (blinkProgress.current < 1) {
            // Fade to blink - use cubic easing for extra smoothness
            const t = blinkProgress.current;
            secondMix = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
          } else if (blinkProgress.current < 2) {
            // Fade back to base
            const t = 2 - blinkProgress.current;
            secondMix = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
          } else {
            // Blink reflex cycle complete, schedule next one
            setBlinkState('idle');
            nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
            secondMix = 0;
          }
          
          materialRef.current.uniforms.uBlinkMix.value = Math.max(0, Math.min(1, secondMix));
          break;
      }
      
      materialRef.current.uniforms.uTexBlink.value = currentBlinkTex;
    } else {
      // When hovering, reset blink state and show no blink
      if (blinkState !== 'idle') {
        setBlinkState('idle');
        nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
      }
      materialRef.current.uniforms.uBlinkMix.value = 0;
    }
    
    // ===== UPDATE SHADER UNIFORMS =====
    // Instant switch between normal face and surprised face based on hover
    materialRef.current.uniforms.uTexBase.value = faceTexture;
    materialRef.current.uniforms.uTexHover.value = ohhTexture;
    materialRef.current.uniforms.uHoverMix.value = hoverMix;
  });
  
  const shaderMaterial = useMemo(() => ({
    uniforms: {
      uTexBase: { value: faceTexture },
      uTexBlink: { value: currentBlinkTex },
      uTexHover: { value: ohhTexture },
      uBlinkMix: { value: 0 },
      uHoverMix: { value: 0 },
    },
    vertexShader: blinkVertexShader,
    fragmentShader: blinkFragmentShader,
    transparent: true,
  }), [faceTexture, currentBlinkTex, ohhTexture]);
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={materialRef} {...shaderMaterial} />
    </mesh>
  );
}

function StrandPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [hasStrand, setHasStrand] = useState(false);
  
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
      
      // Update shader time for internal bending sway
      materialRef.current.uniforms.uTime.value = time;
      
      // ===== INHERIT FACE POSITION (stay in sync with head) =====
      // Match exact same position logic as FacePlane
      const primaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_PRIMARY_PERIOD));
      const secondaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_SECONDARY_PERIOD) + 0.7);
      
      const easedVertical = easeWithHangTime(primaryVertical) * BOUNCE_VERTICAL_PRIMARY_AMPLITUDE +
                            secondaryVertical * BOUNCE_VERTICAL_SECONDARY_AMPLITUDE;
      
      const horizontalDrift = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 1.2) * BOUNCE_HORIZONTAL_AMPLITUDE;
      
      const rotation = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 0.5) * BOUNCE_ROTATION_AMPLITUDE;
      
      // Apply same position and rotation as face (strand moves WITH head)
      meshRef.current.position.y = easedVertical;
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

function Scene({ onHoverChange, onClick }: { onHoverChange?: (hovered: boolean) => void; onClick?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const hoverScale = useRef(1);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Smooth scale transition on hover
    const targetScale = isHovered ? HOVER_SCALE : 1.0;
    hoverScale.current += (targetScale - hoverScale.current) * delta * HOVER_TRANSITION_SPEED;
    
    groupRef.current.scale.set(hoverScale.current, hoverScale.current, 1);
  });
  
  const handlePointerEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
    document.body.style.cursor = 'default';
  };
  
  const handleClick = () => {
    onClick?.();
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
        onClick={handleClick}
      >
        <FacePlane isHovered={isHovered} />
        <StrandPlane />
      </group>
    </>
  );
}

export default function HeroFace() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  const handleCharacterClick = () => {
    router.push('/home');
  };
  
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
        <Scene onHoverChange={setIsHovered} onClick={handleCharacterClick} />
      </Canvas>
      
      {/* Subtle hover hint - fades in when hovering */}
      <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-white/70 text-sm font-light tracking-wide">
          Click to enter
        </div>
      </div>
      
      {/* Dev note - remove in production */}
      <div className="absolute top-4 right-4 text-xs text-white/50 bg-black/30 px-3 py-2 rounded backdrop-blur-sm">
        💡 Add strand.png to /public/hero/ for full animation
      </div>
    </div>
  );
}
