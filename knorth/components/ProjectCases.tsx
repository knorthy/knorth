"use client";
// Case files under the project gallery: the gallery is the eye-catcher, this is the proof.
// The highlighted projects get a card styled like an open file (path, name, problem, role, stack, link);
// everything else is listed by name.
// Motion: on scroll each card opens top-down like a file, its path types itself out, then the
// contents rise in; the two columns drift at slightly different speeds. On hover the card lifts,
// takes on the project's colour, and a spotlight follows the cursor.
import { useRef, useSyncExternalStore } from "react";
import { motion, useInView, useScroll, useTransform, type MotionValue, type Variants } from "framer-motion";
import { useReducedMotion } from "@/components/useReducedMotionSafe";
import { ArrowUpRight } from "lucide-react";
import { projects, type Project } from "@/data/projects";
import PartHeading from "@/components/career/PartHeading";
import "./project-cases.css";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
// Highlighted projects, in this order
const FEATURED_ORDER = ["apfc", "homevision", "psometric", "metacampus"];

function useCardVariants(index: number, reduce: boolean): { card: Variants; item: Variants } {
  if (reduce) {
    return {
      card: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } },
      item: { hidden: { opacity: 1 }, show: { opacity: 1 } },
    };
  }
  const delay = (index % 2) * 0.12 + Math.floor(index / 2) * 0.05;
  return {
    card: {
      hidden: { clipPath: "inset(0% 0% 100% 0% round 16px)", y: 28, opacity: 0.4 },
      show: {
        clipPath: "inset(0% 0% 0% 0% round 16px)",
        y: 0,
        opacity: 1,
        transition: { duration: 0.75, ease: EASE_OUT, delay, staggerChildren: 0.07, delayChildren: delay + 0.35 },
      },
    },
    item: {
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
    },
  };
}

// Parallax only makes sense when the cards sit in two columns
function useTwoColumns() {
  return useSyncExternalStore(
    (cb) => { const mq = window.matchMedia("(min-width: 768px)"); mq.addEventListener("change", cb); return () => mq.removeEventListener("change", cb); },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );
}

function CaseCard({ p, index, drift }: { p: Project; index: number; drift: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const twoColumns = useTwoColumns();
  // Watch the unclipped wrapper: the card itself starts fully clipped, which never counts as in view
  const wrapRef = useRef<HTMLLIElement>(null);
  const open = useInView(wrapRef, { once: true, amount: 0.3 });
  const { card, item } = useCardVariants(index, reduce);
  const path = `~/projects/${p.slug}`;

  // Spotlight follows the cursor without re-rendering
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <motion.li ref={wrapRef} style={!reduce && twoColumns && index % 2 ? { y: drift } : undefined}>
      <motion.div
        variants={card}
        initial="hidden"
        animate={open ? "show" : "hidden"}
        onPointerMove={onPointerMove}
        data-open={open}
        className="case-card group relative h-full rounded-2xl border border-white/10 bg-[#141414] overflow-hidden flex flex-col"
        style={{ "--tint": p.color, "--chars": path.length, "--type-ms": `${Math.min(900, path.length * 32)}ms` } as React.CSSProperties}
      >
        <span aria-hidden className="case-glow" />
        {p.image && (
          <img src={p.image} alt={`${p.name} screenshot`} className="relative w-full aspect-[16/9] object-cover border-b border-white/10" />
        )}
        <div className="relative flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.07] bg-[#181818]">
          <span aria-hidden className="case-dot w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="font-mono text-xs text-foreground/60 truncate">
            <span className="sr-only">{path}</span>
            <span aria-hidden className="case-path">{path}</span>
            <span aria-hidden className="case-caret" />
          </span>
        </div>
        <div className="relative p-5 md:p-6 flex flex-col gap-3 flex-1">
          <motion.h4 variants={item} className="text-xl font-bold tracking-tight">
            <span className="case-title">{p.name}</span>
          </motion.h4>
          {p.summary ? (
            <motion.p variants={item} className="text-[15px] leading-relaxed text-foreground/75">{p.summary}</motion.p>
          ) : (
            <motion.p variants={item} className="text-[15px] leading-relaxed text-foreground/55">Case study coming soon.</motion.p>
          )}
          {p.role && <motion.p variants={item} className="text-sm font-medium" style={{ color: p.color }}>{p.role}</motion.p>}
          {p.stack && (
            <motion.ul variants={item} className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-foreground/65" aria-label="Built with">
              {p.stack.map((s) => <li key={s}>{s}</li>)}
            </motion.ul>
          )}
          {p.link && (
            <motion.a
              variants={item}
              href={p.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto pt-2 inline-flex items-center gap-1.5 self-start text-sm font-semibold underline underline-offset-4 decoration-1 hover:decoration-2"
            >
              {p.link.label} <ArrowUpRight size={15} aria-hidden />
            </motion.a>
          )}
        </div>
      </motion.div>
    </motion.li>
  );
}

export default function ProjectCases() {
  const featured = FEATURED_ORDER.map((slug) => projects.find((p) => p.slug === slug)).filter((p): p is Project => !!p);
  const rest = projects.filter((p) => !FEATURED_ORDER.includes(p.slug));

  // The right column drifts a little slower than the left while the grid scrolls past
  const gridRef = useRef<HTMLUListElement>(null);
  const { scrollYProgress } = useScroll({ target: gridRef, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [36, -36]);

  return (
    <div className="relative w-full max-w-6xl mx-auto px-6 mt-10 md:mt-4">
      <PartHeading
        size="sm"
        className="mb-8"
        title={<>Case <span style={{ color: "var(--color-accent)" }}>files</span></>}
        description="The details behind the spinning gallery: what each build does and her part in it."
      />
      <ul ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {featured.map((p, i) => <CaseCard key={p.slug} p={p} index={i} drift={drift} />)}
      </ul>
      {rest.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-sm text-foreground/65"
        >
          Also in the gallery:{" "}
          {rest.map((p, i) => (
            <span key={p.slug}>
              <span className="font-semibold text-foreground/85">{p.name}</span>
              {i < rest.length - 1 ? " · " : ""}
            </span>
          ))}
          .
        </motion.p>
      )}
    </div>
  );
}
