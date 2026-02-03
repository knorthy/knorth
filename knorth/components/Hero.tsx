"use client";
import { motion } from "framer-motion";
import { Instagram, Linkedin, Github, Twitter, Figma, Facebook } from "lucide-react";
import Typewriter from 'typewriter-effect';
import TiltedCard from "@/components/designs/TiltedCard"; 
import ScrollFloat from "@/components/designs/ScrollFloat";

export default function Hero() {
  const socialIcons = [
    { icon: <Instagram size={20} />, link: "#" },
    { icon: <Linkedin size={20} />, link: "https://www.linkedin.com/in/tiffany-lyssa-4b210b281/" },
    { icon: <Github size={20} />, link: "https://github.com/knorthy" },
    { icon: <Twitter size={20} />, link: "https://x.com/kno_orth" },
    { icon: <Figma size={20} />, link: "#" },
    { icon: <Facebook size={20} />, link: "https://www.facebook.com/lystffny/" },
  ];

  const developSkills = ["Next.js", "Tailwind", "React", "Javascript", "CSS", "Node.js", "Python", "SpringBoot", "FlutterFlow"];
  const createSkills = ["Figma", "Canva", "Capcut", "Adobe Premiere Pro", "Adobe Illustrator"];

  return (
    <div className="flex flex-col w-full">
      
      {/* HOME */}
      <section id="home" className="flex flex-col items-center justify-center min-h-screen px-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col items-center md:items-end text-center md:text-right w-full">
          <div className="relative">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-foreground/80 mb-2 italic"
            >
              Hello! I Am <span className="text-[#224766] font-semibold">Tiffany Lyssa</span>
            </motion.p>
            
            <svg
              className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 w-64 h-32 text-foreground/40 pointer-events-none overflow-visible"
              viewBox="0 0 200 100"
              fill="none"
            >
              <motion.path
                d="M190 50 Q100 -15, 15 45"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: .5 },
                  opacity: { duration: 0.3 }
                }}
              />
              <motion.path
                d="M15 45 L20 28 M15 45 L30 45"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: .5 },
                  opacity: { duration: 0.2, delay: 1.5 }
                }}
              />
            </svg>
          </div>
          
          <div className="relative mb-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Judges a book<br />by its{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#224766]">cover</span>
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
                      pathLength: { duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: .5 },
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

          <div className="flex gap-5 mt-4 text-foreground/60">
            {socialIcons.map((item, idx) => (
              <motion.a
                key={idx}
                href={item.link}
                whileHover={{ y: -3, color: "#224766" }}
                className="hover:text-[#224766] transition-colors"
              >
                {item.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT*/}
      <section id="about" className="flex flex-col items-center justify-center min-h-screen px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          
          {/* CONTENT LEFT */}
          <div className="flex flex-col justify-center text-left w-full order-2 md:order-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-medium mb-12 flex flex-wrap gap-2"
            >
              <span>I'm a</span>
              <span className="text-[#224766]">
                <Typewriter
                  options={{
                    strings: ['Software Engineer.', 'Designer.', 'Developer.'],
                    autoStart: true,
                    loop: true,
                    delay: 75,
                  }}
                />
              </span>
            </motion.div>
            
            <div className="space-y-10">
              {/* DEVELOP BLOCK */}
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3 text-[#224766]">Develop</h3>
                <p className="text-foreground/60 mb-4 max-w-md text-xs leading-relaxed">
                  I make meaningful and delightful digital products that create an equilibrium 
                  between user needs and business goals.
                </p>
                <div className="flex flex-wrap gap-2">
                  {developSkills.map((skill) => (
                    <span key={skill} className="px-3 py-1 border border-foreground/20 rounded-full text-[10px] opacity-80 uppercase tracking-tighter">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* CREATE BLOCK */}
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold mb-3 text-[#224766]">Create</h3>
                <p className="text-foreground/60 mb-4 max-w-md text-xs leading-relaxed">
                  My content creation journey evolved from a side hustle to serving other creators, 
                  achieving meaningful visual storytelling.
                </p>
                <div className="flex flex-wrap gap-2">
                  {createSkills.map((skill) => (
                    <span key={skill} className="px-3 py-1 border border-foreground/20 rounded-full text-[10px] opacity-80 uppercase tracking-tighter">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TILTEDCARD */}
          <div className="relative flex justify-center md:justify-end items-center w-full order-1 md:order-2">
            
            {/* WHAT I DO */}
            <div className="absolute -top-12 left-0 md:-left-20 z-20 pointer-events-none select-none">
              <ScrollFloat
                animationDuration={1}
                ease="back.inOut(2)"
                scrollStart="center bottom+=50%"
                scrollEnd="bottom bottom-=40%"
                stagger={0.03}
                ghost={true}
                containerClassName="text-6xl md:text-8xl font-black uppercase tracking-tighter text-foreground dark:text-white"
              >
                What I Do
              </ScrollFloat>
            </div>

            <TiltedCard
              imageSrc="/profile.jpg" 
              altText="Tiffany Lyssa"
              captionText="Tiffany Lyssa"
              containerHeight="600px"
              containerWidth="100%"
              imageHeight="500px"
              imageWidth="400px"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-lg text-white text-[10px] border border-white/20">
                  BASE IN PH
                </div>
              }
            />
          </div>

        </div>
      </section>

      {/* FOOTER SECTIONS FOR SCROLLING */}
      <section id="experience" className="min-h-screen flex items-center justify-center opacity-20 uppercase tracking-[1em]">Experience</section>
      <section id="projects" className="min-h-screen flex items-center justify-center opacity-20 uppercase tracking-[1em]">Projects</section>
      <section id="contact" className="min-h-screen flex items-center justify-center opacity-20 uppercase tracking-[1em]">Contact</section>

    </div>
  );
}