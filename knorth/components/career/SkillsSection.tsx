"use client";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { skillGroups } from "@/data/career";
import { enter, STAGGER_GROUP, STAGGER_ITEM, VIEWPORT } from "./motion";

// Split skill groups: left column gets first half, right column gets second half
function splitGroups<T>(arr: T[]): [T[], T[]] {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

export default function SkillsSection() {
  const reduce = useReducedMotion();

  const list: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: STAGGER_GROUP } },
  };
  const group: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { ...enter(), staggerChildren: STAGGER_ITEM } },
  };
  const chip: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: enter() } }
    : {
        hidden: { opacity: 0, transform: "translateY(12px) scale(0.96)" },
        show: { opacity: 1, transform: "translateY(0px) scale(1)", transition: enter() },
      };

  const [leftGroups, rightGroups] = splitGroups(skillGroups);

  const SkillColumn = ({ groups, align }: { groups: typeof skillGroups; align: "left" | "right" }) => (
    <motion.div
      variants={list}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className="flex flex-col gap-8"
    >
      {groups.map((g) => (
        <motion.div key={g.category} variants={group} className={align === "right" ? "text-right" : "text-left"}>
          <p
            className="text-[11px] uppercase tracking-widest font-bold mb-3"
            style={{ color: g.color }}
          >
            {g.category}
          </p>
          <ul className={`flex flex-wrap gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
            {g.skills.map(({ name, icon: Icon }) => (
              <motion.li key={name} variants={chip}>
                <span
                  className="career-hover flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-2xl bg-surface text-sm text-foreground/80"
                  style={{ "--accent-tint": g.color } as React.CSSProperties}
                >
                  <Icon aria-hidden className="w-4 h-4 shrink-0" style={{ color: g.color }} />
                  {name}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <section id="stack" className="relative py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-foreground/40 mb-8">01 — Tech stack</p>

      {/* 3-column layout: left skills | center placeholder | right skills */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-6 md:gap-x-10 items-start">
        {/* Left column */}
        <SkillColumn groups={leftGroups} align="left" />

        {/* Center — reserved space for character */}
        <div
          className="hidden md:flex items-start justify-center"
          style={{ width: "clamp(140px, 18vw, 260px)", minHeight: "420px" }}
          aria-hidden="true"
        >
          {/* Character goes here */}
        </div>

        {/* Right column */}
        <SkillColumn groups={rightGroups} align="right" />
      </div>
    </section>
  );
}
