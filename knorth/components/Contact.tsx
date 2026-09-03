"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ACCENT = "#f72585";
const ACCENT2 = "#b5ff4d";
const ACCENT3 = "#ffe566";
const ACCENT4 = "#a855f7";

// ── Dot galaxy (scoped to section) ───────────────────────────────────────────
const DOT_COLORS = ["#ffffff", ACCENT, ACCENT2, ACCENT3, ACCENT4];

interface GDot {
  x: number; y: number;
  ox: number; oy: number;
  angle: number; orbitR: number; orbitSpeed: number;
  size: number; color: string;
  vx: number; vy: number;
  opacity: number;
}

function ContactDots() {
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
      canvas.height = rect?.height ?? 600;
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

    // ── Dots ──────────────────────────────────────────────────────────────
    const COUNT = 45;
    const REPEL_RADIUS = 80;
    const REPEL_STRENGTH = 0.5;
    const RETURN_SPRING = 0.04;
    const DAMPING = 0.80;

    const dots: GDot[] = Array.from({ length: COUNT }, () => {
      const ox = Math.random() * canvas.width;
      const oy = Math.random() * canvas.height;
      const angle = Math.random() * Math.PI * 2;
      const orbitR = Math.random() * 18 + 4;
      const orbitSpeed = (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1);
      return {
        x: ox + Math.cos(angle) * orbitR,
        y: oy + Math.sin(angle) * orbitR,
        ox, oy, angle, orbitR, orbitSpeed,
        size:    Math.random() * 2.5 + 1,
        color:   DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
        vx: 0, vy: 0,
        opacity: Math.random() * 0.35 + 0.08,
      };
    });

    // ── Shooting stars ────────────────────────────────────────────────────
    interface Star {
      x: number; y: number;
      vx: number; vy: number;
      len: number;      // tail length
      life: number;     // 0→1 progress
      speed: number;
      color: string;
    }

    const STAR_COLORS = ["#ffffff", "#ffffff", "#ffffff", ACCENT, ACCENT2, ACCENT3, ACCENT4];
    const stars: Star[] = [];
    let nextStarIn = 0; // frames until next spawn

    const spawnStar = () => {
      const fromRight = Math.random() < 0.5;
      // Left-to-right: ~20° spread around 12° downward
      // Right-to-left: mirror angle, start from right side
      const baseAngle = fromRight
        ? Math.PI - (Math.random() * 0.4 - 0.2) - Math.PI * 0.12
        : (Math.random() * 0.4 - 0.2) + Math.PI * 0.12;
      const speed = Math.random() * 6 + 5;
      stars.push({
        x:     fromRight ? canvas.width * 0.4 + Math.random() * canvas.width * 0.6 : Math.random() * canvas.width * 0.6,
        y:     Math.random() * canvas.height,
        vx:    Math.cos(baseAngle) * speed,
        vy:    Math.sin(baseAngle) * speed,
        len:   Math.random() * 60 + 30,
        life:  0,
        speed,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
      nextStarIn = Math.floor(Math.random() * 180 + 60);
    };

    let frameCount = 0;
    let raf: number;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // ── Draw dots ──────────────────────────────────────────────────────
      for (const d of dots) {
        d.angle += d.orbitSpeed;
        const targetX = d.ox + Math.cos(d.angle) * d.orbitR;
        const targetY = d.oy + Math.sin(d.angle) * d.orbitR;

        const dx = d.x - mx;
        const dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          d.vx += (dx / dist) * force * REPEL_STRENGTH;
          d.vy += (dy / dist) * force * REPEL_STRENGTH;
        }

        d.vx += (targetX - d.x) * RETURN_SPRING;
        d.vy += (targetY - d.y) * RETURN_SPRING;
        d.vx *= DAMPING;
        d.vy *= DAMPING;
        d.x += d.vx;
        d.y += d.vy;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = d.opacity;
        ctx.fill();
      }

      // ── Spawn & draw shooting stars ────────────────────────────────────
      frameCount++;
      if (frameCount >= nextStarIn) {
        spawnStar();
        frameCount = 0;
      }

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life += s.speed / 400;
        s.x += s.vx;
        s.y += s.vy;

        // Fade in then out
        const alpha = s.life < 0.2
          ? s.life / 0.2
          : s.life > 0.7
            ? 1 - (s.life - 0.7) / 0.3
            : 1;

        // Tail: gradient from transparent at back to bright at head
        const tailX = s.x - s.vx / s.speed * s.len;
        const tailY = s.y - s.vy / s.speed * s.len;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, s.color);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.random() * 0.5 + 0.8;
        ctx.globalAlpha = alpha * 0.7;
        ctx.stroke();

        // Tiny bright head dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = alpha * 0.9;
        ctx.fill();

        if (s.life >= 1 || s.x > canvas.width + 50 || s.x < -50 || s.y > canvas.height + 50) {
          stars.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    spawnStar(); // kick off with one immediately
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.parentElement?.removeEventListener("mousemove", onMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Animate opacity and scale based on scroll
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [bribe, setBribe] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allFilled =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.message.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData, { bribe });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", message: "" });
      setBribe(false);
    }, 10000);
  };

  const features = [
    "I reply faster than your group chat",
    "Zero unsolicited advice guaranteed",
    "Yes, half-baked ideas totally count",
  ];

  const socialIcons = [
    { icon: "𝕏", link: "https://x.com/kno_orth", label: "X/Twitter" },
    { icon: "f", link: "https://www.facebook.com/lystffny/", label: "Facebook" },
    { icon: "in", link: "https://www.instagram.com/", label: "Instagram" },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="min-h-screen flex items-center justify-center py-16 px-6 relative overflow-hidden"
    >
      {/* Galaxy dots */}
      <ContactDots />
      {/* Large background text with scroll animation */}
      <motion.div 
        className="absolute top-[-4%] left-1/2 -translate-x-1/2 pointer-events-none select-none"
        style={{
          opacity,
          scale,
          y,
        }}
      >
        <h3 
          className="text-[120px] md:text-[200px] lg:text-[250px] font-bold whitespace-nowrap"
          style={{
            background: "linear-gradient(to bottom, rgba(240, 240, 240, 0.02) 0%, rgba(240, 240, 240, 0.02) 40%, transparent 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Let&apos;s Build
        </h3>
      </motion.div>

      <div className="max-w-6xl mx-auto w-full relative z-10 pt-26 md:pt-38">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT SIDE - Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-start"
          >
            {/* Heading with arrow */}
            <div className="mb-6">
              <h2 className="text-4xl md:text-6xl font-bold flex items-center gap-3">
                Reach out
                <ArrowUpRight
                  size={40}
                  className="opacity-70"
                  style={{ color: ACCENT }}
                />
              </h2>
            </div>

            {/* Description */}
            <div className="mb-8 max-w-md">
              <p className="text-foreground/60 leading-relaxed mb-2">
                Leaving already? At least leave a trail.
              </p>
              <p className="text-foreground/60 leading-relaxed">
                Brain-dump a project, ask a dumb question, or send a meme.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3 mb-8">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${ACCENT2}30` }}
                  >
                    <Check size={12} style={{ color: ACCENT2 }} />
                  </div>
                  <span className="text-foreground/70 text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Social icons */}
            <div className="flex gap-4">
              {socialIcons.map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  aria-label={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* RIGHT SIDE - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl p-6 md:p-8 space-y-5 backdrop-blur-xl"
              style={{
                backgroundColor: "rgba(26, 26, 26, 0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
              }}
            >
              {/* Name and Email row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="px-5 py-4 rounded-2xl bg-[#0e0e0e] border border-white/5 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-white/20 transition-colors text-sm"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="px-5 py-4 rounded-2xl bg-[#0e0e0e] border border-white/5 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-white/20 transition-colors text-sm"
                  required
                />
              </div>

              {/* Message */}
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={5}
                className="w-full px-5 py-4 rounded-2xl bg-[#0e0e0e] border border-white/5 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-white/20 transition-colors resize-none text-sm"
                required
              />

              {/* Bribe checkbox — only shows when all fields are filled */}
              {allFilled && (
                <motion.label
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3 cursor-pointer group select-none"
                >
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={bribe}
                      onChange={(e) => setBribe(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded-md border flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: bribe ? `${ACCENT2}20` : "transparent",
                        borderColor: bribe ? ACCENT2 : "rgba(255,255,255,0.15)",
                      }}
                    >
                      {bribe && <Check size={12} style={{ color: ACCENT2 }} />}
                    </div>
                  </div>
                  <span className="text-xs text-foreground/50 group-hover:text-foreground/70 transition-colors leading-relaxed">
                    <span className="font-mono">git commit -m &quot;cat sat on enter key&quot;</span> — treat with urgency.
                  </span>
                </motion.label>
              )}

              {/* Submit button — swaps to confirmation for 10s then resets */}
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full py-4 rounded-2xl text-sm tracking-wide flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: `${ACCENT2}15`,
                    border: `1px solid ${ACCENT2}40`,
                  }}
                >
                  <span className="font-mono font-semibold" style={{ color: ACCENT2 }}>
                    HTTP 200: OK
                  </span>
                  <span className="text-foreground/50">—</span>
                  <span className="text-foreground/50 text-xs">
                    Go touch some grass while I compile a reply 🌿
                  </span>
                </motion.div>
              ) : (
                <motion.button
                  key="submit"
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-semibold text-[#0e0e0e] transition-all text-sm tracking-wide"
                  style={{ backgroundColor: "#f0f0f0" }}
                >
                  Submit
                </motion.button>
              )}
            </form>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 pt-2 border-t border-foreground/5"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-foreground/40">
            <p>© 2026 Tiffany Lyssa. All rights reserved.</p>
            <div className="flex gap-4 text-[11px]">
              <a href="#home" className="hover:text-foreground/70 transition-colors">
                Home
              </a>
              <a href="#about" className="hover:text-foreground/70 transition-colors">
                About
              </a>
              <a href="#projects" className="hover:text-foreground/70 transition-colors">
                Projects
              </a>
              <a href="#experience" className="hover:text-foreground/70 transition-colors">
                Experience
              </a>
            </div>
          </div>
        </motion.footer>
      </div>
    </section>
  );
}
