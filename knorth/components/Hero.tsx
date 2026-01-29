"use client";
import { motion } from "framer-motion";
import { Instagram, Linkedin, Github, Twitter, Figma, Facebook } from "lucide-react";
import Typewriter from 'typewriter-effect';

export default function Hero() {
  const socialIcons = [
    { icon: <Instagram size={20} />, link: "#" },
    { icon: <Linkedin size={20} />, link: "#" },
    { icon: <Github size={20} />, link: "#" },
    { icon: <Twitter size={20} />, link: "#" },
    { icon: <Figma size={20} />, link: "#" },
    { icon: <Facebook size={20} />, link: "#" },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 items-center justify-center min-h-[80vh] pt-20 px-6 gap-y-12 gap-x-8 max-w-6xl mx-auto">
      
      {/* for my 3d character */}
      <div className="hidden md:flex relative w-full min-h-[350px] items-center justify-center">
        {/* space */}
      </div>

      <div className="flex flex-col items-center md:items-end text-center md:text-right w-full">
          <div className="relative">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-foreground/80 mb-2 italic"
            >
              Hello! I Am <span className="text-red-600 font-semibold">Tiffany Lyssa</span>
            </motion.p>
            
            {/* Curved Arrow pointing to the left */}
            <svg 
              className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 w-64 h-32 text-foreground/40 pointer-events-none overflow-visible"
              viewBox="0 0 200 100"
              fill="none"
            >
              {/* Arrow curve path */}
              <motion.path 
                d="M190 50 Q100 -15, 15 45"
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                  pathLength: {
                        duration: 1, 
                        ease: "easeInOut", 
                        repeat: Infinity, 
                        repeatDelay: .5,
                  },
                  opacity: { duration: 0.3 }
                }}
              />
              {/* Arrowhead */}
              <motion.path 
                d="M15 45 L20 28 M15 45 L30 45"
                stroke="currentColor" 
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                  pathLength: {
                        duration: 1, 
                        ease: "easeInOut", 
                        repeat: Infinity, 
                        repeatDelay: .5,
                  },
                  opacity: { duration: 0.2, delay: 1.5 }
                }}
              />
            </svg>
          </div>
          
          <div className="relative mb-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Judges a book<br />by its{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-red-600">cover</span>
                <svg 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[140%] text-foreground/60 pointer-events-none overflow-visible" 
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <motion.ellipse 
                    cx="50" cy="50" rx="45" ry="38" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                      pathLength: {
                        duration: 1, 
                        ease: "easeInOut", 
                        repeat: Infinity, 
                        repeatDelay: .5,
                      },
                      opacity: { duration: 0.2 }
                    }}
                  />
                </svg>
              </span>...
            </h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 mt-2">
              Because if the cover does not impress you what else can?
            </p>
          </div>

          {/* Social Logos */}
          <div className="flex gap-5 mt-4 text-foreground/60">
            {socialIcons.map((item, idx) => (
              <motion.a
                key={idx}
                href={item.link}
                whileHover={{ y: -3, color: "var(--color-red-600)" }}
                className="hover:text-red-600 transition-colors"
              >
                {item.icon}
              </motion.a>
            ))}
          </div>
      </div>

      <div className="flex flex-col justify-center text-left w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-medium mb-4 flex flex-wrap gap-2"
          >
            <span>I'm a</span>
            <span className="text-red-600">
              <Typewriter
                options={{
                  strings: ['Software Engineer.', 'Designer.', 'Freelancer.'],
                  autoStart: true,
                  loop: true,
                  delay: 75,
                  deleteSpeed: 50,
                }}
              />
            </span>
          </motion.div>
          <p className="text-foreground/60 mb-8 max-w-md leading-relaxed">
            Currently, I'm working as a freelancer. 
            A self-taught designer, functioning in the industry for 3+ years now. 
            I make meaningful and delightful digital products that create an equilibrium 
            between user needs and business goals.
          </p>
      </div>
      <div className="hidden md:block"></div>

    </section>
  );
}