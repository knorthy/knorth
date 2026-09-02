"use client";

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

// ============= TIMING CONSTANTS =============
// Blink timing
const BLINK_REFLEX_INTERVAL = 3000; // ms - wait time before starting a new blink reflex cycle
const BLINK_GAP = 200; // ms - gap between first eye blink and second eye blink (faster)
const BLINK_DURATION = 80; // ms (one-way fade - faster, smoother)

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

// Drag/grab behavior
const DRAG_RESISTANCE = 0.35; // How much the character resists being pulled (0=no resistance, 1=full resistance)
const DRAG_SCALE_MIN = 0.88; // How small when being grabbed
const SHIVER_AMPLITUDE = 0.004; // Shivering intensity when grabbed (reduced for minimal shake)
const SHIVER_FREQUENCY = 35; // Hz - how fast the shiver (higher = faster shake)
const DRAG_SPRING_STIFFNESS = 0.08; // How fast character returns to origin when released

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
  uniform sampler2D uTexDrag;
  uniform float uBlinkMix;
  uniform float uHoverMix;
  uniform float uDragMix;
  varying vec2 vUv;
  
  void main() {
    vec4 base = texture2D(uTexBase, vUv);
    vec4 blink = texture2D(uTexBlink, vUv);
    vec4 hover = texture2D(uTexHover, vUv);
    vec4 drag = texture2D(uTexDrag, vUv);
    
    // First blend base with blink (if blinking)
    vec4 baseWithBlink = mix(base, blink, uBlinkMix);
    
    // Then blend with hover expression (if hovering but not dragging)
    vec4 withHover = mix(baseWithBlink, hover, uHoverMix);
    
    // Finally blend with drag expression (highest priority)
    gl_FragColor = mix(withHover, drag, uDragMix);
  }
`;

function FacePlane({ isHovered, isDragging, dragOffset, shiverOffset, dragScale }: { 
  isHovered: boolean; 
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  shiverOffset: { x: number; y: number; rotation: number };
  dragScale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Load all textures including drag expression
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
  
  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // ===== DRAG vs IDLE ANIMATION =====
    if (isDragging) {
      // DRAGGING: Apply drag position with resistance + shivering
      meshRef.current.position.x = dragOffset.x + shiverOffset.x;
      meshRef.current.position.y = dragOffset.y + shiverOffset.y;
      meshRef.current.rotation.z = shiverOffset.rotation;
      
      // Use smooth scale transition when grabbed
      meshRef.current.scale.set(dragScale, dragScale, 1);
    } else {
      // IDLE: Normal bounce animation
      const primaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_PRIMARY_PERIOD));
      const secondaryVertical = Math.sin(time * (2 * Math.PI / BOUNCE_VERTICAL_SECONDARY_PERIOD) + 0.7);
      
      const easedVertical = easeWithHangTime(primaryVertical) * BOUNCE_VERTICAL_PRIMARY_AMPLITUDE +
                            secondaryVertical * BOUNCE_VERTICAL_SECONDARY_AMPLITUDE;
      
      const horizontalDrift = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 1.2) * BOUNCE_HORIZONTAL_AMPLITUDE;
      const rotation = Math.sin(time * (2 * Math.PI / BOUNCE_HORIZONTAL_PERIOD) + 0.5) * BOUNCE_ROTATION_AMPLITUDE;
      
      meshRef.current.position.x = horizontalDrift;
      meshRef.current.position.y = easedVertical;
      meshRef.current.rotation.z = rotation;
      
      // Squash and stretch
      const verticalPosition = primaryVertical;
      let scaleY, scaleX;
      
      if (verticalPosition < 0) {
        const t = Math.abs(verticalPosition);
        scaleY = 1 + (SQUASH_SCALE_Y_MIN - 1) * t;
        scaleX = 1 + (SQUASH_SCALE_X_MAX - 1) * t;
      } else {
        const t = verticalPosition;
        scaleY = 1 + (STRETCH_SCALE_Y_MAX - 1) * t;
        scaleX = 1 + (STRETCH_SCALE_X_MIN - 1) * t;
      }
      
      meshRef.current.scale.set(scaleX, scaleY, 1);
    }
    
    // ===== BLINK ANIMATION (only when not hovering or dragging) =====
    const now = Date.now();
    const deltaMs = delta * 1000;
    
    if (!isHovered && !isDragging) {
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
      if (blinkState !== 'idle') {
        setBlinkState('idle');
        nextReflexTime.current = now + BLINK_REFLEX_INTERVAL;
      }
      materialRef.current.uniforms.uBlinkMix.value = 0;
    }
    
    // ===== UPDATE SHADER UNIFORMS =====
    // Expression priority: Drag > Hover > Normal
    // When drag is released, immediately go back to hover or idle (not waiting for position to return)
    const hoverMix = isHovered && !isDragging ? 1 : 0;
    const dragMix = isDragging ? 1 : 0;
    
    materialRef.current.uniforms.uTexBase.value = faceTexture;
    materialRef.current.uniforms.uTexHover.value = ohhTexture;
    materialRef.current.uniforms.uTexDrag.value = ughhTexture;
    materialRef.current.uniforms.uHoverMix.value = hoverMix;
    materialRef.current.uniforms.uDragMix.value = dragMix;
  });
  
  const shaderMaterial = useMemo(() => ({
    uniforms: {
      uTexBase: { value: faceTexture },
      uTexBlink: { value: currentBlinkTex },
      uTexHover: { value: ohhTexture },
      uTexDrag: { value: ughhTexture },
      uBlinkMix: { value: 0 },
      uHoverMix: { value: 0 },
      uDragMix: { value: 0 },
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

function Scene({ onHoverChange }: { onHoverChange?: (hovered: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hoverScale = useRef(1);
  const dragScale = useRef(1); // Smooth scale for grab/release
  
  // Drag state
  const dragStart = useRef({ x: 0, y: 0 });
  const dragCurrent = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 }); // Character position with resistance
  const shiverOffset = useRef({ x: 0, y: 0, rotation: 0 }); // Shivering motion
  const canvasRect = useRef<DOMRect | null>(null);
  
  // Global event listeners for drag outside canvas
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isDragging && canvasRect.current) {
        const rect = canvasRect.current;
        dragCurrent.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        dragCurrent.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      }
    };
    
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setIsHovered(false);
        onHoverChange?.(false);
        document.body.style.cursor = 'default';
      }
    };
    
    if (isDragging) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      
      return () => {
        window.removeEventListener('pointermove', handleGlobalPointerMove);
        window.removeEventListener('pointerup', handleGlobalPointerUp);
      };
    }
  }, [isDragging, onHoverChange]);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // ===== HOVER SCALE (only when not dragging) =====
    if (!isDragging) {
      const targetScale = isHovered ? HOVER_SCALE : 1.0;
      hoverScale.current += (targetScale - hoverScale.current) * delta * HOVER_TRANSITION_SPEED;
      groupRef.current.scale.set(hoverScale.current, hoverScale.current, 1);
    }
    
    // ===== DRAG SCALE (smooth shrink/grow) =====
    const targetDragScale = isDragging ? DRAG_SCALE_MIN : 1.0;
    dragScale.current += (targetDragScale - dragScale.current) * delta * 10; // Fast smooth transition
    
    // ===== DRAG PHYSICS =====
    if (isDragging) {
      // Calculate pull direction and distance
      const pullX = dragCurrent.current.x - dragStart.current.x;
      const pullY = dragCurrent.current.y - dragStart.current.y;
      
      // Apply resistance (character doesn't move as far as cursor)
      const targetX = pullX * (1 - DRAG_RESISTANCE);
      const targetY = pullY * (1 - DRAG_RESISTANCE);
      
      // Smooth spring-like movement toward target
      dragOffset.current.x += (targetX - dragOffset.current.x) * delta * 8;
      dragOffset.current.y += (targetY - dragOffset.current.y) * delta * 8;
      
      // Generate shivering/shaking effect
      const shiverSpeed = time * SHIVER_FREQUENCY;
      shiverOffset.current.x = Math.sin(shiverSpeed * 2.7) * SHIVER_AMPLITUDE;
      shiverOffset.current.y = Math.cos(shiverSpeed * 3.1) * SHIVER_AMPLITUDE * 0.8;
      shiverOffset.current.rotation = Math.sin(shiverSpeed * 2.3) * SHIVER_AMPLITUDE * 0.5;
    } else {
      // Not dragging - spring back to origin
      dragOffset.current.x += (0 - dragOffset.current.x) * delta * DRAG_SPRING_STIFFNESS;
      dragOffset.current.y += (0 - dragOffset.current.y) * delta * DRAG_SPRING_STIFFNESS;
      
      // Clear shiver
      shiverOffset.current = { x: 0, y: 0, rotation: 0 };
    }
  });
  
  const handlePointerEnter = () => {
    if (!isDragging) {
      setIsHovered(true);
      onHoverChange?.(true);
    }
    document.body.style.cursor = 'grab';
  };
  
  const handlePointerLeave = () => {
    if (!isDragging) {
      setIsHovered(false);
      onHoverChange?.(false);
      document.body.style.cursor = 'default';
    }
  };
  
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    setIsHovered(false);
    onHoverChange?.(false);
    
    // Store canvas rect for global move events
    const rect = e.nativeEvent.target.getBoundingClientRect();
    canvasRect.current = rect;
    
    // Store start position (in normalized canvas coordinates)
    dragStart.current.x = ((e.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1;
    dragStart.current.y = -(((e.nativeEvent.clientY - rect.top) / rect.height) * 2 - 1);
    
    dragCurrent.current = { ...dragStart.current };
    
    document.body.style.cursor = 'grabbing';
  };
  
  const handlePointerMove = (e: any) => {
    if (isDragging) {
      const rect = e.nativeEvent.target.getBoundingClientRect();
      dragCurrent.current.x = ((e.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1;
      dragCurrent.current.y = -(((e.nativeEvent.clientY - rect.top) / rect.height) * 2 - 1);
    }
  };
  
  const handlePointerUp = (e: any) => {
    if (isDragging) {
      setIsDragging(false);
      
      // Always return to idle face when released (regardless of cursor position)
      setIsHovered(false);
      onHoverChange?.(false);
      document.body.style.cursor = 'default';
    }
  };
  
  const handleClick = () => {
    // Navigation removed - no action on click
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
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <FacePlane 
          isHovered={isHovered}
          isDragging={isDragging}
          dragOffset={dragOffset.current}
          shiverOffset={shiverOffset.current}
          dragScale={dragScale.current}
        />
      </group>
    </>
  );
}

export default function HeroFace() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="relative w-full h-screen bg-purple-100">
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
    </div>
  );
}
