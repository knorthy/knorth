"use client";
// Tech stack as a keyboard: each category is a row of keycaps that slides sideways as the page
// scrolls (rows alternate direction) and leans with scroll velocity. Keys press down on hover.
import { useRef } from "react";
import {
  motion, useScroll, useSpring, useTransform, useVelocity, type MotionValue,
} from "framer-motion";
import { useReducedMotion } from "@/components/useReducedMotionSafe";
import { TbCornerDownLeft } from "react-icons/tb";
import { skillGroups, type SkillGroup } from "@/data/career";
import PartHeading from "./PartHeading";

const FILL = 16; // keys per row before repeating, so short rows still cover a wide screen

function Keycap({ name, Icon, color }: { name: string; Icon: SkillGroup["skills"][number]["icon"]; color: string }) {
  return (
    <span className="keycap shrink-0" style={{ "--key-tint": color } as React.CSSProperties}>
      <span className="keycap-top">
        <Icon aria-hidden className="w-5 h-5 shrink-0" style={{ color }} />
        <span className="whitespace-nowrap">{name}</span>
      </span>
    </span>
  );
}

function ModKey({ label, color }: { label: string; color: string }) {
  return (
    <span className="keycap keycap-mod shrink-0" style={{ "--key-tint": color } as React.CSSProperties}>
      <span className="keycap-top justify-between">
        <span className="whitespace-nowrap font-bold">{label}</span>
        <TbCornerDownLeft aria-hidden className="w-3.5 h-3.5 opacity-60" />
      </span>
    </span>
  );
}

function KeyRow({ group, index, progress, skew }: {
  group: SkillGroup; index: number; progress: MotionValue<number>; skew: MotionValue<number>;
}) {
  const dir = index % 2 === 0 ? -1 : 1;
  // Each row travels a slightly different distance so the board never moves as one slab
  const travel = 18 + (index % 3) * 6;
  const x = useTransform(progress, [0, 1], dir < 0 ? ["0%", `-${travel}%`] : [`-${travel}%`, "0%"]);

  const reps = Math.max(2, Math.ceil(FILL / (group.skills.length + 1)));
  const sets = Array.from({ length: reps });

  return (
    <div className="relative">
      {/* Readable, non-repeating copy for assistive tech */}
      <ul className="sr-only">
        <li>{group.category}</li>
        {group.skills.map((s) => <li key={s.name}>{s.name}</li>)}
      </ul>
      <motion.div aria-hidden className="flex gap-3 w-max will-change-transform" style={{ x, skewX: skew }}>
        {sets.map((_, r) => (
          <div key={r} className="flex gap-3">
            <ModKey label={group.category} color={group.color} />
            {group.skills.map(({ name, icon }) => (
              <Keycap key={name} name={name} Icon={icon} color={group.color} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function StaticBoard() {
  return (
    <div className="flex flex-col gap-6">
      {skillGroups.map((g) => (
        <div key={g.category}>
          <h4 className="text-sm font-bold mb-3" style={{ color: g.color }}>{g.category}</h4>
          <ul className="flex flex-wrap gap-3">
            {g.skills.map(({ name, icon }) => (
              <li key={name}><Keycap name={name} Icon={icon} color={g.color} /></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function SkillsSection() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress, scrollY } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const velocity = useVelocity(scrollY);
  const smoothVel = useSpring(velocity, { stiffness: 200, damping: 40 });
  const skew = useTransform(smoothVel, [-2500, 0, 2500], [8, 0, -8], { clamp: true });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <section id="stack" className="relative pt-16 pb-16">
      <PartHeading
        className="mb-8"
        title={<>What I type <span style={{ color: "var(--color-accent2)" }}>with</span></>}
        description={<>Every tool on this keyboard, frontend to firmware to final cut.<span className="hidden [@media(hover:hover)]:inline"> Hover a key, it clicks.</span></>}
      />

      {reduce ? (
        <StaticBoard />
      ) : (
        <div
          ref={ref}
          className="keyboard relative left-1/2 -translate-x-1/2 w-screen overflow-hidden py-6 flex flex-col gap-3"
        >
          {skillGroups.map((g, i) => (
            <KeyRow key={g.category} group={g} index={i} progress={progress} skew={skew} />
          ))}
        </div>
      )}
    </section>
  );
}
