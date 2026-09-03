"use client";

import { useRef, useState, useEffect } from "react";

// ── Same colors & timing as HeroFace ─────────────────────────────────────────
const WIPE_ACCENT1 = "#f72585";
const WIPE_ACCENT2 = "#b5ff4d";
const WIPE_ACCENT3 = "#ffe566";
const WIPE_ACCENT4 = "#a855f7";

const WIPE_COLORS        = [WIPE_ACCENT3, WIPE_ACCENT2, WIPE_ACCENT1, WIPE_ACCENT4];
const WIPE_BURST_DURATION = 320;  // ms — each circle expands over this time
const WIPE_STAGGER        = 180;  // ms — delay between each circle launch
const WIPE_HOLD_DURATION  = 120;  // ms — pause at full coverage before reveal
const WIPE_REVEAL_DURATION = 450; // ms — final circle shrinks away on arrival

export interface CircleWipeProps {
  origin: { x: number; y: number };
  onCovered: () => void;
  onDone: () => void;
}

export function CircleWipe({ origin, onCovered, onDone }: CircleWipeProps) {
  const [radii, setRadii] = useState<number[]>(WIPE_COLORS.map(() => 0));
  const [revealRadius, setRevealRadius] = useState<number | null>(null);
  const coveredFired = useRef(false);
  const startTime = useRef<number | null>(null);

  const maxR = Math.ceil(
    Math.sqrt(
      Math.max(origin.x, window.innerWidth  - origin.x) ** 2 +
      Math.max(origin.y, window.innerHeight - origin.y) ** 2
    )
  );

  useEffect(() => {
    let raf: number;

    const tick = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed = ts - startTime.current;

      // ── Burst phase ──────────────────────────────────────────────────────
      const newRadii = WIPE_COLORS.map((_, i) => {
        const circleStart = i * WIPE_STAGGER;
        const t = Math.max(0, Math.min(1, (elapsed - circleStart) / WIPE_BURST_DURATION));
        // easeInOut cubic
        const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        return eased * maxR;
      });
      setRadii(newRadii);

      const lastStart = (WIPE_COLORS.length - 1) * WIPE_STAGGER;
      const lastT = Math.max(0, Math.min(1, (elapsed - lastStart) / WIPE_BURST_DURATION));

      if (lastT >= 1 && !coveredFired.current) {
        coveredFired.current = true;
        onCovered();

        const holdStart = ts;
        const reveal = (ts2: number) => {
          const re = ts2 - holdStart;
          if (re < WIPE_HOLD_DURATION) {
            raf = requestAnimationFrame(reveal);
            return;
          }
          // easeOut cubic shrink
          const rt = Math.min(1, (re - WIPE_HOLD_DURATION) / WIPE_REVEAL_DURATION);
          const reased = 1 - (1 - rt) ** 3;
          setRevealRadius((1 - reased) * maxR);
          if (rt < 1) {
            raf = requestAnimationFrame(reveal);
          } else {
            onDone();
          }
        };
        raf = requestAnimationFrame(reveal);
        return;
      }

      if (lastT < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-9999 pointer-events-none overflow-hidden">
      {WIPE_COLORS.map((color, i) => {
        const isLast = i === WIPE_COLORS.length - 1;
        const r = revealRadius !== null ? (isLast ? revealRadius : maxR) : radii[i];
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backgroundColor: color,
              clipPath: `circle(${r}px at ${origin.x}px ${origin.y}px)`,
              willChange: "clip-path",
            }}
          />
        );
      })}
    </div>
  );
}
