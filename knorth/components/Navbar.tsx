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

    const sectionIds = ['home', 'about', 'experience', 'projects', 'contact'];
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
        <a href="#home" className="text-2xl font-bold text-[#224766]">Knorth</a>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 px-10 py-3 shadow-xl rounded-[20px] backdrop-blur-md bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10">
        <div className="flex gap-8 text-sm font-medium">
          {['home', 'about', 'experience', 'projects', 'contact'].map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className={`transition-colors capitalize ${
                activeSection === id ? 'text-[#224766] font-bold underline decoration-2 underline-offset-4' : 'text-foreground/60 hover:text-[#224766]'
              }`}
            >
              {id === 'contact' ? 'Contact Me' : id}
            </a>
          ))}
        </div>
      </div>

      <div onClick={() => setTheme(isDark ? 'light' : 'dark')} className="cursor-pointer">
        <div className="relative w-16 h-9 px-1 flex items-center shadow-inner rounded-[18px] backdrop-blur-md bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10">
          <motion.div 
            className="absolute z-10 flex items-center justify-center w-7 h-7 bg-red-600 rounded-full shadow-md"
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