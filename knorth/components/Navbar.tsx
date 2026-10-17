"use client";
// Top bar. Desktop: pixel logo · centred section links · Resume. Below md the section links move to a
// dock along the bottom edge, where a thumb can reach them; Kniah sits at its right end.
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Briefcase, FolderOpen, Home, Mail, User, type LucideIcon } from 'lucide-react';
import { usePageTransition } from '@/components/PageTransition';
import PixelLogo from '@/components/PixelLogo';

const LINKS: { id: string; label: string; short: string; color: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', short: 'Home', color: '#f72585', Icon: Home },
  { id: 'about', label: 'About', short: 'About', color: '#b5ff4d', Icon: User },
  { id: 'projects', label: 'Projects', short: 'Projects', color: '#a855f7', Icon: FolderOpen },
  { id: 'experience', label: 'Experience', short: 'Career', color: '#ffe566', Icon: Briefcase },
  { id: 'contact', label: 'Contact', short: 'Contact', color: '#f72585', Icon: Mail },
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
  const [resumeHovered, setResumeHovered] = useState(false);
  const pathname = usePathname();
  const { navigate } = usePageTransition();

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
      {/* Phones: a fade behind the bar so scrolled content doesn't collide with the logo */}
      <div
        aria-hidden
        className="md:hidden absolute inset-x-0 -top-4 h-24 -z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, var(--background) 35%, color-mix(in srgb, var(--background) 70%, transparent) 65%, transparent)' }}
      />
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
      </div>

      {/* Mobile dock: section links within thumb reach. It stops short of the right edge to leave
          room for Kniah, who sits at its end. */}
      <div
        className="md:hidden fixed left-3 right-[100px] z-50"
        style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <ul className="flex items-stretch justify-between h-16 px-1.5 rounded-[22px] border border-white/10 bg-[#141414]/85 backdrop-blur-md shadow-[0_16px_32px_-12px_rgba(0,0,0,0.8)]">
          {LINKS.map(({ id, short, color, Icon }) => {
            const on = active === id;
            return (
              <li key={id} className="flex-1 min-w-0">
                <a
                  href={`#${id}`}
                  aria-current={on ? 'true' : undefined}
                  className="relative h-full flex flex-col items-center justify-center gap-1 rounded-2xl active:scale-95 transition-transform"
                  style={{ color: on ? color : 'color-mix(in srgb, var(--foreground) 62%, transparent)' }}
                >
                  {on && (
                    <motion.span
                      layoutId="dock-active"
                      aria-hidden
                      className="absolute inset-x-0.5 inset-y-1.5 rounded-2xl"
                      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <Icon size={19} strokeWidth={on ? 2.4 : 2} aria-hidden className="relative" />
                  <span className={`relative text-[10px] leading-none truncate max-w-full ${on ? 'font-bold' : 'font-medium'}`}>{short}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
