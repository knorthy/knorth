"use client";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, FileDown, Github, Linkedin, Mail } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { CONTACT_EMAIL, RESUME_URL, SOCIALS } from "@/lib/site";
import GalaxyDots from "@/components/GalaxyDots";
import { EASE_OUT } from "@/components/career/motion";

const ACCENT = "#f72585";
const ACCENT2 = "#b5ff4d";
const ACCENT3 = "#ffe566";
const ACCENT4 = "#a855f7";

export default function Contact() {
  // Both columns rise in together, the form a beat behind
  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.5, ease: EASE_OUT, delay },
  });

  // Email only shows once a real address is configured (lib/site.ts)
  const socialLinks = [
    { Icon: FileDown, label: "Resume", handle: "PDF download", link: RESUME_URL, color: ACCENT3, download: true },
    ...(CONTACT_EMAIL ? [{ Icon: Mail, label: "Email", handle: CONTACT_EMAIL, link: `mailto:${CONTACT_EMAIL}`, color: ACCENT4, download: false }] : []),
    { Icon: Linkedin, label: SOCIALS.linkedin.label, handle: SOCIALS.linkedin.handle, link: SOCIALS.linkedin.href, color: ACCENT, download: false },
    { Icon: Github, label: SOCIALS.github.label, handle: SOCIALS.github.handle, link: SOCIALS.github.href, color: ACCENT2, download: false },
  ];

  return (
    <section
      id="contact"
      className="flex flex-col justify-center pt-24 md:pt-32 pb-28 md:pb-8 px-6 relative"
    >
      {/* Galaxy dots */}
      <GalaxyDots />

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col justify-center flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT SIDE - Info */}
          <motion.div {...rise()} className="flex flex-col justify-start">
            {/* Heading with arrow */}
            <div className="mb-6">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight flex items-center gap-3">
                Reach out
                <ArrowUpRight
                  size={40}
                  aria-hidden
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
              {socialLinks.map(({ Icon, label, handle, link, color, download }) => (
                <li key={label}>
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
                </li>
              ))}
            </ul>
          </motion.div>

          {/* RIGHT SIDE - Form */}
          <motion.div {...rise(0.08)} className="w-full">
            <ContactForm />
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="mt-16 md:mt-20 pt-5 border-t border-foreground/10">
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
              <a href={RESUME_URL} download className="inline-flex items-center gap-1 font-semibold text-foreground/80 hover:text-foreground transition-colors">
                Resume <ArrowDown size={12} aria-hidden />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
