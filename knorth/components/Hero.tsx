"use client";
import { motion } from "framer-motion";
import { Instagram, Linkedin, Github, Twitter, Figma, Facebook } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TiltedCard from "@/components/designs/TiltedCard";
import CircularGallery from "@/components/designs/CircularGallery";
import Contact from "@/components/Contact";

const ACCENT  = "#f72585";
const ACCENT2 = "#b5ff4d";
const ACCENT3 = "#ffe566";
const ACCENT4 = "#a855f7";

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

// ── Experience data ───────────────────────────────────────────────────────────
const JOBS = [
  {
    role: "Freelance Developer", type: "Remote",
    period: "January 2023 – Present",
    category: "Web, Mobile, Embedded Systems / Arduino & Microcontrollers",
    color: ACCENT,
    bullets: [
      "POS Systems — Built full-cycle point-of-sale systems with inventory management and real-time sales reporting for SME clients.",
      "Personal Websites — Developed responsive personal and portfolio websites using Next.js and React with modern UI/UX.",
      "APFC using ESP controllers — Designed and programmed an Automatic Power Factor Corrector using ESP microcontrollers with real-time monitoring and cloud-based logging.",
      "IoT Earthquake Detector — Built an IoT seismic detection system using ESP controllers with automated alerts and remote data monitoring via cloud integration.",
      "Misting Sanitation Pipes — Developed an Arduino-powered automated misting sanitation system with QR-based attendance tracking and sensor-triggered activation.",
    ],
  },
  {
    role: "Freelance Tax Account Associate", type: "Remote",
    period: "September 2023 – Present",
    category: "Accounting Assistant",
    color: ACCENT2,
    bullets: [
      "Prepared and filed BIR returns for SME clients quarterly and annually; managed bookkeeping, sales invoices, and compliance documentation.",
    ],
  },
  {
    role: "Freelance Graphic Artist", type: "Remote",
    period: "January 2022 – 2024",
    category: "Marketing Publications, Videos, Photography, Basic Animations, Digital Ads",
    color: ACCENT4,
    bullets: [
      "Marketing Publications — Designed posters, flyers, and digital ads for events and campaigns; handled on-the-spot content creation and real-time posting during live sessions.",
      "Video Editing — Edited promotional videos and produced motion graphics and typography animations using DaVinci Resolve and Adobe After Effects.",
    ],
  },
];

const MEMBERS = [
  { org: "AWS User Group BuildHers+", period: "March 2026 – Present", role: "Support Council, Operations Department", color: ACCENT3 },
  { org: "Amazon Web Services – Cloud Club: Spade", period: "June 2024 – Present", role: "Support Council, Creatives & Graphics Office", color: ACCENT3 },
  { org: "Computer Science Student Organization", period: "June 2024 – June 2025", role: "Support Council, Creatives & Graphics Office", color: ACCENT2 },
];

const VOLUNTEERS = [
  { org: "Quantum Computing Society of the Philippines", period: "April 2026", role: "Technical Team | Full-stack Developer", color: ACCENT },
  { org: "Arduino Philippines", period: "March 2026", role: "Creatives & Graphics Department", color: ACCENT2 },
  { org: "Blockchain Campus Conference", period: "May 2025 – November 2025", role: "Technical Team | Full-stack Developer", color: ACCENT4 },
];

// ── ExperienceList ────────────────────────────────────────────────────────────
function ExperienceList() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? JOBS : JOBS.slice(0, 1);

  return (
    <div className="relative">
      <div className="flex flex-col gap-5 relative">
        {/* Fade overlay when collapsed */}
        {!showAll && (
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
            style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(14, 14, 14, 0.7) 50%, var(--background) 100%)" }} />
        )}
        {visible.map((job, i) => {
          const previewBullets = !showAll && i === 0 ? job.bullets.slice(0, 2) : job.bullets;
          return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="relative pl-8"
          >
            <span className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-background" style={{ background: job.color }} />
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: job.color }}>{job.period}</p>
            <h3 className="text-xl font-bold text-foreground">
              {job.role}
              <span className="text-foreground/40 font-normal text-base ml-2">| {job.type}</span>
            </h3>
            <p className="text-xs text-foreground/50 italic mb-4">{job.category}</p>
            <ul className="space-y-3">
              {previewBullets.map((b, bi) => (
                <li key={bi} className="flex gap-2 text-sm leading-relaxed opacity-75">
                  <span style={{ color: job.color }} className="mt-0.5 shrink-0">▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          );
        })}

        {!showAll && (
          <div className="relative mt-0">
            <button onClick={() => setShowAll(true)}
              className="relative z-20 pl-8 text-sm text-foreground/40 hover:text-foreground/80 transition-colors tracking-[0.2em]">
              see more
            </button>
          </div>
        )}
        {showAll && (
          <button onClick={() => setShowAll(false)}
            className="pl-8 text-sm text-foreground/40 hover:text-foreground/80 transition-colors tracking-[0.2em]">
            see less
          </button>
        )}
      </div>
    </div>
  );
}

// ── AffiliationList ───────────────────────────────────────────────────────────
function AffiliationList() {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="mt-7">
      <p className="text-xs uppercase tracking-[0.3em] text-foreground/40 mb-6">Leadership &amp; Affiliations</p>

      <div className="relative flex flex-col gap-0">
        {/* Fade overlay when collapsed */}
        {!showAll && (
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10"
            style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(14, 14, 14, 0.7) 50%, var(--background) 100%)" }} />
        )}
        {/* Member of — always visible, show only first entry when collapsed */}
        <div className="pl-8 mb-2">
          <p className="text-[11px] uppercase tracking-widest font-bold mb-6" style={{ color: ACCENT2 }}>Member of</p>
          <div className="flex flex-col gap-7">
            {(showAll ? MEMBERS : MEMBERS.slice(0, 1)).map((aff, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }} className="relative flex gap-4 items-start">
                <span className="absolute -left-[1.45rem] mt-2 w-2.5 h-2.5 rounded-full ring-2 ring-background shrink-0" style={{ background: aff.color }} />
                <div>
                  <p className="text-base font-semibold text-foreground">{aff.org}</p>
                  <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: aff.color }}>{aff.period}</p>
                  <p className="text-sm text-foreground/50 mt-0.5">{aff.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Volunteer — revealed on see more */}
        {showAll && (
          <div className="pl-8 mb-6 mt-8">
            <p className="text-[11px] uppercase tracking-widest font-bold mb-6" style={{ color: ACCENT4 }}>Volunteer Work</p>
            <div className="flex flex-col gap-7">
              {VOLUNTEERS.map((aff, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }} className="relative flex gap-4 items-start">
                  <span className="absolute -left-[1.45rem] mt-2 w-2.5 h-2.5 rounded-full ring-2 ring-background shrink-0" style={{ background: aff.color }} />
                  <div>
                    <p className="text-base font-semibold text-foreground">{aff.org}</p>
                    <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: aff.color }}>{aff.period}</p>
                    <p className="text-sm text-foreground/50 mt-0.5">{aff.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {!showAll && (
          <div className="relative mt-4 pl-8">
            <button onClick={() => setShowAll(true)}
              className="relative z-20 text-sm text-foreground/40 hover:text-foreground/80 transition-colors tracking-[0.2em]">
              see more
            </button>
          </div>
        )}
        {showAll && (
          <button onClick={() => setShowAll(false)}
            className="pl-8 text-sm text-foreground/40 hover:text-foreground/80 transition-colors tracking-[0.2em]">
            see less
          </button>
        )}
      </div>
    </div>
  );
}

// ── CertOrbit ─────────────────────────────────────────────────────────────────
function CertOrbit() {
  const certs = [
    { name: "Intro to Cyber Security",  issuer: "Cisco",    color: ACCENT,  icon: "https://www.cisco.com/favicon.ico",           orbitR: 110, startAngle: -90,  duration: 8,  dir:  1 },
    { name: "Cyber Threat Management",  issuer: "Cisco",    color: ACCENT,  icon: "https://www.cisco.com/favicon.ico",           orbitR: 65,  startAngle: -10,  duration: 25, dir: -1 },
    { name: "Intro to Cloud Computing", issuer: "DataCamp", color: ACCENT3, icon: "https://www.datacamp.com/favicon.ico",        orbitR: 110, startAngle: 70,   duration: 14, dir: -1 },
    { name: "Git Foundations",          issuer: "DataCamp", color: ACCENT3, icon: "https://www.datacamp.com/favicon.ico",        orbitR: 65,  startAngle: 150,  duration: 35, dir:  1 },
    { name: "AI in UX Hackathon 🏆",   issuer: "Champion", color: ACCENT2, icon: "https://cdn-icons-png.flaticon.com/512/3112/3112946.png", orbitR: 110, startAngle: 220, duration: 20, dir:  1 },
  ];

  const SIZE   = 300;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const CARD_W = 130;
  const CARD_H = 50;

  const [angles, setAngles]   = useState(() => certs.map(c => c.startAngle));
  const [grabbed, setGrabbed] = useState<number | null>(null);
  const rafRef  = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    function tick(ts: number) {
      if (lastRef.current === 0) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setAngles(prev => prev.map((a, i) => {
        if (grabbed === i) return a;
        return a + certs[i].dir * (360 / certs[i].duration) * dt;
      }));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [grabbed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full" style={{ height: SIZE + 160 }}>
      {/* single positioned anchor — everything is relative to this */}
      <div className="absolute" style={{ top: 80, left: "50%", transform: "translateX(-50%)", width: SIZE, height: SIZE }}>

        {/* SVG rings + center node */}
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: "visible", position: "absolute", top: 0, left: 0 }}>
          {[65, 110, 134].map((r, i) => (
            <circle key={i} cx={CX} cy={CY} r={r} fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={i === 2 ? 8 : 1}
              strokeDasharray={i === 2 ? "3 6" : undefined} />
          ))}
          <circle cx={CX} cy={CY} r={26} fill="#1a1a1a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize="10"
            fill="rgba(255,255,255,0.45)" fontFamily="var(--font-geist-sans)">certs</text>
        </svg>

        {/* orbiting cards — all coords relative to the same SIZE×SIZE box */}
        {certs.map((cert, i) => {
          const rad    = (angles[i] * Math.PI) / 180;
          const dotX   = CX + cert.orbitR * Math.cos(rad);
          const dotY   = CY + cert.orbitR * Math.sin(rad);
          const pushR  = cert.orbitR + 62;
          const cardX  = CX + pushR * Math.cos(rad) - CARD_W / 2;
          const cardY  = CY + pushR * Math.sin(rad) - CARD_H / 2;

          const isHeld = grabbed === i;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {/* spoke + dot */}
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
                style={{ position: "absolute", top: 0, left: 0, overflow: "visible", pointerEvents: "none" }}>
                <line x1={CX} y1={CY} x2={dotX} y2={dotY}
                  stroke={cert.color} strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 4" />
                <circle cx={dotX} cy={dotY} r={4} fill={cert.color} />
              </svg>

              {/* card */}
              <div className="absolute flex items-center gap-2 px-3 py-2 rounded-2xl select-none"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setGrabbed(i); }}
                onPointerUp={() => setGrabbed(null)}
                onPointerCancel={() => setGrabbed(null)}
                style={{
                  left: cardX, top: cardY,
                  width: CARD_W, height: CARD_H,
                  background: isHeld ? "rgba(40,40,40,0.98)" : "rgba(26,26,26,0.92)",
                  border: `1px solid ${isHeld ? cert.color : cert.color + "45"}`,
                  backdropFilter: "blur(8px)",
                  pointerEvents: "auto",
                  cursor: isHeld ? "grabbing" : "grab",
                  boxShadow: isHeld ? `0 0 18px ${cert.color}55` : "none",
                  transition: "box-shadow 0.2s, background 0.2s",
                }}>
                <img src={cert.icon} alt={cert.issuer}
                  className="rounded-full shrink-0 object-cover"
                  style={{ width: 28, height: 28, background: "#2a2a2a", border: `1px solid ${cert.color}40` }} />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-semibold text-foreground leading-tight truncate">{cert.name}</p>
                  <p className="text-[10px] text-foreground/50 leading-tight">{cert.issuer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
export default function Hero() {
  const socialIcons = [
    { icon: <Instagram size={20} />, link: "#" },
    { icon: <Linkedin size={20} />, link: "https://www.linkedin.com/in/tiffany-lyssa-4b210b281/" },
    { icon: <Github size={20} />, link: "https://github.com/knorthy" },
    { icon: <Twitter size={20} />, link: "https://x.com/kno_orth" },
    { icon: <Figma size={20} />, link: "#" },
    { icon: <Facebook size={20} />, link: "https://www.facebook.com/lystffny/" },
  ];

  const developSkills = ["Next.js", "Tailwind", "React", "Javascript", "CSS", "Node.js", "Python", "SpringBoot", "FlutterFlow"];
  const createSkills  = ["Figma", "Canva", "Capcut", "Adobe Premiere Pro", "Adobe Illustrator"];

  return (
    <div className="flex flex-col w-full">

      {/* HOME */}
      <section id="home" className="flex flex-col items-center justify-center min-h-screen px-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col items-center md:items-end text-center md:text-right w-full">
          <div className="relative">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-foreground/80 mb-2 italic">
              Hello! I Am <span style={{ color: ACCENT }} className="font-semibold">Tiffany Lyssa</span>
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

          <div className="flex gap-5 mt-4 text-foreground/60">
            {socialIcons.map((item, idx) => (
              <motion.a key={idx} href={item.link} whileHover={{ y: -3, color: ACCENT }} className="transition-colors">
                {item.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="flex flex-col items-center justify-center min-h-screen px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">

          <div className="flex flex-col justify-center text-left w-full order-2 md:order-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-medium mb-12 flex flex-wrap gap-2">
              <span>I&apos;m a</span>
              <ColorTypewriter strings={["Software Engineer.", "Designer.", "Developer."]} colors={[ACCENT, ACCENT2, ACCENT4]} />
            </motion.div>

            <div className="space-y-10">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: ACCENT }}>Develop</h3>
                <p className="text-foreground/60 mb-4 max-w-md text-xs leading-relaxed">
                  I make meaningful and delightful digital products that create an equilibrium between user needs and business goals.
                </p>
                <div className="flex flex-wrap gap-2">
                  {developSkills.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full text-[10px] opacity-80 uppercase tracking-tighter"
                      style={{ border: `1px solid ${ACCENT}40`, color: "var(--foreground)" }}>{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: ACCENT2 }}>Create</h3>
                <p className="text-foreground/60 mb-4 max-w-md text-xs leading-relaxed">
                  My content creation journey evolved from a side hustle to serving other creators, achieving meaningful visual storytelling.
                </p>
                <div className="flex flex-wrap gap-2">
                  {createSkills.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full text-[10px] opacity-80 uppercase tracking-tighter"
                      style={{ border: `1px solid ${ACCENT2}40`, color: "var(--foreground)" }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end items-center w-full order-1 md:order-2">
            <TiltedCard
              imageSrc="/profile.jpg" altText="Tiffany Lyssa" captionText="Tiffany Lyssa"
              containerHeight="600px" containerWidth="100%" imageHeight="500px" imageWidth="400px"
              rotateAmplitude={10} scaleOnHover={1.05} showTooltip={true} displayOverlayContent={true}
              overlayContent={
                <div className="backdrop-blur-md px-4 py-2 rounded-lg text-white text-[10px]"
                  style={{ background: `${ACCENT}33`, border: `1px solid ${ACCENT}60` }}>
                  BASE IN PH
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="min-h-screen flex flex-col items-center justify-center py-16">
        <div className="text-center mb-0 px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/40 mb-3">Selected Work</p>
          <h2 className="text-4xl md:text-6xl font-bold">
            My <span style={{ color: ACCENT }}>Projects</span>
          </h2>
          <p className="text-foreground/50 text-sm mt-4 max-w-md mx-auto">
            A collection of things I&apos;ve built, designed, and shipped.
          </p>
        </div>
        <div style={{ height: "600px", width: "100%", position: "relative", marginTop: "-80px" }}>
          <CircularGallery bend={1} textColor="#ffffff" borderRadius={0.05} scrollEase={0.05} font="bold 30px Figtree" scrollSpeed={2} />
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="min-h-screen flex flex-col justify-center py-24 px-6 max-w-6xl mx-auto w-full">

        {/* big heading — full width */}
        <div className="mb-6">
          <h2 className="text-4xl md:text-6xl font-bold">
            Work <span style={{ color: ACCENT3 }}>Experience</span>
          </h2>
        </div>

        {/* subheader row — "Career" left, "Certifications" right, same positions as columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/40">Career</p>
          </div>
          <div className="md:pl-24 md:ml-4">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/40">Certifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* LEFT */}
          <div>
            <ExperienceList />
            <AffiliationList />
          </div>

          {/* RIGHT — cert orbit */}
          <div className="flex flex-col items-center justify-start md:pl-24 md:ml-8">
            <CertOrbit />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <Contact />

    </div>
  );
}
