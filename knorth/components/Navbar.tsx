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
    <nav className="fixed top-6 left-0 right-0 z-50 flex items-center justify-between px-6">
      
      {/* Logo - Upper Left */}
      <div className="flex items-center">
        <a href="#home" className="text-2xl font-bold text-[#224766]">
          Knorth
        </a>
      </div>

      {/* Main Navigation - Center */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 px-10 py-3 shadow-xl rounded-[20px] backdrop-blur-md bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10">
        <div className="flex gap-8 text-sm font-medium text-foreground/80">
          <a href="#home" className="hover:text-[#224766] transition-colors">Home</a>
          <a href="#about" className="hover:text-[#224766] transition-colors">About</a>
          <a href="#experience" className="hover:text-[#224766] transition-colors">Experience</a>
          <a href="#projects" className="hover:text-[#224766] transition-colors">Projects</a>
          <a href="#contact" className="hover:text-[#224766] transition-colors">Contact Me</a>
        </div>
      </div>

      {/* Theme Switch - Upper Right */}
      <div onClick={() => setTheme(isDark ? 'light' : 'dark')} className="cursor-pointer">
        <div className="relative w-16 h-9 px-1 flex items-center shadow-inner rounded-[18px] backdrop-blur-md bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10">
          {/* Sliding Red Circle */}
          <motion.div 
            className="absolute z-10 flex items-center justify-center w-7 h-7 bg-red-600 rounded-full shadow-md"
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
