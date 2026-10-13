"use client";
// Scroll story (reference: nickho-motorsports.nl history section).
// Desktop: photos scroll in the middle column; the title (left) and details (right) stay pinned
// and swap with a masked slide whenever a new photo crosses the middle of the screen.
// Mobile: a plain stacked list with fade-ins.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  AnimatePresence, motion, useMotionTemplate, useReducedMotion, useScroll, useTransform, type Variants,
} from "framer-motion";
import { jobs, affiliations, type Job, type Affiliation } from "@/data/career";
import { EASE_OUT, enter, ENTER_DURATION_LG } from "./motion";

const SWAP_IN = 0.55; // s — masked text entering
const SWAP_OUT = 0.3; // s — masked text leaving (faster, so the new text isn't kept waiting)
const LINE_STAGGER = 0.05; // s — between masked lines

const pad = (n: number) => String(n).padStart(2, "0");

// ── Masked line: text slides through an overflow-hidden window ───────────────
// Direction is read from a ref at animation time, so a line that exits after the user reverses
// scroll direction still leaves the right way. 1 = scrolling down (enter from below, leave upward).
type DirRef = React.MutableRefObject<number>;
const DirContext = createContext<DirRef>({ current: 1 });
type MaskCustom = { dir: DirRef; i: number };

function maskVariants(reduce: boolean | null): Variants {
  if (reduce) {
    return {
      enter: { opacity: 0 },
      show: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.15 } },
    };
  }
  return {
    enter: ({ dir }: MaskCustom) => ({ transform: `translateY(${dir.current * 105}%)` }),
    show: ({ i }: MaskCustom) => ({
      transform: "translateY(0%)",
      transition: { duration: SWAP_IN, ease: EASE_OUT, delay: i * LINE_STAGGER },
    }),
    exit: ({ dir, i }: MaskCustom) => ({
      transform: `translateY(${dir.current * -105}%)`,
      transition: { duration: SWAP_OUT, ease: [0.77, 0, 0.175, 1], delay: i * (LINE_STAGGER / 2) },
    }),
  };
}

function MaskLine({ children, className, index = 0 }: { children: React.ReactNode; className?: string; index?: number }) {
  const reduce = useReducedMotion();
  const dir = useContext(DirContext);
  return (
    <span className={`block overflow-hidden ${className ?? ""}`}>
      <motion.span className="block" variants={maskVariants(reduce)} custom={{ dir, i: index }}>
        {children}
      </motion.span>
    </span>
  );
}

function Bullet({ text, color }: { text: string; color: string }) {
  const [title, ...rest] = text.split(" — ");
  const body = rest.join(" — ");
  return (
    <span className="flex gap-2 text-sm leading-relaxed text-foreground/70">
      <span aria-hidden className="mt-0.5 shrink-0" style={{ color }}>▸</span>
      <span>
        {body ? <><span className="font-semibold text-foreground/90">{title}</span> — {body}</> : title}
      </span>
    </span>
  );
}

// ── Photo (or color tile fallback) ───────────────────────────────────────────
function JobVisual({ job, index }: { job: Job; index: number }) {
  if (job.image) {
    return <img src={job.image} alt={job.role} className="w-full h-full object-cover" />;
  }
  return (
    <div
      className="w-full h-full flex flex-col justify-between p-6"
      style={{ background: `linear-gradient(160deg, ${job.color}33 0%, #1a1a1a 70%)` }}
    >
      <span className="text-6xl font-bold tracking-tight" style={{ color: job.color }}>{pad(index + 1)}</span>
      <span className="text-xs uppercase tracking-widest text-foreground/60 leading-relaxed">{job.category}</span>
    </div>
  );
}

// ── Story photo: scales up and straightens as it passes the middle of the screen ──
function StoryPhoto({ job, index, isActive, register }: {
  job: Job; index: number; isActive: boolean; register: (el: HTMLDivElement | null) => void;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const side = index % 2 === 0 ? 1 : -1;
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.78, 1, 0.78]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [side * -7, 0, side * 7]);
  const transform = useMotionTemplate`scale(${scale}) rotate(${rotate}deg)`;

  return (
    <div
      ref={(el) => { ref.current = el; register(el); }}
      data-index={index}
      className="aspect-[4/5]"
      style={{
        opacity: isActive ? 1 : 0.35,
        filter: isActive ? "grayscale(0)" : "grayscale(1)",
        transition: "opacity 400ms ease, filter 400ms ease",
      }}
    >
      <motion.div className="w-full h-full rounded-2xl overflow-hidden" style={reduce ? undefined : { transform }}>
        <JobVisual job={job} index={index} />
      </motion.div>
    </div>
  );
}

// ── Desktop scroll story ─────────────────────────────────────────────────────
function ScrollStory() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const dirRef = useRef(1);
  const activeRef = useRef(0);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);

  // A photo becomes active when it crosses a thin band through the middle of the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.index);
          if (i === activeRef.current) continue;
          dirRef.current = i > activeRef.current ? 1 : -1;
          activeRef.current = i;
          setActive(i);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    photoRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const job = jobs[active];

  const skip = () => {
    document.getElementById("certifications")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <DirContext.Provider value={dirRef}>
    <div className="hidden md:grid grid-cols-[1fr_minmax(0,300px)_1fr] gap-12 lg:gap-16">
      {/* LEFT — pinned title */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/40 pt-1 mb-4">02 — Experience</p>
        <div className="sticky top-0 h-screen flex flex-col justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={active} initial="enter" animate="show" exit="exit">
              <MaskLine className="text-[10px] uppercase tracking-widest mb-3" index={0}>
                <span style={{ color: job.color }}>{job.period}</span>
              </MaskLine>
              <h3 className="text-3xl lg:text-5xl font-bold uppercase leading-[0.95] tracking-tight">
                {job.role.split(" ").map((word, i) => (
                  <MaskLine key={word + i} index={i + 1}>{word}</MaskLine>
                ))}
              </h3>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MIDDLE — photos scroll normally; padding lets the first and last reach the centre */}
      <div className="flex flex-col gap-[28vh] py-[30vh]">
        {jobs.map((j, i) => (
          <StoryPhoto
            key={j.role}
            job={j}
            index={i}
            isActive={i === active}
            register={(el) => { photoRefs.current[i] = el; }}
          />
        ))}
      </div>

      {/* RIGHT — pinned details, counter and skip */}
      <div>
        <div className="sticky top-0 h-screen flex flex-col justify-start pt-[calc(1rem+1.5em+1rem)]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={active} initial="enter" animate="show" exit="exit" className="space-y-3">
              <MaskLine className="text-sm text-foreground/50" index={0}>
                {job.company} <span className="text-foreground/30">·</span> {job.type}
              </MaskLine>
              {job.bullets.map((b, i) => (
                <MaskLine key={b} index={i + 1}><Bullet text={b} color={job.color} /></MaskLine>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-24 left-0 right-0 flex items-center justify-between">
            <button
              onClick={skip}
              className="text-xs uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/80 transition-colors"
            >
              skip ↓
            </button>
            <p className="flex items-center gap-2 text-sm font-bold tabular-nums">
              <span aria-hidden className="w-2 h-2" style={{ background: job.color }} />
              <span className="inline-block overflow-hidden h-[1.25em]">
                <AnimatePresence mode="popLayout" initial={false} custom={{ dir: dirRef, i: 0 }}>
                  <motion.span
                    key={active}
                    className="block"
                    variants={maskVariants(reduce)}
                    custom={{ dir: dirRef, i: 0 }}
                    initial="enter"
                    animate="show"
                    exit="exit"
                  >
                    {pad(active + 1)}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="text-foreground/40">/ {pad(jobs.length)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    </DirContext.Provider>
  );
}

// ── Mobile: stacked list ─────────────────────────────────────────────────────
function useFadeUp(): Variants {
  const reduce = useReducedMotion();
  return reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: enter(ENTER_DURATION_LG) } }
    : {
        hidden: { opacity: 0, transform: "translateY(16px)" },
        show: { opacity: 1, transform: "translateY(0px)", transition: enter(ENTER_DURATION_LG) },
      };
}

function MobileList() {
  const fadeUp = useFadeUp();
  return (
    <ol className="md:hidden flex flex-col gap-14">
      {jobs.map((job, i) => (
        <motion.li key={job.role} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5">
            <JobVisual job={job} index={i} />
          </div>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: job.color }}>{job.period}</p>
          <h3 className="text-2xl font-bold uppercase tracking-tight">{job.role}</h3>
          <p className="text-sm text-foreground/50 mb-4">
            {job.company} <span className="text-foreground/30">·</span> {job.type}
          </p>
          <ul className="space-y-3">
            {job.bullets.map((b) => <li key={b}><Bullet text={b} color={job.color} /></li>)}
          </ul>
        </motion.li>
      ))}
    </ol>
  );
}

// ── Leadership & volunteering (compact) ──────────────────────────────────────
function AffiliationColumn({ title, items }: { title: string; items: Affiliation[] }) {
  const fadeUp = useFadeUp();
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest font-bold text-foreground/40 mb-6">{title}</p>
      <ul className="flex flex-col gap-6">
        {items.map((aff) => (
          <motion.li
            key={aff.org}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="relative pl-6"
          >
                        <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full" style={{ background: aff.color }} />
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: aff.color }}>{aff.period}</p>
            <p className="text-base font-semibold text-foreground">{aff.org}</p>
            <p className="text-sm text-foreground/50">{aff.role}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export default function ExperienceTimeline() {
  return (
    <section id="work" className="relative py-20">
      <ScrollStory />
      <MobileList />


    </section>
  );
}
