"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

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
  const isDark = resolvedTheme === 'dark';

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center">
        <a href="#home" className="text-2xl font-bold text-[#f72585]">Knorth</a>
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

      <div onClick={() => setTheme(isDark ? 'light' : 'dark')} className="cursor-pointer">
        <div className="relative w-16 h-9 px-1 flex items-center shadow-inner rounded-[18px] backdrop-blur-md bg-white/5 border border-white/10">
          <motion.div
            className="absolute z-10 flex items-center justify-center w-7 h-7 bg-[#f72585] rounded-full shadow-md"
            animate={{ x: isDark ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {isDark ? <Moon size={14} className="text-white" /> : <Sun size={14} className="text-white" />}
          </motion.div>
          <div className="flex justify-between w-full px-1 opacity-40">
            <Sun size={14} className="text-gray-400" />
            <Moon size={14} className="text-gray-400" />
          </div>
        </div>
      </div>
    </nav>
  );
}