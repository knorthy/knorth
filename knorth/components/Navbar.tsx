"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { usePageTransition } from '@/components/PageTransition';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [resumeHovered, setResumeHovered] = useState(false);
  const pathname = usePathname();
  const { navigate } = usePageTransition();

  useEffect(() => {
    setMounted(true);
    
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    const sectionIds = ['home', 'about', 'projects', 'experience', 'contact'];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  if (!mounted) return null;
  const isOnRoot = pathname === '/';

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOnRoot) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/', e.clientX, e.clientY);
    }
  };

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center">
        <a href="/" onClick={handleLogoClick} className="text-2xl font-bold text-[#f72585]">TIFFANY</a>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 px-10 py-3 shadow-xl rounded-[20px] backdrop-blur-md bg-white/5 dark:bg-white/5 border border-white/10">
        <div className="flex gap-8 text-sm font-medium">
          {[
            { id: 'home',       color: '#f72585' },
            { id: 'about',      color: '#b5ff4d' },
            { id: 'projects',   color: '#a855f7' },
            { id: 'experience', color: '#ffe566' },
            { id: 'contact',    color: '#f72585' },
          ].map(({ id, color }) => (
            <a
              key={id}
              href={`#${id}`}
              className="transition-colors capitalize"
              style={activeSection === id
                ? { color, fontWeight: 700, textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px' }
                : { color: 'color-mix(in srgb, var(--foreground) 60%, transparent)' }
              }
              onMouseEnter={e => (e.currentTarget.style.color = color)}
              onMouseLeave={e => {
                if (activeSection !== id) e.currentTarget.style.color = 'color-mix(in srgb, var(--foreground) 60%, transparent)';
              }}
            >
              {id === 'contact' ? 'Contact Me' : id}
            </a>
          ))}
        </div>
      </div>

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
    </nav>
  );
}