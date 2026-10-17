"use client";
// Scroll story (reference: nickho-motorsports.nl history section).
// Desktop: photos scroll in the middle column and open through a clip-path window as they reach the
// centre; the title (left) and details (right) stay pinned and swap with a masked slide. A light in
// the active job's colour follows behind.
// Mobile: a stacked list with the same clip reveal.
// After the jobs, "side quests" (leadership & volunteering) run sideways: a pinned horizontal track of
// lanyard badges that swing with scroll speed.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence, motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, useVelocity, type MotionValue, type Variants,
} from "framer-motion";
import { useReducedMotion } from "@/components/useReducedMotionSafe";
import { useIsMobile } from "@/components/useIsMobile";
import { TbArrowNarrowRight } from "react-icons/tb";
import { jobs, affiliations, type Job, type Affiliation } from "@/data/career";
import { EASE_OUT, enter, ENTER_DURATION_LG } from "./motion";
import PartHeading from "./PartHeading";

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
    <span className="flex gap-2.5 text-sm leading-relaxed text-foreground/70">
      <span aria-hidden className="mt-[0.55em] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
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
      className="w-full h-full flex flex-col justify-between p-7 md:p-8"
      style={{ background: `linear-gradient(160deg, ${job.color}40 0%, #161616 72%)` }}
    >
      <span className="block text-7xl font-bold leading-[0.8] tracking-[-0.03em] tabular-nums" style={{ color: job.color }}>
        {pad(index + 1)}
      </span>
      <span className="flex flex-col gap-2 max-w-[24ch]">
        <span aria-hidden className="h-px w-8" style={{ background: job.color }} />
        <span className="text-sm font-medium leading-snug text-foreground/80 text-balance">{job.category}</span>
      </span>
    </div>
  );
}

// Clip-path window that opens as an element approaches the middle of the screen and closes after.
function useWindowClip(progress: MotionValue<number>) {
  const side = useTransform(progress, [0, 0.38, 0.62, 1], [14, 0, 0, 14]);
  const top = useTransform(progress, [0, 0.38], [22, 0], { clamp: true });
  const bottom = useTransform(progress, [0.62, 1], [0, 22], { clamp: true });
  return useMotionTemplate`inset(${top}% ${side}% ${bottom}% ${side}% round 18px)`;
}

// ── Story photo: opens, scales up and straightens as it passes the middle of the screen ──
function StoryPhoto({ job, index, isActive, register }: {
  job: Job; index: number; isActive: boolean; register: (el: HTMLDivElement | null) => void;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const side = index % 2 === 0 ? 1 : -1;
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.82, 1, 0.82]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [side * -6, 0, side * 6]);
  const transform = useMotionTemplate`scale(${scale}) rotate(${rotate}deg)`;
  const clipPath = useWindowClip(scrollYProgress);
  const innerY = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);

  return (
    <div
      ref={(el) => { ref.current = el; register(el); }}
      data-index={index}
      className="aspect-[4/5]"
      style={{
        opacity: isActive ? 1 : 0.4,
        filter: isActive ? "grayscale(0)" : "grayscale(1)",
        transition: "opacity 400ms ease, filter 400ms ease",
      }}
    >
      <motion.div
        className="w-full h-full rounded-[18px] overflow-hidden"
        style={reduce ? undefined : { transform, clipPath }}
      >
        {job.image ? (
          // Photos drift against the frame, so they read as seen through a window
          <motion.div className="w-full h-[118%] -mt-[9%]" style={reduce ? undefined : { y: innerY }}>
            <JobVisual job={job} index={index} />
          </motion.div>
        ) : (
          // Colour tiles stay put so the number and label keep their padding
          <JobVisual job={job} index={index} />
        )}
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
    document.getElementById("side-quests")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <DirContext.Provider value={dirRef}>
    <div className="relative hidden md:block">
      {/* Light in the active job's colour, pinned behind the photo column */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="sticky top-0 h-svh flex items-center justify-center">
          <motion.div
            className="w-[520px] h-[520px] rounded-full"
            animate={{ backgroundColor: job.color }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
            style={{ opacity: 0.16, filter: "blur(90px)" }}
          />
        </div>
      </div>

      <div className="relative grid grid-cols-[1fr_minmax(0,300px)_1fr] gap-12 lg:gap-16">
        {/* LEFT — pinned title */}
        <div>
          <div className="sticky top-0 h-svh flex flex-col justify-center">
            <div className="relative">
            {/* The part heading hangs just above the pinned title, so it stays with the details */}
            <PartHeading
              size="xs"
              className="absolute bottom-full left-0 right-0 mb-8"
              title={<>Put to <span style={{ color: "var(--color-accent)" }}>work</span></>}
              description="Where I've worked so far. Scroll through each role."
            />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={active} initial="enter" animate="show" exit="exit">
                <MaskLine className="text-xs font-medium tracking-wide mb-3" index={0}>
                  <span style={{ color: job.color }}>{job.period}</span>
                </MaskLine>
                <h4 className="text-4xl lg:text-5xl font-bold uppercase leading-[0.95] tracking-tight text-balance">
                  {job.role.split(" ").map((word, i) => (
                    <MaskLine key={word + i} index={i + 1}>{word}</MaskLine>
                  ))}
                </h4>
              </motion.div>
            </AnimatePresence>
            </div>
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
          <div className="sticky top-0 h-svh flex flex-col justify-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={active} initial="enter" animate="show" exit="exit" className="space-y-3 max-w-[38ch]">
                <MaskLine className="text-sm text-foreground/55" index={0}>
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
                className="text-xs tracking-wide text-foreground/65 hover:text-foreground transition-colors"
              >
                Skip to side quests
              </button>
              <p className="flex items-center gap-2 text-sm font-bold tabular-nums">
                <span aria-hidden className="w-2 h-2 rounded-full" style={{ background: job.color }} />
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
                <span className="text-foreground/60">/ {pad(jobs.length)}</span>
              </p>
            </div>
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

function MobileJob({ job, index }: { job: Job; index: number }) {
  const reduce = useReducedMotion();
  const fadeUp = useFadeUp();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const clipPath = useWindowClip(scrollYProgress);
  return (
    <motion.li variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
      <motion.div ref={ref} className="aspect-[16/9] rounded-[18px] overflow-hidden mb-5" style={reduce ? undefined : { clipPath }}>
        <JobVisual job={job} index={index} />
      </motion.div>
      <p className="text-xs font-medium tracking-wide mb-1" style={{ color: job.color }}>{job.period}</p>
      <h4 className="text-2xl font-bold uppercase tracking-tight">{job.role}</h4>
      <p className="text-sm text-foreground/55 mb-4">
        {job.company} <span className="text-foreground/30">·</span> {job.type}
      </p>
      <ul className="space-y-3">
        {job.bullets.map((b) => <li key={b}><Bullet text={b} color={job.color} /></li>)}
      </ul>
    </motion.li>
  );
}

function MobileList() {
  return (
    <div className="md:hidden">
      <PartHeading
        size="xs"
        className="mb-8"
        title={<>Put to <span style={{ color: "var(--color-accent)" }}>work</span></>}
        description="Where I've worked so far."
      />
      <ol className="flex flex-col gap-12">
        {jobs.map((job, i) => <MobileJob key={job.role} job={job} index={i} />)}
      </ol>
    </div>
  );
}

// ── Side quests: leadership & volunteering as lanyard badges on a sideways track ──
// Several roles in the same org share one badge
type Quest = Affiliation & { roles: { role: string; period: string }[] };
const QUESTS: Quest[] = affiliations.reduce<Quest[]>((list, a) => {
  const same = list.find((q) => q.org === a.org && q.kind === a.kind);
  if (same) same.roles.push({ role: a.role, period: a.period });
  else list.push({ ...a, roles: [{ role: a.role, period: a.period }] });
  return list;
}, []);

function Badge({ aff, index, sway }: { aff: Quest; index: number; sway?: MotionValue<number> }) {
  // Alternate swing amount and strap length so the row hangs unevenly, like real lanyards
  const still = useMotionValue(0);
  const swing = useTransform(sway ?? still, (v) => v * (index % 2 === 0 ? 1 : -0.7));
  const strap = 56 + (index % 3) * 28;
  return (
    <motion.li
      className="relative shrink-0 w-[250px] md:w-[290px] snap-start"
      style={{ rotate: sway ? swing : (index % 2 ? 2 : -2), transformOrigin: `50% -${strap}px`, marginTop: strap }}
    >
      {/* strap up to the string */}
      <span
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 w-6 rounded-b-sm"
        style={{
          top: -strap - 2,
          height: strap + 14,
          background: `repeating-linear-gradient(180deg, ${aff.color} 0 10px, color-mix(in srgb, ${aff.color} 75%, #000) 10px 12px)`,
        }}
      />
      <span aria-hidden className="absolute left-1/2 -translate-x-1/2 w-9 h-4 rounded-[4px] bg-[#9a9a9a] z-10" style={{ top: 2, boxShadow: "inset 0 -2px 2px rgba(0,0,0,0.35)" }} />
      <article
        className="relative rounded-[22px] overflow-hidden bg-[#1c1c1c] border border-white/10"
        style={{ boxShadow: "0 24px 40px -16px rgba(0,0,0,0.8)" }}
      >
        <div className="relative h-24 flex items-start justify-center pt-4" style={{ background: aff.color }}>
          <span className="badge-hole" />
          <span className="absolute left-5 bottom-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0e0e0e]">
            {aff.kind === "member" ? "Member" : "Volunteer"}
          </span>
        </div>
        <div className="p-5 pb-6 flex flex-col gap-2 min-h-[210px]">
          <h4 className="text-xl font-bold leading-tight text-balance">{aff.org}</h4>
          <ul className="mt-auto flex flex-col gap-2.5">
            {aff.roles.map((r) => (
              <li key={r.role}>
                <p className="text-sm text-foreground/80 leading-snug">{r.role}</p>
                <p className="text-xs font-medium tabular-nums" style={{ color: `color-mix(in srgb, ${aff.color} 70%, white)` }}>{r.period}</p>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </motion.li>
  );
}

function SideQuestsIntro() {
  return (
    <div className="shrink-0 w-[min(80vw,380px)] self-center pr-6">
      <PartHeading
        title={<>Side <span style={{ color: "var(--color-accent3)" }}>quests</span></>}
        description="Orgs I help run and events I've volunteered for, outside the day job. One badge each."
      />
      <p aria-hidden className="mt-5 inline-flex items-center gap-2 text-xs text-foreground/65">
        keep scrolling <TbArrowNarrowRight className="w-4 h-4" />
      </p>
    </div>
  );
}

// Phones: a native sideways swipe instead of a pinned scroll, a gesture the thumb already knows and
// about two thousand pixels less vertical scrolling
function SwipeQuests({ sectionRef }: { sectionRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div id="side-quests" ref={sectionRef} className="mt-16">
      <PartHeading
        title={<>Side <span style={{ color: "var(--color-accent3)" }}>quests</span></>}
        description="Orgs I help run and events I've volunteered for, outside the day job. One badge each."
      />
      <p aria-hidden className="mt-4 inline-flex items-center gap-2 text-xs text-foreground/65">
        swipe <TbArrowNarrowRight className="w-4 h-4" />
      </p>
      <div className="relative -mx-6 mt-2">
        <span aria-hidden className="absolute left-0 right-0 top-0 h-[2px] bg-white/25" />
        <ul className="flex gap-5 items-start overflow-x-auto snap-x snap-mandatory scroll-px-6 px-6 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUESTS.map((aff, i) => <Badge key={aff.org} aff={aff} index={i} />)}
          <li aria-hidden className="shrink-0 w-1" />
        </ul>
      </div>
    </div>
  );
}

function SideQuests() {
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    if (reduce) return;
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [reduce]);

  const { scrollYProgress, scrollY } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (p) => -p * distance);
  const smoothX = useSpring(x, { stiffness: 160, damping: 32, mass: 0.5 });
  const velocity = useVelocity(scrollY);
  // Scrolling forward drags the badges right-to-left, so they swing back the other way
  const sway = useSpring(useTransform(velocity, [-2000, 0, 2000], [-9, 0, 9], { clamp: true }), {
    stiffness: 90, damping: 9, mass: 0.6,
  });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (mobile && !reduce) return <SwipeQuests sectionRef={sectionRef} />;

  if (reduce) {
    return (
      <div id="side-quests" ref={sectionRef} className="py-20">
        <div className="flex gap-6 overflow-x-auto snap-x pb-6 items-start">
          <SideQuestsIntro />
          <ul className="flex gap-6 items-start">
            {QUESTS.map((aff, i) => <Badge key={aff.org} aff={aff} index={i} />)}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div
      id="side-quests"
      ref={sectionRef}
      className="relative left-1/2 -translate-x-1/2 w-screen mt-16"
      style={{ height: `calc(100vh + ${distance}px)` }}
    >
      <div className="sticky top-0 h-svh overflow-hidden flex flex-col justify-center">
        <motion.div
          ref={trackRef}
          className="relative flex items-start gap-8 md:gap-12 w-max px-6 md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pt-20"
          style={{ x: smoothX }}
        >
          {/* the string the lanyards hang from */}
          <span aria-hidden className="absolute left-0 right-0 top-20 h-[2px] bg-white/25" />
          <SideQuestsIntro />
          <ul className="flex items-start gap-8 md:gap-12">
            {QUESTS.map((aff, i) => (
              <Badge key={aff.org} aff={aff} index={i} sway={sway} />
            ))}
          </ul>
        </motion.div>

        <div aria-hidden className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-[3px] rounded-full bg-white/10 overflow-hidden">
          <motion.span className="block h-full origin-left bg-[var(--color-accent3)]" style={{ scaleX: fill }} />
        </div>
      </div>
    </div>
  );
}

export default function ExperienceTimeline() {
  return (
    <section id="work" className="relative py-16">
      <ScrollStory />
      <MobileList />
      <SideQuests />
    </section>
  );
}
