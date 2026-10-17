"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, FileDown, Github, Linkedin, Mail } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { CONTACT_EMAIL, RESUME_URL, SOCIALS } from "@/lib/site";
import GalaxyDots from "@/components/GalaxyDots";

import { useRef } from "react";

const ACCENT = "#f72585";
const ACCENT2 = "#b5ff4d";
const ACCENT3 = "#ffe566";
const ACCENT4 = "#a855f7";

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

  // Email only shows once a real address is configured (lib/site.ts)
  const socialLinks = [
    { Icon: FileDown, label: "Resume", handle: "PDF download", link: RESUME_URL, color: ACCENT3, download: true },
    ...(CONTACT_EMAIL ? [{ Icon: Mail, label: "Email", handle: CONTACT_EMAIL, link: `mailto:${CONTACT_EMAIL}`, color: ACCENT4, download: false }] : []),
    { Icon: Linkedin, label: SOCIALS.linkedin.label, handle: SOCIALS.linkedin.handle, link: SOCIALS.linkedin.href, color: ACCENT, download: false },
    { Icon: Github, label: SOCIALS.github.label, handle: SOCIALS.github.handle, link: SOCIALS.github.href, color: ACCENT2, download: false },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="flex flex-col justify-center pt-16 pb-28 md:pb-8 px-6 relative overflow-visible"
    >
      {/* Galaxy dots */}
      <GalaxyDots />

      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{ bottom: "0%", right: "-8%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(247,37,133,0.13) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />
      {/* Large background text with scroll animation */}
      <motion.div 
        className="absolute top-[-4%] left-1/2 -translate-x-1/2 pointer-events-none select-none"
        style={{
          opacity,
          scale,
          y,
        }}
      >
        <p
          aria-hidden
          className="text-[120px] md:text-[200px] lg:text-[250px] font-bold whitespace-nowrap"
          style={{
            background: "linear-gradient(to bottom, rgba(240, 240, 240, 0.02) 0%, rgba(240, 240, 240, 0.02) 40%, transparent 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Let&apos;s Build
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col justify-center flex-1 pt-20 md:pt-28">
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

            {/* Where else to find me */}
            <ul className="flex flex-col gap-2">
              {socialLinks.map(({ Icon, label, handle, link, color, download }, idx) => (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                  <a
                    href={link}
                    target={link.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    download={download || undefined}
                    className="group inline-flex items-center gap-3 py-2.5 md:py-1"
                  >
                    <Icon
                      size={18}
                      aria-hidden
                      className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6"
                      style={{ color }}
                    />
                    <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-[var(--hover-tint)]" style={{ "--hover-tint": color } as React.CSSProperties}>
                      {label}
                    </span>
                    <span className="text-sm text-foreground/60 truncate">{handle}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* RIGHT SIDE - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <ContactForm />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 pt-2 border-t border-foreground/5"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-foreground/60">
            <p>© 2026 Tiffany Lyssa. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-x-4 md:gap-y-2 text-xs [&>a]:py-2.5 md:[&>a]:py-0">
              <a href="#home" className="hover:text-foreground transition-colors">
                Home
              </a>
              <a href="#about" className="hover:text-foreground transition-colors">
                About
              </a>
              <a href="#projects" className="hover:text-foreground transition-colors">
                Projects
              </a>
              <a href="#experience" className="hover:text-foreground transition-colors">
                Experience
              </a>
              <a href="#contact" className="hover:text-foreground transition-colors">
                Contact
              </a>
              <a href={RESUME_URL} download className="font-semibold text-foreground/80 hover:text-foreground transition-colors">
                Resume ↓
              </a>
            </div>
          </div>
        </motion.footer>
      </div>
    </section>
  );
}
