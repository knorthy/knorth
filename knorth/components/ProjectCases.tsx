"use client";
// Case files under the project gallery: the gallery is the eye-catcher, this is the proof.
// One black folder holds the highlighted projects as small files. As soon as the "Case files" heading
// is readable, the files come up out of the folder and fan out above it; scrolling past slides them back
// in (it's tied to scroll position, so it reverses when scrolling up too). Galaxy dots and the odd
// shooting star drift behind. Everything else is listed by name below.
import { useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useReducedMotion } from "@/components/useReducedMotionSafe";
import { projects, type Project } from "@/data/projects";
import PartHeading from "@/components/career/PartHeading";
import GalaxyDots from "@/components/GalaxyDots";
import "./project-cases.css";

// Highlighted projects, in this order
const FEATURED_ORDER = ["psometric", "metacampus", "oneindang", "tbltbu", "rl-pfc", "apfc"];
const FAN = [-5, 2, 6, 4, -3, -6]; // resting tilt of each file once it's out

type Layout = {
  compact: boolean;
  fileW: number;
  fileH: number;
  /** where each file lands, relative to the stage's centre line */
  spots: { x: number; y: number }[];
  folderTop: number;
  folderW: number;
  folderH: number;
  height: number;
};

// Three columns when there's room, two on phones (smaller files, title and role only)
function layoutFor(width: number, count: number): Layout {
  const compact = width < 640;
  const cols = compact ? 2 : 3;
  const fileW = compact ? 154 : 232;
  const fileH = compact ? 104 : 148;
  const gapX = compact ? 12 : Math.min(48, (width - cols * fileW) / (cols - 1));
  const gapY = compact ? 16 : 26;
  const rows = Math.ceil(count / cols);
  const spots = Array.from({ length: count }, (_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    return { x: (c - (cols - 1) / 2) * (fileW + gapX), y: r * (fileH + gapY) };
  });
  const folderTop = rows * (fileH + gapY) + (compact ? 40 : 56);
  const folderW = compact ? 272 : 380;
  const folderH = compact ? 168 : 200;
  return { compact, fileW, fileH, spots, folderTop, folderW, folderH, height: folderTop + folderH };
}

// Scroll progress over the whole block (heading + stage; 0 = its top meets the viewport bottom,
// 1 = its bottom leaves the top) at which the files start coming out, are fully out, start going back,
// and are fully back in. Out as soon as the heading is readable; back inside as the block scrolls away.
function timingFor(layout: Layout, headH: number, vh: number): [number, number, number, number] {
  const total = vh + headH + layout.height;
  const start = (vh * 0.04) / total; // heading just peeking over the bottom edge
  const full = Math.max(start + 0.05, (vh * 0.3) / total); // heading readable, about 70% down the screen
  const back = Math.max(full + 0.08, (vh + headH - vh * 0.08) / total); // first row reaching the top
  const done = Math.max(back + 0.08, (vh + headH + layout.folderTop) / total - 0.02); // before the folder goes
  return [start, full, back, done];
}

function CaseFile({ p, index, count, layout, timing, progress, still }: {
  p: Project;
  index: number;
  count: number;
  layout: Layout;
  timing: [number, number, number, number];
  progress: MotionValue<number>;
  still: boolean;
}) {
  const spot = layout.spots[index];
  // Out one after another, back in the reverse order
  const a = index * 0.012;
  const b = (count - 1 - index) * 0.012;
  const [t0, t1, t2, t3] = timing;
  const out = useTransform(progress, [t0 + a, t1 + a, t2 + b, t3 + b], [0, 1, 1, 0], { clamp: true });

  // Inside the folder: stacked near its top edge, so the tops peek out above the pocket
  const inX = (index - (count - 1) / 2) * 7;
  const inY = layout.folderTop + 18 - index * 3;
  const x = useTransform(out, [0, 1], [inX, spot.x]);
  const y = useTransform(out, [0, 1], [inY, spot.y]);
  const rotate = useTransform(out, [0, 1], [index % 2 ? 3 : -3, FAN[index % FAN.length]]);
  const scale = useTransform(out, [0, 0.6, 1], [0.84, 1.03, 1]);

  const no = String(index + 1).padStart(2, "0");
  return (
    <motion.li
      className="case-file-slot"
      style={{
        width: layout.fileW,
        height: layout.fileH,
        marginLeft: -layout.fileW / 2,
        zIndex: 10 + index,
        ...(still ? { x: spot.x, y: spot.y, rotate: FAN[index % FAN.length] / 2 } : { x, y, rotate, scale }),
      }}
    >
      <article className="case-file" style={{ "--tint": p.color } as React.CSSProperties} aria-labelledby={`case-${p.slug}`}>
        <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-foreground/55">
          <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          CASE {no}
        </p>
        <h4 id={`case-${p.slug}`} className={`mt-1.5 font-bold leading-snug text-foreground line-clamp-2 ${layout.compact ? "text-[12.5px]" : "text-[14px]"}`}>
          {p.name}
        </h4>
        {!layout.compact && p.summary && (
          <p className="mt-1.5 text-[11.5px] leading-snug text-foreground/65 line-clamp-2">{p.summary}</p>
        )}
        {p.role && (
          <p className="mt-auto pt-1.5 text-[10.5px] font-semibold leading-tight line-clamp-1" style={{ color: p.color }}>
            {p.role}
          </p>
        )}
      </article>
    </motion.li>
  );
}

export default function ProjectCases() {
  const reduce = useReducedMotion();
  const featured = FEATURED_ORDER.map((slug) => projects.find((p) => p.slug === slug)).filter((p): p is Project => !!p);
  const rest = projects.filter((p) => !FEATURED_ORDER.includes(p.slug));

  const blockRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1100, headH: 120, vh: 900 });
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const head = headRef.current;
    if (!stage || !head) return;
    const measure = () => setSize({ width: stage.clientWidth, headH: head.offsetHeight, vh: window.innerHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(head);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const layout = layoutFor(size.width, featured.length);
  const timing = timingFor(layout, size.headH, size.vh);

  const { scrollYProgress } = useScroll({ target: blockRef, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.6 });

  return (
    <div className="relative w-full mt-10 md:mt-4">
      {/* galaxy behind the whole block, bleeding past the content edges */}
      <div aria-hidden className="absolute inset-x-0 -inset-y-16 pointer-events-none">
        <GalaxyDots />
      </div>

      <div ref={blockRef} className="relative w-full max-w-6xl mx-auto px-6">
        <div ref={headRef} className="pb-8">
          <PartHeading
            size="sm"
            title={<>Case <span style={{ color: "var(--color-accent)" }}>files</span></>}
            description="The details behind the spinning gallery: what each build does and her part in it."
          />
        </div>

        <div ref={stageRef} className="relative" style={{ height: layout.height }}>
          {/* soft light under the folder */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{ top: layout.folderTop - 40, width: layout.folderW * 1.6, height: layout.folderH * 1.4, background: "radial-gradient(closest-side, rgba(247,37,133,0.16), transparent)", filter: "blur(10px)" }}
          />

          {/* folder back, with its tab */}
          <div
            aria-hidden
            className="case-folder-back"
            style={{ top: layout.folderTop, width: layout.folderW, height: layout.folderH, marginLeft: -layout.folderW / 2 }}
          >
            <span className="case-folder-tab font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              ~/case-files
            </span>
          </div>

          <ul className="absolute inset-x-0 top-0 h-0">
            {featured.map((p, i) => (
              <CaseFile key={p.slug} p={p} index={i} count={featured.length} layout={layout} timing={timing} progress={progress} still={reduce} />
            ))}
          </ul>

          {/* folder front pocket, in front of the files */}
          <div
            aria-hidden
            className="case-folder-front"
            style={{ top: layout.folderTop + 34, width: layout.folderW, height: layout.folderH - 34, marginLeft: -layout.folderW / 2 }}
          >
            <span className="font-mono text-[11px] tracking-[0.16em] text-foreground/45">
              {String(featured.length).padStart(2, "0")} FILES
            </span>
          </div>
        </div>

        {rest.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative mt-10 text-sm text-foreground/65"
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
    </div>
  );
}
