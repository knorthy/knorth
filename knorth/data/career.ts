// ─────────────────────────────────────────────────────────────────────────────
// Career content — edit everything shown on /experience (and the home preview)
// here. Entries marked `// placeholder` are stand-ins to replace with real data.
// ─────────────────────────────────────────────────────────────────────────────
import type { IconType } from "react-icons";
import {
  SiNextdotjs, SiReact, SiTailwindcss, SiJavascript, SiCss,
  SiNodedotjs, SiPython, SiSpringboot,
  SiFlutter, SiArduino, SiEspressif,
  SiFigma, SiDavinciresolve,
  SiGit, SiGithub,
  SiCisco, SiDatacamp,
} from "react-icons/si";
import {
  TbBrandAdobePremiere, TbBrandAdobeIllustrator, TbBrandAdobeAfterEffect,
  TbBrandVscode, TbBrush, TbScissors, TbTrophy,
} from "react-icons/tb";

export const ACCENT  = "#f72585"; // pink
export const ACCENT2 = "#b5ff4d"; // lime
export const ACCENT3 = "#ffe566"; // yellow
export const ACCENT4 = "#a855f7"; // violet

// ── Tech stack ───────────────────────────────────────────────────────────────
export type Skill = { name: string; icon: IconType };
export type SkillGroup = { category: string; color: string; skills: Skill[] };

export const skillGroups: SkillGroup[] = [
  {
    category: "Frontend",
    color: ACCENT,
    skills: [
      { name: "Next.js", icon: SiNextdotjs },
      { name: "React", icon: SiReact },
      { name: "Tailwind CSS", icon: SiTailwindcss },
      { name: "JavaScript", icon: SiJavascript },
      { name: "CSS", icon: SiCss },
    ],
  },
  {
    category: "Backend",
    color: ACCENT2,
    skills: [
      { name: "Node.js", icon: SiNodedotjs },
      { name: "Python", icon: SiPython },
      { name: "Spring Boot", icon: SiSpringboot },
    ],
  },
  {
    category: "Mobile & Embedded",
    color: ACCENT3,
    skills: [
      { name: "FlutterFlow", icon: SiFlutter },
      { name: "Arduino", icon: SiArduino },
      { name: "ESP32", icon: SiEspressif },
    ],
  },
  {
    category: "Design & Media",
    color: ACCENT4,
    skills: [
      { name: "Figma", icon: SiFigma },
      { name: "Canva", icon: TbBrush },
      { name: "CapCut", icon: TbScissors },
      { name: "Premiere Pro", icon: TbBrandAdobePremiere },
      { name: "Illustrator", icon: TbBrandAdobeIllustrator },
      { name: "After Effects", icon: TbBrandAdobeAfterEffect },
      { name: "DaVinci Resolve", icon: SiDavinciresolve },
    ],
  },
  {
    category: "Tools",
    color: ACCENT,
    skills: [
      { name: "Git", icon: SiGit },         // placeholder
      { name: "GitHub", icon: SiGithub },   // placeholder
      { name: "VS Code", icon: TbBrandVscode }, // placeholder
    ],
  },
];

// ── Experience ───────────────────────────────────────────────────────────────
export type Job = {
  role: string;
  company: string;
  type: string;
  period: string;
  category: string;
  color: string;
  /** Optional photo for the scroll story, e.g. "/career/dev.jpg" (put files in /public/career). Falls back to a color tile. */
  image?: string;
  /** "Title — description" bullets render the title in bold */
  bullets: string[];
};

export const jobs: Job[] = [
  {
    role: "Engineering Sandbox Trainee",
    company: "whiteStrings®",
    type: "Internship",
    period: "Sep 2026 – Present",
    category: "Engineering Internship",
    color: ACCENT,
    bullets: [
      "Engineering Sandbox — Undergoing hands-on training as part of whiteStrings®' engineering internship programme, working across real product features.",
    ],
  },
  {
    role: "Developer",
    company: "whiteStrings®",
    type: "Remote",
    period: "Jul 2026 – Aug 2026",
    category: "React Native, TypeScript",
    color: ACCENT,
    bullets: [
      "React Native & TypeScript — Built and shipped mobile features using React Native and TypeScript within the whiteStrings® product team.",
    ],
  },
  {
    role: "QA Analyst Intern",
    company: "whiteStrings®",
    type: "Remote",
    period: "Jun 2026 – Jul 2026",
    category: "Quality Assurance",
    color: ACCENT,
    bullets: [
      "Quality Assurance — Performed software quality assurance testing, documented bugs, and verified fixes across the product lifecycle.",
    ],
  },
  {
    role: "Embedded System Engineer",
    company: "Freelance",
    type: "Remote",
    period: "Jun 2022 – Present",
    category: "IoT, Arduino, ESP32 & Microcontrollers",
    color: ACCENT3,
    bullets: [
      "APFC using ESP controllers — Designed and programmed an Automatic Power Factor Corrector using ESP microcontrollers with real-time monitoring and cloud-based logging.",
      "IoT Earthquake Detector — Built an IoT seismic detection system using ESP controllers with automated alerts and remote data monitoring via cloud integration.",
      "Misting Sanitation Pipes — Developed an Arduino-powered automated misting sanitation system with QR-based attendance tracking and sensor-triggered activation.",
    ],
  },
  {
    role: "Full-Stack Web & Mobile Developer",
    company: "Freelance",
    type: "Remote",
    period: "Jan 2023 – Present",
    category: "Web, Mobile · React.js, Vue.js and more",
    color: ACCENT2,
    bullets: [
      "POS Systems — Built full-cycle point-of-sale systems with inventory management and real-time sales reporting for SME clients.",
      "Personal Websites — Developed responsive personal and portfolio websites using Next.js and React with modern UI/UX.",
    ],
  },
  {
    role: "Graphic Design Artist",
    company: "Freelance",
    type: "Philippines · Remote",
    period: "Mar 2023 – Aug 2026",
    category: "Adobe Photoshop, Illustrator and more",
    color: ACCENT4,
    bullets: [
      "Marketing Publications — Designed posters, flyers, and digital ads for events and campaigns; handled on-the-spot content creation and real-time posting during live sessions.",
      "Video Editing — Edited promotional videos and produced motion graphics and typography animations using DaVinci Resolve and Adobe After Effects.",
    ],
  },
];

// ── Leadership & volunteering ────────────────────────────────────────────────
export type Affiliation = {
  kind: "member" | "volunteer";
  org: string;
  role: string;
  period: string;
  color: string;
};

export const affiliations: Affiliation[] = [
  { kind: "member", org: "AWS Student Builders Group – Spade", period: "Jun 2026 – Present", role: "Marketing Committee", color: ACCENT3 },
  { kind: "member", org: "AWS Student Builders Group – Spade", period: "Jun 2024 – Present", role: "Creative Committee", color: ACCENT3 },
  { kind: "member", org: "AWS User Group BuildHers+", period: "March 2026 – Present", role: "Support Council, Operations Department", color: ACCENT3 },
  { kind: "member", org: "Computer Science Student Organization", period: "June 2024 – June 2025", role: "Support Council, Creatives & Graphics Office", color: ACCENT2 },
  { kind: "volunteer", org: "Quantum Computing Society of the Philippines", period: "April 2026", role: "Technical Team | Full-stack Developer", color: ACCENT },
  { kind: "volunteer", org: "Arduino Philippines", period: "March 2026", role: "Creatives & Graphics Department", color: ACCENT2 },
  { kind: "volunteer", org: "Blockchain Campus Conference", period: "May 2025 – November 2025", role: "Technical Team | Full-stack Developer", color: ACCENT4 },
];

// ── Certifications ───────────────────────────────────────────────────────────
export type Certification = {
  name: string;
  issuer: string;
  date: string;
  /** Optional — shows a "View credential" link when set */
  credentialUrl?: string;
  color: string;
  icon: IconType;
};

export const certifications: Certification[] = [
  { name: "Introduction to Cybersecurity", issuer: "Cisco", date: "2024", color: ACCENT, icon: SiCisco },            // placeholder date
  { name: "Cyber Threat Management", issuer: "Cisco", date: "2024", color: ACCENT, icon: SiCisco },                  // placeholder date
  { name: "Introduction to Cloud Computing", issuer: "DataCamp", date: "2024", color: ACCENT3, icon: SiDatacamp },  // placeholder date
  { name: "Git Foundations", issuer: "DataCamp", date: "2024", color: ACCENT3, icon: SiDatacamp },                  // placeholder date
  { name: "AI in UX Hackathon — Champion", issuer: "Hackathon", date: "2025", color: ACCENT2, icon: TbTrophy },     // placeholder issuer + date
];
