"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Instagram, Linkedin, Github, Twitter, Figma, Facebook } from "lucide-react";
import ProjectCases from "@/components/ProjectCases";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TiltedCard from "@/components/designs/TiltedCard";
import CircularGallery from "@/components/designs/CircularGallery";
import Contact from "@/components/Contact";
import ServicesWheel from "@/components/career/ServicesWheel";
import SkillsSection from "@/components/career/SkillsSection";
import ExperienceTimeline from "@/components/career/ExperienceTimeline";
import CertificationsGrid from "@/components/career/CertificationsGrid";

const ACCENT  = "#f72585";
const ACCENT2 = "#b5ff4d";
const ACCENT3 = "#ffe566";
const ACCENT4 = "#a855f7";

// ── GalaxyCanvas ─────────────────────────────────────────────────────────────
const GALAXY_COLORS = ["#ffffff", ACCENT, ACCENT2, ACCENT3, ACCENT4];

interface GDot {
  x: number; y: number; ox: number; oy: number;
  angle: number; orbitR: number; orbitSpeed: number;
  size: number; color: string; vx: number; vy: number; opacity: number;
}

function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width  = rect?.width  ?? window.innerWidth;
      canvas.height = rect?.height ?? window.innerHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
    canvas.parentElement?.addEventListener("mousemove", onMouseMove);
    canvas.parentElement?.addEventListener("mouseleave", onMouseLeave);

    const COUNT = 120;
    const REPEL_RADIUS = 90; const REPEL_STRENGTH = 0.55;
    const RETURN_SPRING = 0.04; const DAMPING = 0.80;

    const dots: GDot[] = Array.from({ length: COUNT }, (_, i) => {
      // First 30 dots biased to the top third, rest spread full height
      const ox = Math.random() * canvas.width;
      const oy = i < 60
        ? Math.random() * canvas.height * 0.35
        : Math.random() * canvas.height;
      const angle = Math.random() * Math.PI * 2;
      const orbitR = Math.random() * 18 + 4;
      const orbitSpeed = (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1);
      return { x: ox + Math.cos(angle) * orbitR, y: oy + Math.sin(angle) * orbitR, ox, oy, angle, orbitR, orbitSpeed,
        size: Math.random() * 2.5 + 1, color: GALAXY_COLORS[Math.floor(Math.random() * GALAXY_COLORS.length)],
        vx: 0, vy: 0, opacity: Math.random() * 0.45 + 0.1 };
    });

    interface Star { x: number; y: number; vx: number; vy: number; len: number; life: number; speed: number; color: string; }
    const STAR_COLORS = ["#ffffff","#ffffff","#ffffff", ACCENT, ACCENT2, ACCENT3, ACCENT4];
    const stars: Star[] = [];
    let nextStarIn = 0; let frameCount = 0;

    const spawnStar = () => {
      const fromRight = Math.random() < 0.5;
      const baseAngle = fromRight ? Math.PI - (Math.random() * 0.4 - 0.2) - Math.PI * 0.12 : (Math.random() * 0.4 - 0.2) + Math.PI * 0.12;
      const speed = Math.random() * 6 + 5;
      stars.push({ x: fromRight ? canvas.width * 0.4 + Math.random() * canvas.width * 0.6 : Math.random() * canvas.width * 0.6,
        y: Math.random() * canvas.height, vx: Math.cos(baseAngle) * speed, vy: Math.sin(baseAngle) * speed,
        len: Math.random() * 60 + 30, life: 0, speed, color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)] });
      nextStarIn = Math.floor(Math.random() * 180 + 60);
    };

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x; const my = mouse.current.y;

      for (const d of dots) {
        d.angle += d.orbitSpeed;
        const tx = d.ox + Math.cos(d.angle) * d.orbitR;
        const ty = d.oy + Math.sin(d.angle) * d.orbitR;
        const dx = d.x - mx; const dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const f = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          d.vx += (dx / dist) * f * REPEL_STRENGTH;
          d.vy += (dy / dist) * f * REPEL_STRENGTH;
        }
        d.vx += (tx - d.x) * RETURN_SPRING; d.vy += (ty - d.y) * RETURN_SPRING;
        d.vx *= DAMPING; d.vy *= DAMPING; d.x += d.vx; d.y += d.vy;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color; ctx.globalAlpha = d.opacity; ctx.fill();
      }

      frameCount++;
      if (frameCount >= nextStarIn) { spawnStar(); frameCount = 0; }

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life += s.speed / 400; s.x += s.vx; s.y += s.vy;
        const alpha = s.life < 0.2 ? s.life / 0.2 : s.life > 0.7 ? 1 - (s.life - 0.7) / 0.3 : 1;
        const tailX = s.x - s.vx / s.speed * s.len; const tailY = s.y - s.vy / s.speed * s.len;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, "transparent"); grad.addColorStop(1, s.color);
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad; ctx.lineWidth = 0.8 + Math.random() * 0.5;
        ctx.globalAlpha = alpha * 0.7; ctx.stroke();
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.globalAlpha = alpha * 0.9; ctx.fill();
        if (s.life >= 1 || s.x > canvas.width + 50 || s.x < -50 || s.y > canvas.height + 50) stars.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    spawnStar();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      canvas.parentElement?.removeEventListener("mousemove", onMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ── ColorTypewriter ──────────────────────────────────────────────────────────
function ColorTypewriter({ strings, colors }: { strings: string[]; colors: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
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
  }, [displayed, phase, idx, strings]);

  return (
    <span style={{ color: colors[idx % colors.length] }}>
      {displayed}<span className="animate-pulse">|</span>
    </span>
  );
}

// ── ScatteredStickers ─────────────────────────────────────────────────────────
function GalleryWithCursor() {
  const [hovered, setHovered] = useState(false);
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
    setHovered(true);
    opacity.set(1);
  };

  const handleMouseLeave = () => {
    setHovered(false);
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
export default function Hero() {
  const socialIcons = [
    { icon: <Instagram size={20} />, link: "#", label: "Instagram" },
    { icon: <Linkedin size={20} />, link: "https://www.linkedin.com/in/tiffany-lyssa-4b210b281/", label: "LinkedIn" },
    { icon: <Github size={20} />, link: "https://github.com/knorthy", label: "GitHub" },
    { icon: <Twitter size={20} />, link: "https://x.com/kno_orth", label: "X" },
    { icon: <Figma size={20} />, link: "#", label: "Figma" },
    { icon: <Facebook size={20} />, link: "https://www.facebook.com/lystffny/", label: "Facebook" },
  ];

  const developSkills = ["Next.js", "Tailwind", "React", "Javascript", "CSS", "Node.js", "Python", "SpringBoot", "FlutterFlow"];
  const createSkills  = ["Figma", "Canva", "Capcut", "Adobe Premiere Pro", "Adobe Illustrator"];

  return (
    <div className="flex flex-col w-full overflow-x-clip">

      {/* HOME */}
      <section className="relative flex flex-col items-center justify-start pt-4 min-h-screen px-6 max-w-6xl mx-auto w-full">
        {/* Galaxy dots + shooting stars */}
        <GalaxyCanvas />
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
        {/* Blobs */}
        <div className="absolute pointer-events-none" style={{ top: "-10%", left: "-15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)", filter: "blur(50px)", zIndex: 0 }} />
        <div className="absolute pointer-events-none" style={{ top: "30%", right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(247,37,133,0.20) 0%, transparent 70%)", filter: "blur(45px)", zIndex: 0 }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-5%", left: "20%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", filter: "blur(48px)", zIndex: 0 }} />
        <img src="/stickers/1.png" aria-hidden="true" className="pointer-events-none select-none absolute w-36 h-36 object-contain" style={{ rotate: "-15deg", zIndex: 0, top: "8%",    left: "-2%" }} />
        <img src="/stickers/2.png" aria-hidden="true" className="pointer-events-none select-none absolute w-32 h-32 object-contain" style={{ rotate: "12deg",  zIndex: 0, top: "5%",    right: "5%" }} />
        <img src="/stickers/3.png" aria-hidden="true" className="pointer-events-none select-none absolute w-28 h-28 object-contain" style={{ rotate: "20deg",  zIndex: 0, bottom: "12%", left: "30%" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
          
          {/* LEFT SIDE - GIF */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center md:justify-start order-2 md:order-1"
          >
            <div className="relative w-full max-w-[500px] aspect-square">
              <img 
                src="/mee.gif" 
                alt="Tiffany Lyssa Animation" 
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </motion.div>

          {/* RIGHT SIDE - TEXT CONTENT */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right w-full order-1 md:order-2">
            <div className="relative">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-foreground/80 mb-2 italic">
                Hello! I Am <span style={{ color: ACCENT }} className="font-semibold">Tiffany Lyssa</span> who
              </motion.p>

              <svg className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 w-64 h-32 pointer-events-none overflow-visible" viewBox="0 0 200 100" fill="none">
                <motion.path d="M190 50 Q100 -15, 15 45" stroke={ACCENT3} strokeWidth="2" strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ pathLength: { duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }, opacity: { duration: 0.3 } }} />
                <motion.path d="M15 45 L20 28 M15 45 L30 45" stroke={ACCENT3} strokeWidth="1.5" strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ pathLength: { duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }, opacity: { duration: 0.2, delay: 1.5 } }} />
              </svg>
            </div>

            <div className="relative mb-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Judges a book<br />by its{" "}
                <span className="relative inline-block">
                  <span className="relative z-10" style={{ color: ACCENT2 }}>cover</span>
                  <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[140%] pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.ellipse cx="50" cy="50" rx="45" ry="38" fill="none" stroke={ACCENT4} strokeWidth="1.5" strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ pathLength: { duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }, opacity: { duration: 0.2 } }} />
                  </svg>
                </span>...
              </h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50 mt-2">
                Because if the cover does not impress you what else can?
              </p>
            </div>

            {/* 44px tap areas around 20px icons; the negative margin keeps the row where it was */}
            <div className="flex gap-0.5 -mx-3 mt-1 text-foreground/60">
              {socialIcons.map((item, idx) => (
                <motion.a key={idx} href={item.link} aria-label={item.label} whileHover={{ y: -3, color: ACCENT }} className="p-3 transition-colors">
                  {item.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative flex flex-col items-center justify-center min-h-screen px-6 max-w-6xl mx-auto w-full">
        {/* Blobs */}
        <div className="absolute pointer-events-none" style={{ top: "-5%", right: "-10%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,113,33,0.22) 0%, transparent 70%)", filter: "blur(50px)", zIndex: 0 }} />
        <img src="/stickers/7.png" alt="" aria-hidden="true" className="hidden md:block pointer-events-none select-none absolute w-28 h-28 object-contain" style={{ rotate: "-10deg", zIndex: 0, top: "6%",    left: "2%" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">

          <div className="flex flex-col justify-center text-left w-full order-2 md:order-1">
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-medium mb-12 flex flex-wrap gap-2">
              <span className="sr-only">I&apos;m a software engineer, designer and developer.</span>
              <span aria-hidden>I&apos;m a</span>
              <span aria-hidden><ColorTypewriter strings={["Software Engineer.", "Designer.", "Developer."]} colors={[ACCENT, ACCENT2, ACCENT4]} /></span>
            </motion.h2>

            <div className="space-y-10">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: ACCENT }}>Develop</h3>
                <p className="text-foreground/70 mb-4 max-w-md text-sm leading-relaxed">
                  I make meaningful and delightful digital products that create an equilibrium between user needs and business goals.
                </p>
                <div className="flex flex-wrap gap-2">
                  {developSkills.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full text-[11px] text-foreground/85 uppercase tracking-wide"
                      style={{ border: `1px solid ${ACCENT}40`, color: "var(--foreground)" }}>{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: ACCENT2 }}>Create</h3>
                <p className="text-foreground/70 mb-4 max-w-md text-sm leading-relaxed">
                  My content creation journey evolved from a side hustle to serving other creators, achieving meaningful visual storytelling.
                </p>
                <div className="flex flex-wrap gap-2">
                  {createSkills.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full text-[11px] text-foreground/85 uppercase tracking-wide"
                      style={{ border: `1px solid ${ACCENT2}40`, color: "var(--foreground)" }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end items-center w-full order-1 md:order-2">
            <TiltedCard
              imageSrc="/jennie.jpg" altText="Tiffany Lyssa" captionText="Tiffany Lyssa"
              containerHeight="600px" containerWidth="100%" imageHeight="500px" imageWidth="400px"
              rotateAmplitude={10} scaleOnHover={1.05} showMobileWarning={false} showTooltip={true} displayOverlayContent={true}
              overlayContent={
                <div className="backdrop-blur-md px-4 py-2 rounded-lg text-white text-xs font-semibold"
                  style={{ background: `${ACCENT}33`, border: `1px solid ${ACCENT}60` }}>
                  Based in PH
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="relative min-h-screen flex flex-col items-center justify-center py-16">
        {/* Blobs */}
        <div className="absolute pointer-events-none" style={{ top: "5%", left: "-8%", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)", filter: "blur(50px)", zIndex: 0 }} />
        <img src="/stickers/1.png" alt="" aria-hidden="true" className="hidden md:block pointer-events-none select-none absolute w-32 h-32 object-contain" style={{ rotate: "18deg",  zIndex: 0, top: "15%",   right: "8%" }} />
        <div className="text-center mb-0 px-6">
          <h2 className="text-4xl md:text-6xl font-bold">
            Things that <span style={{ color: ACCENT }}>run</span>
          </h2>
          <p className="text-foreground/70 text-sm mt-4 max-w-lg mx-auto">
            10% inspiration, 90% fixing weird margin bugs. A curated showcase of things I&apos;ve designed, built, and actually shipped.
          </p>
        </div>
        <GalleryWithCursor />
        <ProjectCases />
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="relative pt-0 pb-24 px-6 max-w-6xl mx-auto w-full">
        {/* Blobs */}
        <div className="absolute pointer-events-none" style={{ top: -160, left: "-20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,113,33,0.10) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />
        <div className="absolute pointer-events-none" style={{ bottom: 0, right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />
        <img src="/stickers/6.png" alt="" aria-hidden="true" className="hidden md:block pointer-events-none select-none absolute w-32 h-32 object-contain" style={{ zIndex: 0, top: 40, right: "4%", rotate: "-8deg" }} />


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
