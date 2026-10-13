"use client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { certifications } from "@/data/career";
import { EASE_OUT, VIEWPORT } from "./motion";

// Only 3 slots: left peek | center | right peek
const SLOTS = [
  { x: "-60%", rotate: -6, scale: 0.88, zIndex: 1, opacity: 0.55 }, // left
  { x:    "0%", rotate:  0, scale: 1.00, zIndex: 3, opacity: 1    }, // center (active)
  { x:  "60%", rotate:  6, scale: 0.88, zIndex: 1, opacity: 0.55 }, // right
];

function slotIndex(cardIdx: number, activeIdx: number, total: number) {
  let offset = cardIdx - activeIdx;
  if (offset < -1) offset += total;
  if (offset >  1) offset -= total;
  // still out of range after wrap? hide it
  if (offset < -1 || offset > 1) return null;
  return offset + 1; // -1→0, 0→1, +1→2
}

export default function CertificationsGrid() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const total = certifications.length;

  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);

  return (
    <section id="certifications" className="relative py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-foreground/40 mb-8">03 — Certifications</p>

      {/* Deck */}
      <div className="relative flex items-center justify-center" style={{ height: 280 }}>
        {/* Arrows */}
        <button onClick={prev} aria-label="Previous"
          className="absolute left-0 z-10 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 bg-surface hover:bg-surface2 transition-colors text-foreground/50 hover:text-foreground text-lg">
          ‹
        </button>
        <button onClick={next} aria-label="Next"
          className="absolute right-0 z-10 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 bg-surface hover:bg-surface2 transition-colors text-foreground/50 hover:text-foreground text-lg">
          ›
        </button>

        {/* Cards */}
        <div className="relative w-56" style={{ height: 260 }}>
          {certifications.map((cert, i) => {
            const si = slotIndex(i, active, total);
            if (si === null) return null;
            const slot = SLOTS[si];
            const isActive = i === active;

            return (
              <motion.div
                key={cert.name}
                onClick={() => !isActive && setActive(i)}
                animate={reduce ? {} : {
                  x: slot.x,
                  rotate: slot.rotate,
                  scale: slot.scale,
                  opacity: slot.opacity,
                  zIndex: slot.zIndex,
                }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="absolute inset-0"
                style={{
                  cursor: isActive ? "default" : "pointer",
                  transformOrigin: "bottom center",
                  zIndex: slot.zIndex,
                }}
              >
                <article
                  className="w-full h-full flex flex-col items-center justify-between text-center p-5 rounded-2xl"
                  style={{
                    background: isActive ? "#222222" : "#1a1a1a",
                    border: `1px solid ${isActive ? cert.color + "50" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isActive ? `0 8px 32px rgba(0,0,0,0.4)` : "none",
                  }}
                >
                  {/* Icon */}
                  <span
                    className="grid place-items-center w-12 h-12 rounded-xl shrink-0"
                    style={{
                      background: "#2a2a2a",
                      border: `1px solid ${cert.color}45`,
                    }}
                  >
                    <cert.icon aria-hidden className="w-6 h-6" style={{ color: cert.color }} />
                  </span>

                  {/* Name + issuer */}
                  <div className="flex flex-col gap-1 flex-1 justify-center mt-3">
                    <h3 className="text-sm font-bold text-foreground leading-snug px-1">{cert.name}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-foreground/40 mt-1">{cert.issuer}</p>
                  </div>

                  {/* Verify */}
                  {cert.credentialUrl ? (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors mt-2"
                    >
                      ‹ Verify ›
                    </a>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-foreground/20 mt-2">
                      ‹ Verify ›
                    </span>
                  )}
                </article>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Active label + dots */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="text-xs text-foreground/35 uppercase tracking-widest"
          >
            {certifications[active].name}
          </motion.p>
        </AnimatePresence>

        <div className="flex gap-1.5 items-center">
          {certifications.map((cert, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to ${cert.name}`}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === active ? 18 : 5,
                height: 5,
                background: i === active ? certifications[active].color : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
