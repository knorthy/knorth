"use client";
// Top bar. Desktop: pixel logo · centred section links · Résumé. Below md the centred pill would
// collide with the logo and button, so it collapses into a menu sheet.
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { usePageTransition } from '@/components/PageTransition';
import PixelLogo from '@/components/PixelLogo';

const LINKS = [
  { id: 'home', label: 'Home', color: '#f72585' },
  { id: 'about', label: 'About', color: '#b5ff4d' },
  { id: 'projects', label: 'Projects', color: '#a855f7' },
  { id: 'experience', label: 'Experience', color: '#ffe566' },
  { id: 'contact', label: 'Contact', color: '#f72585' },
];
const SECTION_IDS = ['about', 'projects', 'experience', 'contact'];

// The section whose box covers the middle of the viewport; "home" above the first one
function useActiveSection() {
  const [active, setActive] = useState('home');
  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const mid = window.innerHeight / 2;
        let current = 'home';
        for (const id of SECTION_IDS) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= mid) current = id;
        }
        setActive(current);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return active;
}

export default function Navbar() {
  const active = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resumeHovered, setResumeHovered] = useState(false);
  const pathname = usePathname();
  const { navigate } = usePageTransition();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // On the main page the logo scrolls to the top; it doesn't send people back through the intro
    if (pathname === '/home') window.scrollTo({ top: 0, behavior: 'smooth' });
    else navigate('/home', e.clientX, e.clientY);
  };

  const linkStyle = (id: string, color: string): React.CSSProperties =>
    active === id
      ? { color, fontWeight: 700, textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px' }
      : { color: 'color-mix(in srgb, var(--foreground) 70%, transparent)' };

  return (
    <nav aria-label="Main" className="fixed top-4 md:top-6 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- custom transition handles navigation */}
      <a href="/home" onClick={handleLogoClick} aria-label="Tiffany Lyssa, back to top" className="block py-1">
        <PixelLogo cell={3} />
      </a>

      {/* Desktop links */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 px-10 py-3 shadow-xl rounded-[20px] backdrop-blur-md bg-white/5 border border-white/10">
        <ul className="flex gap-8 text-sm font-medium">
          {LINKS.map(({ id, label, color }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? 'true' : undefined}
                className="transition-colors hover:!text-[var(--link-color)]"
                style={{ ...linkStyle(id, color), '--link-color': color } as React.CSSProperties}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2">
        {/* Resume / Hire Me button */}
        <motion.a
          href="#"
          onMouseEnter={() => setResumeHovered(true)}
          onMouseLeave={() => setResumeHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="relative px-5 py-2 rounded-full text-sm font-bold tracking-wide backdrop-blur-md"
          style={{
            background: resumeHovered
              ? 'rgba(247, 37, 133, 0.25)'
              : 'rgba(255, 255, 255, 0.07)',
            border: resumeHovered
              ? '1px solid rgba(247, 37, 133, 0.6)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            color: resumeHovered ? '#f72585' : 'rgba(255,255,255,0.75)',
            boxShadow: resumeHovered
              ? '0 4px 24px rgba(247,37,133,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
            transition: 'background 0.25s, border 0.25s, color 0.25s, box-shadow 0.25s',
          }}
        >
          {resumeHovered ? 'Hire Me' : 'Resume'}
        </motion.a>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden grid place-items-center w-10 h-10 rounded-full backdrop-blur-md bg-white/[0.07] border border-white/15 text-white/85"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="md:hidden absolute top-full left-4 right-4 mt-3 rounded-2xl border border-white/10 bg-[#141414]/95 backdrop-blur-md p-2"
            style={{ boxShadow: '0 20px 40px -12px rgba(0,0,0,0.7)' }}
          >
            <ul>
              {LINKS.map(({ id, label, color }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active === id ? 'true' : undefined}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold hover:bg-white/5"
                    style={{ color: active === id ? color : undefined }}
                  >
                    <span aria-hidden className="w-2 h-2 rounded-full" style={{ background: color }} />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
