"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex items-center justify-center gap-4 px-6">
      
      {/* Main Navigation */}
      <div className="flex items-center gap-8 px-10 py-3 
                      bg-foreground/5 backdrop-blur-xl 
                      border border-foreground/10 
                      rounded-full shadow-xl transition-colors duration-300">
        <div className="flex gap-8 text-sm font-medium text-foreground/80">
          <a href="#home" className="hover:text-red-600 transition-colors">Home</a>
          <a href="#about" className="hover:text-red-600 transition-colors">About</a>
          <a href="#experience" className="hover:text-red-600 transition-colors">Experience</a>
          <a href="#projects" className="hover:text-red-600 transition-colors">Projects</a>
          <a href="#contact" className="hover:text-red-600 transition-colors">Contact Me</a>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="px-8 py-3 text-sm font-bold text-white 
                           bg-red-700 hover:bg-red-600 rounded-full 
                           transition-all active:scale-95 shadow-lg">
          Download CV
        </button>

        {/* The Red Glass Switch */}
        <div 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="relative w-16 h-9 px-1 flex items-center cursor-pointer
                     bg-foreground/10 backdrop-blur-md 
                     border border-foreground/10 rounded-full shadow-inner"
        >
          <motion.div 
            className="absolute z-10 flex items-center justify-center w-7 h-7 bg-red-600 rounded-full shadow-md"
            animate={{ x: isDark ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {isDark ? <Moon size={14} className="text-white" /> : <Sun size={14} className="text-white" />}
          </motion.div>

          <div className="flex justify-between w-full px-1 opacity-40">
            <Sun size={14} className="text-foreground" />
            <Moon size={14} className="text-foreground" />
          </div>
        </div>
      </div>
    </nav>
  );
}