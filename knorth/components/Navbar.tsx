"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Use resolvedTheme for accurate system preference detection
  const isDark = resolvedTheme === 'dark';

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
      
      {/* Main Navigation */}
      <div className="flex items-center gap-8 px-10 py-3 
                      bg-white/10 dark:bg-black/20 
                      backdrop-blur-xl border border-white/20 
                      rounded-full shadow-xl">
        {/* Changed: uses text-foreground to match Hero component logic */}
        <div className="flex gap-8 text-sm font-medium text-foreground/80">
          <a href="#home" className="hover:text-[#224766] transition-colors">Home</a>
          <a href="#about" className="hover:text-[#224766] transition-colors">About</a>
          <a href="#experience" className="hover:text-[#224766] transition-colors">Experience</a>
          <a href="#projects" className="hover:text-[#224766] transition-colors">Projects</a>
          <a href="#contact" className="hover:text-[#224766] transition-colors">Contact Me</a>
        </div>
      </div>

      {/* Download CV  */}
      <div className="flex items-center gap-3">
        <button className="px-8 py-3 text-sm font-bold text-white 
                           bg-[#224766] hover:bg-[#1a3a5a] rounded-full 
                           transition-all active:scale-95 shadow-lg">
          Download CV
        </button>

        {/* The Red Glass Switch */}
        <div 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="relative w-16 h-9 px-1 flex items-center cursor-pointer
                     bg-white/10 dark:bg-black/30 backdrop-blur-md 
                     border border-white/20 rounded-full shadow-inner"
        >
          {/* Sliding Red Circle */}
          <motion.div 
            className="absolute z-10 flex items-center justify-center w-7 h-7 bg-[#224766] rounded-full shadow-md"
            animate={{ x: isDark ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {isDark ? <Moon size={14} className="text-white" /> : <Sun size={14} className="text-white" />}
          </motion.div>

          {/* Background Icons (Static) */}
          <div className="flex justify-between w-full px-1 opacity-40">
            <Sun size={14} className="text-gray-400" />
            <Moon size={14} className="text-gray-400" />
          </div>
        </div>
      </div>
    </nav>
  );
}
