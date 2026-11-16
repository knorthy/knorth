"use client";
// "sudo make <service>": what Tiffany can be hired for.
// The section pins; scrolling turns a picker wheel (left on desktop, top on phones) through the
// services. The middle shows the active one as a big condensed make-target that types itself in
// letter by letter, and the right is a swipe-through gallery of that service's images: each sweep of the
// divider uncovers the next one, looping. Wheel items and "pairs with" links jump.
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence, animate, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useScroll, useTransform,
} from "framer-motion";
import { useReducedMotion } from "@/components/useReducedMotionSafe";
import { useIsMobile } from "@/components/useIsMobile";
import { TbArrowsHorizontal, TbPlayerPauseFilled, TbPlayerPlayFilled, TbVolume, TbVolumeOff } from "react-icons/tb";
import { services, type Service } from "@/data/services";
import { ACCENT3 } from "@/data/career";
import { EASE_OUT } from "./motion";

const N = services.length;
const indexOf = (slug: string) => services.findIndex((s) => s.slug === slug);
const JUMPS = [["stack", "Stack"], ["work", "Work"], ["side-quests", "Side quests"], ["certifications", "Certificates"]] as const;

// ── Picker wheel ─────────────────────────────────────────────────────────────
function Wheel({ active, onPick, axis }: { active: number; onPick: (i: number) => void; axis: "y" | "x" }) {
  const reduce = useReducedMotion();
  const vertical = axis === "y";

  const onKeyDown = (e: React.KeyboardEvent) => {
    const next = vertical ? "ArrowDown" : "ArrowRight";
    const prev = vertical ? "ArrowUp" : "ArrowLeft";
    if (e.key === next) { e.preventDefault(); onPick(Math.min(N - 1, active + 1)); }
    if (e.key === prev) { e.preventDefault(); onPick(Math.max(0, active - 1)); }
  };

  return (
    <div
      className={vertical ? "relative h-[360px] wheel-mask-y" : "relative h-12 wheel-mask-x"}
      onKeyDown={onKeyDown}
    >
      <ul aria-label="Services">
        {services.map((s, i) => {
          const off = i - active;
          const dist = Math.abs(off);
          const isActive = off === 0;
          return (
            <motion.li
              key={s.slug}
              className={vertical ? "absolute left-0 top-1/2" : "absolute left-1/2 top-1/2"}
              initial={false}
              animate={{
                [axis]: off * (vertical ? 36 : 150),
                scale: Math.max(0.62, 1 - dist * 0.11),
                opacity: dist > 4 ? 0 : Math.max(0.42, 1 - dist * 0.15),
              }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
              style={{ transformOrigin: vertical ? "left center" : "center center" }}
            >
              <button
                onClick={() => onPick(i)}
                aria-current={isActive ? "true" : undefined}
                tabIndex={isActive ? 0 : -1}
                className={`block whitespace-nowrap text-left px-1 transition-colors duration-200 ${
                  vertical ? "py-3 -translate-y-1/2" : "py-4 -translate-x-1/2 -translate-y-1/2"
                } ${isActive ? "text-xl font-bold text-foreground" : "text-lg text-foreground/60 hover:text-foreground"}`}
              >
                {s.name}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Big make-target: letters rise through a mask one after another ───────────
function TypedTarget({ service }: { service: Service }) {
  const reduce = useReducedMotion();
  return (
    <h3
      aria-label={service.name}
      className="font-light leading-[0.95] tracking-[-0.04em] whitespace-nowrap"
      // Sized to its column (container query units) so long targets like "pos-systems" never overflow
      style={{ color: service.color, fontSize: `clamp(36px, calc(100cqw / ${(service.slug.length * 0.56).toFixed(2)}), 104px)` }}
    >
      {service.slug.split("").map((ch, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.06em]">
          <motion.span
            className="inline-block"
            initial={reduce ? { opacity: 0 } : { y: "105%" }}
            animate={reduce ? { opacity: 1 } : { y: "0%" }}
            transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.05 + i * 0.03 }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </h3>
  );
}

function Detail({ service, onPick }: { service: Service; onPick: (i: number) => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.div key={service.slug}>
        <motion.p
          className="hidden md:block font-mono text-xs uppercase tracking-[0.25em] mb-5"
          style={{ color: service.color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {service.category}
        </motion.p>
        <p className="font-mono text-sm text-foreground/50 mb-1">sudo make</p>
        <TypedTarget service={service} />
        <motion.p
          className="mt-4 md:mt-6 text-[15px] md:text-base leading-relaxed text-foreground/75 max-w-[40ch]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.25 }}
        >
          {service.description}
        </motion.p>
        <motion.p
          className="mt-4 md:mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <span>+ pairs with</span>
          {service.pairs.map((slug) => {
            const i = indexOf(slug);
            if (i < 0) return null;
            return (
              <button
                key={slug}
                onClick={() => onPick(i)}
                className="inline-block py-3 -my-3 font-mono underline-offset-4 decoration-1 hover:underline"
                style={{ color: services[i].color }}
              >
                /{slug}
              </button>
            );
          })}
        </motion.p>
    </motion.div>
  );
}

// ── Swipe-through gallery ────────────────────────────────────────────────────
// The line rests near one edge with a sliver of the next image peeking past it. Sweeping it across
// (drag, or click/tap the panel) uncovers that next image; the line then rests at the other edge with
// the following image peeking in, so left, right, left... walks through the service's gallery and
// loops back to the first.
const REST_R = 93;
const REST_L = 7;

type Slide = { src?: string; poster?: string; start?: number; caption: string; variant: number };
const isVideo = (src?: string) => !!src && /\.(mp4|webm|mov)$/i.test(src);

function slidesFor(service: Service): Slide[] {
  return (service.gallery ?? []).map((g, i) => ({ ...g, variant: i }));
}

// Every piece is shown twice: once filling the whole frame as the background, and once whole on top
// (posters are square, videos are 16:9), so nothing gets cropped. The background is only lightly
// softened and dimmed, enough for the piece on top to stand out while staying the same picture.
const FILL = "absolute inset-0 w-full h-full scale-105 blur-[4px] brightness-[0.55]";
const FIT = "absolute inset-0 w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)]";

function Backdrop({ src }: { src: string }) {
  return <img src={src} alt="" aria-hidden draggable={false} className={`${FILL} object-cover`} />;
}

// Plays muted on loop only while it's the visible slide. The buttons sit bottom-centre, clear of the slivers
// that peek in at either edge, and they don't start a sweep.
function VideoSlide({ slide, live }: { slide: Slide; live: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const fillRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(reduce);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (live && !paused) v.play().catch(() => setPaused(true));
    else v.pause();
  }, [live, paused]);

  // The background is the same video, frame for frame: each frame is copied onto a small canvas that
  // covers the panel (cheap at this size, and the softening hides the low resolution). When paused, the
  // last frame stays put.
  useEffect(() => {
    const v = ref.current;
    const c = fillRef.current;
    const ctx = c?.getContext("2d");
    if (!live || paused || !v || !c || !ctx) return;
    c.width = 192;
    c.height = Math.round((192 * c.clientHeight) / Math.max(1, c.clientWidth)) || 108;
    let raf = 0;
    const draw = () => {
      if (v.readyState >= 2 && v.videoWidth) {
        const k = Math.max(c.width / v.videoWidth, c.height / v.videoHeight);
        const w = v.videoWidth * k;
        const h = v.videoHeight * k;
        ctx.drawImage(v, (c.width - w) / 2, (c.height - h) / 2, w, h);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [live, paused]);

  const stop = (e: React.PointerEvent) => e.stopPropagation();
  const btn =
    "grid place-items-center w-11 h-11 md:w-9 md:h-9 rounded-full bg-black/65 backdrop-blur-sm text-foreground/90 hover:bg-black/80 transition-colors";

  return (
    <>
      {slide.poster && <Backdrop src={slide.poster} />}
      {live && <canvas ref={fillRef} aria-hidden className={FILL} />}
      <video
        ref={ref}
        src={live ? `${slide.src}${slide.start ? `#t=${slide.start}` : ""}` : undefined}
        poster={slide.poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label={slide.caption}
        className={FIT}
      />
      {live && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2" onPointerDown={stop} onPointerUp={stop}>
          <button type="button" className={btn} onClick={() => setPaused((p) => !p)} aria-label={paused ? `Play ${slide.caption}` : `Pause ${slide.caption}`}>
            {paused ? <TbPlayerPlayFilled aria-hidden className="w-4 h-4" /> : <TbPlayerPauseFilled aria-hidden className="w-4 h-4" />}
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => { setMuted((m) => !m); setPaused(false); }}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            aria-pressed={!muted}
          >
            {muted ? <TbVolumeOff aria-hidden className="w-4 h-4" /> : <TbVolume aria-hidden className="w-4 h-4" />}
          </button>
        </div>
      )}
    </>
  );
}

function SlideLayer({ slide, live = false }: { slide: Slide; live?: boolean }) {
  if (isVideo(slide.src)) return <VideoSlide key={slide.src} slide={slide} live={live} />;
  if (slide.src) {
    return (
      <>
        <Backdrop src={slide.src} />
        <img src={slide.src} alt={slide.caption} className={FIT} draggable={false} />
      </>
    );
  }
  return null;
}

function Gallery({ service }: { service: Service }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const slides = slidesFor(service);
  const total = slides.length;
  // One piece only: show it as is, with nothing to sweep to
  const single = total === 1;

  const [base, setBase] = useState(0);
  const [side, setSide] = useState<"right" | "left">("right");
  const [touched, setTouched] = useState(false);
  const sideRef = useRef(side);
  const busy = useRef(false);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  useEffect(() => { sideRef.current = side; }, [side]);

  const pos = useMotionValue(REST_R);
  const incoming = (base + 1) % total;

  // New service: start from its first image, line on the right, and nudge it once as a hint
  useEffect(() => {
    if (reduce) { pos.set(REST_R); return; }
    pos.set(100);
    const controls = animate(pos, [100, REST_R, 80, REST_R], {
      duration: 1.6, times: [0, 0.3, 0.62, 1], ease: EASE_OUT, delay: 0.3,
    });
    return () => controls.stop();
  }, [service.slug, reduce, pos]);

  // The incoming image sits on the far side of the line from where the line started
  const clip = useTransform(pos, (p) =>
    side === "right" ? `inset(0 0 0 ${p}%)` : `inset(0 ${100 - p}% 0 0)`,
  );
  const left = useMotionTemplate`${pos}%`;

  const finish = (forward: boolean) => {
    busy.current = false;
    if (!forward) return;
    setBase((b) => (b + 1) % total);
    setSide((s) => (s === "right" ? "left" : "right"));
  };

  const settle = (forward: boolean) => {
    const from = sideRef.current;
    const target = forward ? (from === "right" ? REST_L : REST_R) : (from === "right" ? REST_R : REST_L);
    busy.current = true;
    if (reduce) { pos.set(target); finish(forward); return; }
    animate(pos, target, { type: "spring", stiffness: 170, damping: 26, onComplete: () => finish(forward) });
  };

  const sweep = () => {
    if (busy.current) return;
    setTouched(true);
    settle(true);
  };

  const setFromClientX = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    pos.set(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <figure>
      <div
        ref={ref}
        className={`relative aspect-[2/1] md:aspect-[16/11] rounded-2xl overflow-hidden border border-white/10 select-none touch-pan-y ${single ? "" : "cursor-ew-resize"}`}
        style={{ boxShadow: "0 30px 60px -24px rgba(0,0,0,0.8)" }}
        onPointerDown={(e) => {
          if (single || busy.current) return;
          pos.stop();
          drag.current = { x: e.clientX, moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (!d.moved && Math.abs(e.clientX - d.x) < 4) return;
          d.moved = true;
          setTouched(true);
          setFromClientX(e.clientX);
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          if (!d.moved) { sweep(); return; }
          const p = pos.get();
          settle(sideRef.current === "right" ? p < 50 : p > 50);
        }}
        onPointerCancel={() => { if (drag.current) { drag.current = null; settle(false); } }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={service.slug}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SlideLayer key={base} slide={slides[base]} live />
            {!single && (
              <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
                <SlideLayer key={incoming} slide={slides[incoming]} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {!single && (
          <>
            <motion.span
              className="absolute top-3 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/60 text-xs text-foreground/85 whitespace-nowrap pointer-events-none"
              animate={{ opacity: touched ? 0 : 1 }}
            >
              drag the line
            </motion.span>

            {/* divider + handle */}
            <motion.div className="absolute inset-y-0 w-0.5 -ml-px pointer-events-none" style={{ left, background: service.color }} />
            <motion.button
              type="button"
              aria-label={`Show next ${service.name} image (${incoming + 1} of ${total})`}
              // pointer clicks are handled by the panel; this covers Enter/Space from the keyboard
              onClick={(e) => { if (e.detail === 0) sweep(); }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 md:w-9 md:h-9 rounded-full grid place-items-center text-[#0e0e0e]"
              style={{ left, background: service.color, boxShadow: "0 6px 16px -4px rgba(0,0,0,0.6)" }}
            >
              <TbArrowsHorizontal aria-hidden className="w-4 h-4" />
            </motion.button>
          </>
        )}
      </div>
      <figcaption className="mt-3 md:mt-4 flex items-center justify-between gap-4 font-mono text-xs text-foreground/50">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${service.slug}-${base}`}
            className="inline-block"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {slides[base].caption}
          </motion.span>
        </AnimatePresence>
        {!single && (
          <span className="tabular-nums shrink-0">
            <span style={{ color: service.color }}>{base + 1}</span> / {total}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
export default function ServicesWheel() {
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = Math.min(N - 1, Math.max(0, Math.floor(p * N)));
    setActive((cur) => (cur === i ? cur : i));
  });

  // Jump by scrolling to the middle of that service's share of the pinned scroll
  const goTo = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / N) * travel, behavior: reduce ? "auto" : "smooth" });
  };

  const service = services[active];

  return (
    <section id="services" ref={sectionRef} className="relative" style={{ height: `${100 + N * (mobile ? 14 : 20)}vh` }}>
      <div className="sticky top-0 h-svh flex flex-col justify-start md:justify-center pt-20 md:pt-0 pb-24 md:pb-0 gap-3 md:gap-8">
        {/* Career intro rides with the panel it introduces */}
        <div>
          <h2 className="font-mono font-semibold text-xl md:text-4xl leading-none tracking-[-0.02em]">
            <span className="text-foreground/50">$ </span>sudo make <span style={{ color: ACCENT3 }}>career</span>
            <span aria-hidden className="inline-block w-[0.5em] h-[0.9em] ml-1.5 align-[-0.1em] animate-pulse" style={{ background: ACCENT3 }} />
          </h2>
          {/* The career part is long; these jump past the pinned parts */}
          <p className="mt-2 md:mt-3 flex flex-wrap items-center gap-x-2.5 md:gap-x-4 text-[13px] leading-snug text-foreground/60">
            <span className="hidden md:inline">What I build, design and wire up.</span>
            <span>Skip to</span>
            {JUMPS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="py-2 font-medium text-foreground/85 underline underline-offset-4 decoration-1 decoration-foreground/30 hover:text-foreground hover:decoration-foreground transition-colors"
              >
                {label}
              </a>
            ))}
          </p>
        </div>
        <div className="md:hidden">
          <Wheel active={active} onPick={goTo} axis="x" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1.1fr)] lg:grid-cols-[170px_minmax(0,0.85fr)_minmax(0,1.3fr)] gap-10 lg:gap-14 items-center">
          <div className="hidden md:block">
            <Wheel active={active} onPick={goTo} axis="y" />
          </div>
          <div className="@container md:min-h-[340px] flex flex-col justify-center">
            <Detail service={service} onPick={goTo} />
          </div>
          {/* no images yet for a service: show the words alone, never a stand-in */}
          {service.gallery?.length ? <Gallery key={service.slug} service={service} /> : null}
        </div>
      </div>
    </section>
  );
}
