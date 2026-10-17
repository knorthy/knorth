"use client";
// The paper trail: the section pins while scrolling deals each certificate onto a desk. A card
// drops in from above the viewer, thumps down at its spot, then gets an ink stamp.
// Landed cards can be dragged around (fine pointers) and tapping one pulls it to the top of the pile.
// Reduced motion: a static, slightly scattered pile with no pinning.
import { useRef, useState, useSyncExternalStore } from "react";
import {
  motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue,
} from "framer-motion";
import { useReducedMotion } from "@/components/useReducedMotionSafe";
import { useIsMobile } from "@/components/useIsMobile";
import { TbExternalLink } from "react-icons/tb";
import { certifications, type Certification } from "@/data/career";
import PartHeading from "./PartHeading";

// Where each card lands on the desk (centre point, % of desk) and how it sits
const SPOTS = [
  { x: 27, y: 32, r: -7 },
  { x: 52, y: 25, r: 4 },
  { x: 75, y: 36, r: -3 },
  { x: 36, y: 70, r: 6 },
  { x: 65, y: 68, r: -5 },
  { x: 50, y: 50, r: 2 },
];
// Phones: a tall, narrow desk, so the pile zig-zags down instead of spreading out
const SPOTS_NARROW = [
  { x: 39, y: 12, r: -6 },
  { x: 61, y: 31, r: 5 },
  { x: 40, y: 50, r: -3 },
  { x: 60, y: 69, r: 6 },
  { x: 46, y: 88, r: -4 },
  { x: 50, y: 50, r: 2 },
];

const DEAL_START = 0.06;
const DEAL_STEP = 0.16; // share of the pinned scroll each card gets
const DEAL_LEN = 0.11;

function inkOf(color: string) {
  return `color-mix(in srgb, ${color} 38%, #1b1b1b)`; // dark enough to read on the paper
}

function Stamp({ cert, scale, opacity }: { cert: Certification; scale?: MotionValue<number>; opacity?: MotionValue<number> }) {
  const ink = inkOf(cert.color);
  const label = `${cert.issuer.toUpperCase()} · ISSUED · `;
  const id = `stamp-${cert.name.replace(/\W+/g, "-")}`;
  return (
    <motion.div
      aria-hidden
      className="absolute -right-3 -bottom-4 w-[34%] aspect-square"
      style={{ scale, opacity, rotate: -14, mixBlendMode: "multiply" }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: ink }}>
        <defs>
          <path id={id} d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.85" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
        <text fontSize="10.5" fontWeight="700" fill="currentColor" opacity="0.9">
          <textPath href={`#${id}`} textLength={224} lengthAdjust="spacing">{label}</textPath>
        </text>
      </svg>
      <cert.icon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%]" style={{ color: ink }} />
    </motion.div>
  );
}

function CertCard({ cert, stampScale, stampOpacity }: {
  cert: Certification; stampScale?: MotionValue<number>; stampOpacity?: MotionValue<number>;
}) {
  const isChampion = /champion/i.test(cert.name);
  const [title, honour] = cert.name.split(" — ");
  return (
    <article className="cert-paper relative w-full aspect-[10/7] rounded-[6px] p-[7%] flex flex-col">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[7%] rounded-t-[6px]" style={{ background: cert.color }} />
      {isChampion && (
        <img src="/ribbon-cutout.png" alt="" aria-hidden className="pointer-events-none select-none absolute -right-[9%] -top-[20%] w-[36%] rotate-[16deg] -scale-x-100" />
      )}
      <p className="mt-[4%] flex items-center gap-1.5 text-[clamp(9px,1vw,12px)] font-semibold uppercase tracking-[0.14em]" style={{ color: inkOf(cert.color) }}>
        <cert.icon aria-hidden className="w-[1.2em] h-[1.2em]" />
        {cert.issuer}
      </p>
      <h4 className="mt-[5%] text-[clamp(15px,1.75vw,22px)] font-bold leading-[1.08] tracking-tight text-balance pr-[22%]">
        {title}
      </h4>
      {honour && (
        <p className="mt-auto text-[clamp(11px,1.1vw,13px)] font-semibold" style={{ color: inkOf(cert.color) }}>{honour}</p>
      )}
      {cert.credentialUrl && (
        <a
          href={cert.credentialUrl}
          target="_blank"
          rel="noopener noreferrer"
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="mt-auto pt-[4%] self-start inline-flex items-center gap-1 text-[clamp(10px,1vw,12px)] font-semibold underline underline-offset-4 decoration-1 hover:decoration-2"
        >
          View credential <TbExternalLink aria-hidden className="w-[1.1em] h-[1.1em]" />
        </a>
      )}
      <Stamp cert={cert} scale={stampScale} opacity={stampOpacity} />
    </article>
  );
}

function DealtCard({ cert, index, progress, z, onFront, deskRef, canDrag, narrow }: {
  cert: Certification; index: number; progress: MotionValue<number>; z: number;
  onFront: () => void; deskRef: React.RefObject<HTMLDivElement | null>; canDrag: boolean; narrow: boolean;
}) {
  const spot = (narrow ? SPOTS_NARROW : SPOTS)[index % SPOTS.length];
  const start = DEAL_START + index * DEAL_STEP;
  const raw = useTransform(progress, [start, start + DEAL_LEN], [0, 1], { clamp: true });
  // A light spring on top of the scrubbed value gives the landing a small thump past its rest point
  const t = useSpring(raw, { stiffness: 320, damping: 20, mass: 0.6 });
  const spin = index % 2 === 0 ? -28 : 24;

  const scale = useTransform(t, [0, 1], [1.9, 1]);
  const rotate = useTransform(t, [0, 1], [spot.r + spin, spot.r]);
  const y = useTransform(t, [0, 1], [-140, 0]);
  const opacity = useTransform(raw, [0, 0.25], [0, 1]);
  const blur = useTransform(t, [0, 0.6, 1], [10, 2, 0]);
  // Drop the filter entirely once landed so resting cards aren't kept on a filtered layer
  const filter = useTransform(blur, (b) => (b < 0.05 ? "none" : `blur(${b.toFixed(2)}px)`));

  const stampRaw = useTransform(progress, [start + DEAL_LEN, start + DEAL_LEN + 0.04], [0, 1], { clamp: true });
  const stampT = useSpring(stampRaw, { stiffness: 500, damping: 26 });
  const stampScale = useTransform(stampT, [0, 1], [2.2, 1]);
  const stampOpacity = useTransform(stampRaw, [0, 0.4], [0, 1]);

  return (
    <li
      className="absolute w-[clamp(176px,52vw,214px)] md:w-[clamp(220px,26vw,330px)]"
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%, -50%)", zIndex: z }}
    >
      <motion.div style={{ y, scale, rotate, opacity, filter }}>
        <motion.div
          drag={canDrag}
          dragConstraints={deskRef}
          dragElastic={0.15}
          dragMomentum
          dragTransition={{ power: 0.25, timeConstant: 180 }}
          whileDrag={{ scale: 1.06, rotate: -spot.r * 0.5, cursor: "grabbing" }}
          whileHover={canDrag ? { scale: 1.02 } : undefined}
          onPointerDown={onFront}
          className={canDrag ? "cursor-grab touch-none" : ""}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <CertCard cert={cert} stampScale={stampScale} stampOpacity={stampOpacity} />
        </motion.div>
      </motion.div>
    </li>
  );
}

function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function Heading({ landed, hint }: { landed?: number; hint?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <PartHeading
        title={<>The paper <span style={{ color: "var(--color-accent4)" }}>trail</span></>}
        description={<>Certificates from Cisco and DataCamp, plus a hackathon win.{hint && <> Scroll to deal them out, then {hint}.</>}</>}
      />
      {landed !== undefined && (
        <p className="text-sm text-foreground/55 tabular-nums pb-1">
          <span className="font-bold text-foreground">{landed}</span> / {certifications.length} on the desk
        </p>
      )}
    </div>
  );
}

export default function CertificationsGrid() {
  const reduce = useReducedMotion();
  const canDrag = useMedia("(hover: hover) and (pointer: fine)");
  const narrow = useMedia("(max-width: 767px)");
  const sectionRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const total = certifications.length;
  const mobile = useIsMobile();
  const [order, setOrder] = useState(() => certifications.map((_, i) => i));
  const [landed, setLanded] = useState(0);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    let n = 0;
    for (let i = 0; i < total; i++) if (p >= DEAL_START + i * DEAL_STEP + DEAL_LEN * 0.8) n++;
    setLanded(n);
  });

  const bringToFront = (i: number) => setOrder((o) => (o[o.length - 1] === i ? o : [...o.filter((x) => x !== i), i]));

  if (reduce) {
    return (
      <section id="certifications" ref={sectionRef} className="relative py-20">
        <Heading />
        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {certifications.map((cert, i) => (
            <li key={cert.name} style={{ rotate: `${SPOTS[i % SPOTS.length].r * 0.4}deg` }}>
              <CertCard cert={cert} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      id="certifications"
      ref={sectionRef}
      className="relative"
      style={{ height: `${mobile ? 100 + total * 34 : 120 + total * 55}vh` }}
    >
      <div className="sticky top-0 h-svh flex flex-col pt-24 pb-28 md:pb-10">
        <Heading landed={landed} hint={canDrag ? "drag them around" : "tap one to pull it up"} />
        <div ref={deskRef} className="relative flex-1 mt-5">
          {/* the desk */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-[28px] border border-white/[0.06]"
            style={{
              background:
                "radial-gradient(60% 70% at 50% 45%, rgba(168,85,247,0.10), transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 46px), #141414",
            }}
          />
          <ul className="absolute inset-0">
            {certifications.map((cert, i) => (
              <DealtCard
                key={cert.name}
                cert={cert}
                index={i}
                progress={scrollYProgress}
                z={order.indexOf(i) + 1}
                onFront={() => bringToFront(i)}
                deskRef={deskRef}
                canDrag={canDrag}
                narrow={narrow}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
