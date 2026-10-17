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
  SiTypescript, SiLaravel, SiCplusplus, SiMysql, SiFirebase, SiSupabase,
  SiTensorflow, SiVercel, SiPicsart,
} from "react-icons/si";
import {
  TbBrandAdobePremiere, TbBrandAdobeIllustrator, TbBrandAdobeAfterEffect,
  TbBrandVscode, TbBrush, TbScissors, TbTrophy, TbRobot,
  TbBrandAdobePhotoshop, TbBrandAws, TbBrain,
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
      { name: "TypeScript", icon: SiTypescript },
      { name: "CSS", icon: SiCss },
    ],
  },
  {
    category: "Backend",
    color: ACCENT2,
    skills: [
      { name: "Node.js", icon: SiNodedotjs },
      { name: "Python", icon: SiPython },
      { name: "C++", icon: SiCplusplus },
      { name: "Laravel", icon: SiLaravel },
      { name: "MySQL", icon: SiMysql },
      { name: "Firebase", icon: SiFirebase },
      { name: "Supabase", icon: SiSupabase },
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
    category: "AI & Cloud",
    color: ACCENT2,
    skills: [
      { name: "TensorFlow", icon: SiTensorflow },
      { name: "Gymnasium", icon: TbBrain },
      { name: "AWS", icon: TbBrandAws },
      { name: "Vercel", icon: SiVercel },
    ],
  },
  {
    category: "Design & Media",
    color: ACCENT4,
    skills: [
      { name: "Figma", icon: SiFigma },
      { name: "Photoshop", icon: TbBrandAdobePhotoshop },
      { name: "Canva", icon: TbBrush },
      { name: "CapCut", icon: TbScissors },
      { name: "Premiere Pro", icon: TbBrandAdobePremiere },
      { name: "Illustrator", icon: TbBrandAdobeIllustrator },
      { name: "After Effects", icon: TbBrandAdobeAfterEffect },
      { name: "DaVinci Resolve", icon: SiDavinciresolve },
      { name: "Picsart", icon: SiPicsart },
    ],
  },
  {
    category: "Tools",
    color: ACCENT,
    skills: [
      { name: "Git", icon: SiGit },
      { name: "GitHub", icon: SiGithub },
      { name: "VS Code", icon: TbBrandVscode },
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
    type: "Internship · Remote",
    period: "Sep 2026 – Present",
    category: "Engineering Internship",
    color: ACCENT,
    bullets: [
      "Engineering Sandbox — Taking part in a self-paced, mentor-guided program, working on hands-on engineering tasks to keep building my skills.",
    ],
  },
  {
    role: "Developer Intern",
    company: "whiteStrings®",
    type: "Internship · Remote",
    period: "Jul 2026 – Aug 2026",
    category: "Laravel, SQL, React, TypeScript",
    color: ACCENT,
    bullets: [
      "Expense Tracker — Trained in Laravel and SQL, then built an expense tracker app with the team using React and TypeScript.",
    ],
  },
  {
    role: "QA Analyst Intern",
    company: "whiteStrings®",
    type: "Internship · Remote",
    period: "Jun 2026 – Jul 2026",
    category: "Quality Assurance",
    color: ACCENT,
    bullets: [
      "Quality Assurance — Tested the company's software to find bugs and make sure features worked properly before release.",
    ],
  },
  {
    role: "Freelance Developer",
    company: "Freelance",
    type: "Remote",
    period: "Jan 2023 – Present",
    category: "Web, Mobile, Embedded Systems · Arduino & Microcontrollers",
    color: ACCENT2,
    bullets: [
      "POS Systems — Built full-cycle point-of-sale systems with inventory management and real-time sales reporting for SME clients.",
      "Personal Websites — Developed responsive personal and portfolio websites using Next.js and React with modern UI/UX.",
      "APFC using ESP controllers — Designed and programmed an Automatic Power Factor Corrector using ESP microcontrollers with real-time monitoring and cloud-based logging.",
      "IoT Earthquake Detector — Built an IoT seismic detection system using ESP controllers with automated alerts and remote data monitoring via cloud integration.",
      "Misting Sanitation Pipes — Developed an Arduino-powered automated misting sanitation system with QR-based attendance tracking and sensor-triggered activation.",
    ],
  },
  {
    role: "Freelance Graphic Artist",
    company: "Freelance",
    type: "Remote",
    period: "Jan 2022 – 2024",
    category: "Publications, video, photography, animation, digital ads",
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
  { kind: "member", org: "AWS Student Builders Group – Spade", period: "Jun 2024 – Present", role: "Support Council, Creatives & Graphics Office", color: ACCENT3 },
  { kind: "member", org: "AWS User Group BuildHers+", period: "Mar 2026 – Present", role: "Support Council, Operations Department", color: ACCENT3 },
  { kind: "member", org: "Computer Science Student Organization", period: "Jun 2024 – Jun 2025", role: "Support Council, Creatives & Graphics Office", color: ACCENT2 },
  { kind: "volunteer", org: "Quantum Computing Society of the Philippines", period: "Apr 2026", role: "Technical Team, Full-stack Developer", color: ACCENT },
  { kind: "volunteer", org: "Arduino Philippines", period: "Mar 2026", role: "Creatives & Graphics Department", color: ACCENT2 },
  { kind: "volunteer", org: "Blockchain Campus Conference", period: "May 2025 – Nov 2025", role: "Technical Team, Full-stack Developer", color: ACCENT4 },
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
  { name: "AI in UX for FinTech Hackathon — Champion", issuer: "KadaKareer × Home Credit", date: "Dec 2025", color: ACCENT2, icon: TbTrophy },
  // newest: dealt last, so it lands on top of the pile
  { name: "Mechatronics Servicing NC II", issuer: "TESDA", date: "2026", color: ACCENT4, icon: TbRobot },
];
