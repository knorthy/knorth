"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { useState, useRef } from "react";

const ACCENT = "#f72585";
const ACCENT2 = "#b5ff4d";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const features = [
    "Personalized assistance",
    "Timely response",
    "Comprehensive support",
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

      <div className="max-w-6xl mx-auto w-full relative z-10 pt-16 md:pt-30">
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
                Have a question or need assistance?
              </p>
              <p className="text-foreground/60 leading-relaxed mb-2">
                Reach out to our dedicated support team.
              </p>
              <p className="text-foreground/60 leading-relaxed">
                We&apos;re here to help with any inquiries you may have.
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

              {/* Submit button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl font-semibold text-[#0e0e0e] transition-all text-sm tracking-wide"
                style={{ backgroundColor: "#f0f0f0" }}
              >
                Submit
              </motion.button>
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
