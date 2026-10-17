"use client";
// Kniah, the pixel cat, redrawn from the reference sprite: a rounded loaf with a stepped, sloping back,
// both ears up on the right, short vertical-slit eyes, a thick hooked tail on the left and no outline,
// in flat pink. Layers are separate so each part can act on its own (each ear twitches by itself);
// `mood` switches routines.
import { useEffect, useRef } from "react";
import PixelGrid, { type Palette } from "./PixelGrid";
import "./kno.css";

export type KnoMood = "idle" | "flip" | "sing" | "spin" | "sleep" | "think" | "sit" | "dizzy";

const PALETTE: Palette = {
  B: "#ff7eb9", // fur
  I: "#d94b8c", // inner ears
  E: "#7a1048", // eyes
  P: "#ff5aa5", // paws
  N: "#ffd1e6", // notes, z's, thought dots
};
const SPARKLE = "#ff9fcb";

// The cat is a 25x17 grid placed at (OX, OY) in a 34x25 canvas; sparkles sit in the margins.
const OX = 4;
const OY = 3;

// Whole ears (tip, base and inner ear), one layer each so they twitch, perk, droop and swivel on their own.
// The last two rows are a root that sits hidden behind the head: when an ear tilts or lifts, the root
// fills the gap, so the ear never comes away from the head.
const EAR_LEFT = ["...B...", "..BBB..", ".BBIBB.", "BBIIBBB", "BBBBBBB", ".BBBBB."]; // grid columns 10-16
const EAR_RIGHT = ["...B..", "..BBB.", ".BBIBB", "BBBIBB", "BBBBBB", ".BBBB."]; // grid columns 18-23
const BODY = [
  ".........BBBBBBBBBBBBBBB.",
  "........BBBBBBBBBBBBBBBB.",
  "......BBBBBBBBBBBBBBBBBB.",
  "......BBBBBBBBBBBBBBBBBB.",
  "......BBBBBBBBBBBBBBBBBB.",
  "......BBBBBBBBBBBBBBBBBB.",
  "......BBBBBBBBBBBBBBBBBB.",
  "...BBBBBBBBBBBBBBBBBBBBB.",
  "....BBBBBBBBBBBBBBBBBBBB.",
  ".....BBBBBBBBBBBBBBBBBBB.",
  "......BBBBBBBBBBBBBBBBB..",
  ".......BBBBBBBBBBBBBBB...",
  ".........BBBBBBBBBBBB....",
];
// Hooked tail rising off the bottom-left of the body
const TAIL = [
  "BBB...",
  "BBBB..",
  ".BBBB.",
  "..BBBB",
];
// Eye sprites, drawn at body columns 13 and 20
const EYES: Record<"open" | "closed" | "happy" | "dizzy", string[]> = {
  open: ["E", "E"],
  closed: ["...", "EEE"],
  happy: [".E.", "E.E"],
  dizzy: ["E.E", ".E.", "E.E"],
};
const PAWS = ["PPP"];
const NOTE = [".NN", ".N.", ".N.", "NN.", "NN."];
const Z = ["NNN", "..N", ".N.", "N..", "NNN"];

function Star({ x, y, delay, big = false }: { x: number; y: number; delay: number; big?: boolean }) {
  // 4-point sparkle with concave sides, like the reference
  const rows = big
    ? ["...N...", "...N...", "..NNN..", "NNNNNNN", "..NNN..", "...N...", "...N..."]
    : ["..N..", ".NNN.", "NNNNN", ".NNN.", "..N.."];
  const r = (rows.length - 1) / 2;
  return (
    <g className="kno-sparkle" style={{ animationDelay: `${delay}s` }}>
      <PixelGrid rows={rows} palette={{ N: SPARKLE }} x={x - r} y={y - r} />
    </g>
  );
}
function Dot({ x, y, delay }: { x: number; y: number; delay: number }) {
  return <circle className="kno-sparkle" style={{ animationDelay: `${delay}s` }} cx={x} cy={y} r={0.8} fill={SPARKLE} />;
}
function Ring({ x, y, delay }: { x: number; y: number; delay: number }) {
  return <circle className="kno-sparkle" style={{ animationDelay: `${delay}s` }} cx={x} cy={y} r={1.2} fill="none" stroke={SPARKLE} strokeWidth={0.6} />;
}

export default function KnoCat({ size = 72, mood = "idle", track = true, decor = true, className = "" }: {
  size?: number;
  mood?: KnoMood;
  /** eyes follow the pointer (paused while sleeping or thinking) */
  track?: boolean;
  /** sparkles, dots and rings around the cat */
  decor?: boolean;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const lidRef = useRef<SVGGElement>(null);
  const moodRef = useRef(mood);

  const eyeShape =
    mood === "sleep" ? "closed" : mood === "dizzy" ? "dizzy" : mood === "sing" || mood === "sit" ? "happy" : "open";

  useEffect(() => {
    moodRef.current = mood;
    if ((mood === "sleep" || mood === "think" || mood === "dizzy") && eyesRef.current) eyesRef.current.style.transform = "";
  }, [mood]);

  // Blink at random intervals (kept even with reduced motion: it's tiny and reads as alive)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const lid = lidRef.current;
        if (lid && !document.hidden && moodRef.current !== "sleep") {
          lid.classList.add("kno-blink");
          setTimeout(() => lid.classList.remove("kno-blink"), 140);
        }
        schedule();
      }, 2200 + Math.random() * 3400);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // Eyes look toward the pointer, a fraction of a pixel at most
  useEffect(() => {
    if (!track) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const svg = svgRef.current;
        const eyes = eyesRef.current;
        const m = moodRef.current;
        if (!svg || !eyes || m === "sleep" || m === "think" || m === "dizzy") return;
        const r = svg.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, d / 260);
        eyes.style.transform = `translate(${((dx / d) * 0.8 * reach).toFixed(2)}px, ${((dy / d) * 0.6 * reach).toFixed(2)}px)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, [track]);

  const eyeRows = EYES[eyeShape];
  const eyeShift = eyeShape === "open" ? 0 : -1; // wider sprites stay centred on the slit
  const eyeY = OY + 10 - (eyeShape === "dizzy" ? 0.5 : 0);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 34 25"
      width={size}
      height={(size * 25) / 34}
      shapeRendering="crispEdges"
      aria-hidden
      data-mood={mood}
      className={`kno overflow-visible ${className}`}
    >
      {decor && (
        <g className="kno-decor">
          <Star x={7} y={4} delay={0} />
          <Dot x={4} y={7.5} delay={0.6} />
          <g className="kno-decor-tr">
            <Star x={30} y={2} delay={0.8} />
            <Ring x={32.6} y={5.4} delay={0.3} />
          </g>
          <Star x={8} y={20} delay={1.2} big />
          <Star x={12} y={22.5} delay={0.4} />
          <Dot x={9} y={24} delay={1.6} />
          <Star x={31.5} y={20} delay={1} />
          <Ring x={28} y={23.2} delay={0.2} />
        </g>
      )}

      {/* Mood extras, outside the body so they don't spin or flip with it */}
      {mood === "sing" && (
        <g>
          <PixelGrid className="kno-note" rows={NOTE} palette={PALETTE} x={28} y={2} />
          <PixelGrid className="kno-note kno-note-2" rows={NOTE} palette={PALETTE} x={30.5} y={5} />
        </g>
      )}
      {mood === "sleep" && (
        <g>
          <PixelGrid className="kno-z kno-z-small" rows={Z} palette={PALETTE} x={28} y={1} />
          <PixelGrid className="kno-z kno-z-2" rows={Z} palette={PALETTE} x={31} y={-3} />
        </g>
      )}
      {mood === "dizzy" && (
        <g className="kno-orbit">
          <Star x={10} y={0} delay={0} />
          <Star x={24} y={0} delay={0.3} />
          <Dot x={17} y={-2.5} delay={0.6} />
        </g>
      )}
      {mood === "think" && (
        <g>
          <rect className="kno-think-dot" x={28} y={2} width={1} height={1} fill={PALETTE.N} />
          <rect className="kno-think-dot kno-think-dot-2" x={30} y={0.5} width={1.5} height={1.5} fill={PALETTE.N} />
          <rect className="kno-think-dot kno-think-dot-3" x={32.5} y={-1.5} width={2} height={2} fill={PALETTE.N} />
        </g>
      )}

      <g className="kno-mover">
        <g className="kno-body">
          <PixelGrid className="kno-tail" rows={TAIL} palette={PALETTE} x={OX} y={OY + 7} />
          {mood === "sit" && (
            <g className="kno-paws">
              <PixelGrid rows={PAWS} palette={PALETTE} x={OX + 10} y={OY + 17} />
              <PixelGrid rows={PAWS} palette={PALETTE} x={OX + 16} y={OY + 17} />
            </g>
          )}
          <g className="kno-ears">
            <PixelGrid className="kno-ear kno-ear-l" rows={EAR_LEFT} palette={PALETTE} x={OX + 10} y={OY} />
            <PixelGrid className="kno-ear kno-ear-r" rows={EAR_RIGHT} palette={PALETTE} x={OX + 18} y={OY} />
          </g>
          <PixelGrid rows={BODY} palette={PALETTE} x={OX} y={OY + 4} />
          <g ref={eyesRef} className="kno-eyes">
            <g className="kno-look">
              <g ref={lidRef} className="kno-lids">
                <PixelGrid rows={eyeRows} palette={PALETTE} x={OX + 13 + eyeShift} y={eyeY} />
                <PixelGrid rows={eyeRows} palette={PALETTE} x={OX + 20 + eyeShift} y={eyeY} />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
