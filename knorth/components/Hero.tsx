"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, FileDown, Linkedin, Github, Twitter, Facebook } from "lucide-react";
import dynamic from "next/dynamic";
import ProjectCases from "@/components/ProjectCases";
import { useEffect, useRef, useState } from "react";
import TiltedCard from "@/components/designs/TiltedCard";
import Contact from "@/components/Contact";
import GalaxyDots from "@/components/GalaxyDots";
import ServicesWheel from "@/components/career/ServicesWheel";
import SkillsSection from "@/components/career/SkillsSection";
import ExperienceTimeline from "@/components/career/ExperienceTimeline";
import CertificationsGrid from "@/components/career/CertificationsGrid";
import { EASE_OUT } from "@/components/career/motion";
import { useReducedMotion } from "@/components/useReducedMotionSafe";
import { RESUME_URL, SOCIALS } from "@/lib/site";

// WebGL only, nothing to server-render; keeps OGL out of the first bundle
const CircularGallery = dynamic(() => import("@/components/designs/CircularGallery"), { ssr: false });

const ACCENT  = "#f72585";
const ACCENT2 = "#b5ff4d";
const ACCENT3 = "#ffe566";
const ACCENT4 = "#a855f7";

// ── ColorTypewriter ──────────────────────────────────────────────────────────
function ColorTypewriter({ strings, colors }: { strings: string[]; colors: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const current = strings[idx];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (displayed.length < current.length) {
        t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 75);
      } else {
        t = setTimeout(() => setPhase("pausing"), 1600);
      }
    } else if (phase === "pausing") {
      t = setTimeout(() => setPhase("deleting"), 400);
    } else {
      if (displayed.length > 0) {
        t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
      } else {
        setIdx((p) => (p + 1) % strings.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(t);
  }, [displayed, phase, idx, strings, reduce]);

  if (reduce) return <span style={{ color: colors[0] }}>{strings[0]}</span>;

  return (
    <span style={{ color: colors[idx % colors.length] }}>
      {displayed}<span className="animate-pulse">|</span>
    </span>
  );
}

// ── Gallery with a "Drag to spin" pill that follows the pointer ───────────────
function GalleryWithCursor() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for pill — same pattern as TiltedCard
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useSpring(0, { stiffness: 300, damping: 30 });
  const rotate = useSpring(0, { stiffness: 350, damping: 30, mass: 1 });
  const lastY = useRef(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    x.set(localX + 12);
    y.set(localY + 8);

    const velocityY = localY - lastY.current;
    rotate.set(-velocityY * 0.6);
    lastY.current = localY;
  };

  const handleMouseEnter = () => {
    opacity.set(1);
  };

  const handleMouseLeave = () => {
    opacity.set(0);
    rotate.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ height: "600px", width: "100%", position: "relative", marginTop: "-80px", cursor: "none" }}
    >
      <CircularGallery bend={1} textColor="#ffffff" borderRadius={0.05} scrollEase={0.05} font="bold 30px Geist" scrollSpeed={2} />

      {/* Pill cursor — mirrors TiltedCard figcaption behavior */}
      <motion.div
        style={{
          x,
          y,
          opacity,
          rotate,
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 50,
        }}
        className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center justify-center shadow-xl border border-black/5"
      >
        <span className="text-[#2d2d2d] font-bold text-xs whitespace-nowrap">
          Drag to spin
        </span>
      </motion.div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
const socialIcons = [
  { icon: <Linkedin size={20} />, link: SOCIALS.linkedin.href, label: "LinkedIn" },
  { icon: <Github size={20} />, link: SOCIALS.github.href, label: "GitHub" },
  { icon: <Twitter size={20} />, link: SOCIALS.x.href, label: "X" },
  { icon: <Facebook size={20} />, link: SOCIALS.facebook.href, label: "Facebook" },
];

const developSkills = ["Next.js", "Tailwind", "React", "Javascript", "CSS", "Node.js", "Python", "SpringBoot", "FlutterFlow"];
const createSkills  = ["Figma", "Canva", "Capcut", "Adobe Premiere Pro", "Adobe Illustrator"];

// The doodles draw themselves once, in reading order: arrow, arrowhead, then the circle round "cover"
const draw = (delay: number, duration = 0.7) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { pathLength: { duration, ease: EASE_OUT, delay }, opacity: { duration: 0.01, delay } },
});

const STICKER = "pointer-events-none select-none absolute object-contain";

export default function Hero() {
  return (
    <div className="flex flex-col w-full overflow-x-clip">

      {/* HOME */}
      <section className="relative flex flex-col items-center justify-center min-h-[calc(100svh-6rem)] pb-10 md:pb-24 px-6 max-w-6xl mx-auto w-full">
        <GalaxyDots count={80} topBias />
        {/* Masked grid background */}
        <div className="absolute pointer-events-none" style={{
          top: 0,
          left: "-10%",
          right: "-10%",
          height: "100%",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 45%, transparent 100%), linear-gradient(to right, transparent 0%, black 18%, black 100%)",
          WebkitMaskComposite: "destination-in",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 45%, transparent 100%), linear-gradient(to right, transparent 0%, black 18%, black 100%)",
          maskComposite: "intersect",
          zIndex: 0,
        }} />
        <img src="/stickers/1.png" alt="" aria-hidden="true" className={`${STICKER} hidden md:block w-36 h-36`} style={{ rotate: "-15deg", zIndex: 0, top: "8%",    left: "-2%" }} />
        <img src="/stickers/2.png" alt="" aria-hidden="true" className={`${STICKER} hidden md:block w-24 h-24`} style={{ rotate: "12deg",  zIndex: 0, top: "-4%",   right: "2%" }} />
        <img src="/stickers/3.png" alt="" aria-hidden="true" className={`${STICKER} hidden md:block w-28 h-28`} style={{ rotate: "20deg",  zIndex: 0, bottom: "12%", left: "30%" }} />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-center w-full">

          {/* LEFT SIDE - the sticker lands with a small settle; it's visible from first paint */}
          <motion.div
            initial={{ scale: 0.94, rotate: -4 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 14, mass: 0.8 }}
            className="flex justify-center md:justify-start order-2 md:order-1"
          >
            <img
              src="/mee.webp"
              alt="Animated sticker of Tiffany Lyssa"
              width={900}
              height={900}
              fetchPriority="high"
              className="w-full max-w-[300px] md:max-w-[500px] h-auto"
            />
          </motion.div>

          {/* RIGHT SIDE - TEXT CONTENT */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right w-full order-1 md:order-2">
            <div className="relative">
              <p className="text-foreground/80 mb-3 italic text-balance">
                Hello! I Am <span style={{ color: ACCENT }} className="font-semibold">Tiffany Lyssa</span>, a software engineer and designer who
              </p>

              <svg aria-hidden className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 w-40 lg:w-56 h-28 pointer-events-none overflow-visible" viewBox="0 0 200 100" fill="none">
                <motion.path d="M190 50 Q100 -15, 15 45" stroke={ACCENT3} strokeWidth="2" strokeLinecap="round" {...draw(0.35)} />
                <motion.path d="M15 45 L20 28 M15 45 L30 45" stroke={ACCENT3} strokeWidth="2" strokeLinecap="round" {...draw(0.95, 0.25)} />
              </svg>
            </div>

            <h1 className="text-[2.75rem] md:text-6xl font-bold leading-[1.08] tracking-tight">
              Judges a book<br />by its{" "}
              <span className="relative inline-block">
                <span className="relative z-10" style={{ color: ACCENT2 }}>cover</span>
                <svg aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[140%] pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.ellipse cx="50" cy="50" rx="45" ry="38" fill="none" stroke={ACCENT4} strokeWidth="1.5" strokeLinecap="round" {...draw(1.15, 0.8)} />
                </svg>
              </span>...
            </h1>
            <p className="mt-4 text-sm md:text-[15px] leading-relaxed text-foreground/65 text-balance">
              Because if the cover does not impress you what else can?
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3">
              <a
                href="#projects"
                className="group inline-flex items-center gap-1.5 py-3 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
              >
                See the work
                <ArrowRight size={16} aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1" />
              </a>
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f0f0f0] text-[#0e0e0e] text-sm font-bold transition-[transform,background-color] duration-150 ease-out hover:bg-white active:scale-[0.97]"
              >
                <FileDown size={16} aria-hidden />
                Resume
              </a>
            </div>

            {/* 44px tap areas around 20px icons; the negative margin lines the glyphs up with the text edge */}
            <div className="flex gap-0.5 -mx-3 mt-4 text-foreground/60">
              {socialIcons.map((item) => (
                <motion.a key={item.label} href={item.link} target="_blank" rel="noopener noreferrer" aria-label={item.label} whileHover={{ y: -3, color: ACCENT }} className="p-3">
                  {item.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative flex flex-col items-center justify-center min-h-screen py-20 md:py-24 px-6 max-w-6xl mx-auto w-full">
        <img src="/stickers/7.png" alt="" aria-hidden="true" loading="lazy" className={`${STICKER} hidden md:block w-28 h-28`} style={{ rotate: "-10deg", zIndex: 0, top: "6%",    left: "2%" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center w-full">

          <div className="flex flex-col justify-center text-left w-full order-2 md:order-1">
            {/* The typed role keeps its own line, so the copy below never jumps when it wraps */}
            <h2 className="text-4xl md:text-5xl font-medium leading-[1.15] mb-10">
              <span className="sr-only">I&apos;m a software engineer, designer and developer.</span>
              <span aria-hidden className="block">I&apos;m a</span>
              <span aria-hidden className="block whitespace-nowrap"><ColorTypewriter strings={["Software Engineer.", "Designer.", "Developer."]} colors={[ACCENT, ACCENT2, ACCENT4]} /></span>
            </h2>

            <div className="space-y-10">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: ACCENT }}>Develop</h3>
                <p className="text-foreground/70 mb-4 max-w-md text-[15px] leading-relaxed">
                  I make meaningful and delightful digital products that create an equilibrium between user needs and business goals.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {developSkills.map((s) => (
                    <li key={s} className="px-3 py-1 rounded-full text-xs text-foreground/85 uppercase tracking-wide"
                      style={{ border: `1px solid ${ACCENT}40` }}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: ACCENT2 }}>Create</h3>
                <p className="text-foreground/70 mb-4 max-w-md text-[15px] leading-relaxed">
                  My content creation journey evolved from a side hustle to serving other creators, achieving meaningful visual storytelling.
                </p>
                <ul className="flex flex-wrap gap-2">
                  {createSkills.map((s) => (
                    <li key={s} className="px-3 py-1 rounded-full text-xs text-foreground/85 uppercase tracking-wide"
                      style={{ border: `1px solid ${ACCENT2}40` }}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          <div className="relative flex justify-center md:justify-end items-center w-full order-1 md:order-2">
            <TiltedCard
              imageSrc="/jennie.jpg" altText="Tiffany Lyssa" captionText="Tiffany Lyssa"
              containerHeight="540px" containerWidth="100%" imageHeight="500px" imageWidth="min(400px, 100%)"
              rotateAmplitude={10} scaleOnHover={1.05} showMobileWarning={false} showTooltip={true} displayOverlayContent={true}
              overlayContent={
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e0e0e]/85 text-white text-xs font-semibold">
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                  Based in PH
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="relative min-h-screen flex flex-col items-center justify-center py-20 md:py-24">
        <img src="/stickers/1.png" alt="" aria-hidden="true" loading="lazy" className={`${STICKER} hidden md:block w-32 h-32`} style={{ rotate: "18deg",  zIndex: 0, top: "15%",   right: "8%" }} />
        <div className="text-center px-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            Things that <span style={{ color: ACCENT }}>run</span>
          </h2>
          <p className="text-foreground/70 text-sm md:text-[15px] leading-relaxed mt-4 max-w-lg mx-auto text-balance">
            10% inspiration, 90% fixing weird margin bugs. A curated showcase of things I&apos;ve designed, built, and actually shipped.
          </p>
        </div>
        <GalleryWithCursor />
        <ProjectCases />
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="relative pt-0 pb-24 px-6 max-w-6xl mx-auto w-full">
        <img src="/stickers/6.png" alt="" aria-hidden="true" loading="lazy" className={`${STICKER} hidden md:block w-32 h-32`} style={{ zIndex: 0, top: 40, right: "4%", rotate: "-8deg" }} />

        <div className="relative">
          {/* Content lives in data/services.ts and data/career.ts */}
          <ServicesWheel />
          <SkillsSection />
          <ExperienceTimeline />
          <CertificationsGrid />
        </div>
      </section>

      {/* CONTACT */}
      <Contact />

    </div>
  );
}
