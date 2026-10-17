// ─────────────────────────────────────────────────────────────────────────────
// Project case files shown under the "Things that run" gallery.
// `featured` projects get the big highlighted cards (in this order); everything else is listed below.
// Only facts already confirmed elsewhere on the site are filled in. Add `summary`, `role`, `stack`,
// `link` and `image` (put files in /public/projects) to fill a card out; until then it says so.
// ─────────────────────────────────────────────────────────────────────────────
import { ACCENT, ACCENT2, ACCENT3, ACCENT4 } from "./career";

export type Project = {
  slug: string;
  name: string;
  color: string;
  /** one line: the problem it solves */
  summary?: string;
  /** shown as a highlighted card */
  featured?: boolean;
  /** brand mark for the card's tile, and the tile colour behind it */
  logo?: string;
  logoBg?: string;
  role?: string;
  stack?: string[];
  link?: { label: string; href: string };
  image?: string;
};

export const projects: Project[] = [
  {
    slug: "psometric",
    name: "PsoMetric: Image Recognition for Psoriasis Severity",
    color: ACCENT4,
    featured: true,
    logo: "/logo/3.png",
    logoBg: "#ffffff",
    summary: "A cross-platform React Native app where clinicians upload skin images and get AI-powered, real-time PASI severity scores with annotated lesion analysis.",
    role: "Full-stack developer · UI/UX designer",
    stack: ["React Native", "Image recognition", "AI scoring"],
  },
  {
    slug: "metacampus",
    name: "MetaCampus: AR for Interactive Student Events",
    color: ACCENT2,
    featured: true,
    logo: "/logo/5.png",
    logoBg: "#000000",
    summary: "An augmented reality campus engagement platform. Led UI/UX design in Figma and coordinated team milestones for on-time delivery.",
    role: "Project manager · Full-stack developer · UI/UX designer",
    stack: ["Augmented reality", "Figma"],
  },
  {
    slug: "oneindang",
    name: "One Indang: Digital Governance App",
    color: ACCENT,
    featured: true,
    summary: "The official mobile app of the Municipality of Indang: a citizen-centric platform for public services, emergency contacts, news and community issue reporting.",
    role: "Full-stack developer · UI/UX designer",
    stack: ["Mobile app", "LGU platform"],
  },
  {
    slug: "tbltbu",
    name: "The Blind Leading the Blown Up",
    color: ACCENT3,
    featured: true,
    summary: "A 3D game. Led the design and development end to end: gameplay mechanics, level design and project delivery.",
    role: "Lead project personnel · 3D game designer · Developer",
    stack: ["3D game design", "Level design"],
  },
  {
    slug: "rl-pfc",
    name: "Reinforcement Learning Power Factor Corrector",
    color: ACCENT2,
    featured: true,
    summary: "A reinforcement learning model that dynamically optimizes power factor correction, reducing energy waste in a simulated electrical system.",
    role: "Developer",
    stack: ["Reinforcement learning", "Simulation"],
  },
  {
    slug: "apfc",
    name: "APFC: Automatic Power Factor Corrector",
    color: ACCENT3,
    featured: true,
    summary: "ESP-based power factor correction with real-time monitoring and cloud-based logging.",
    role: "Freelance developer · Embedded systems",
    stack: ["ESP32", "Microcontrollers", "Cloud logging"],
  },
  {
    slug: "dashcar",
    name: "Dash Car Rentals",
    color: ACCENT,
    summary: "A responsive car rental platform prototype in Figma with intuitive booking flows and real-time availability checking.",
    role: "Full-stack developer · UI/UX designer",
    stack: ["Figma", "Prototype"],
  },
  {
    slug: "earthquake-detector",
    name: "IoT Earthquake Detector",
    color: ACCENT,
    summary: "Seismic detection on ESP controllers with automated alerts and remote monitoring through the cloud.",
    role: "Freelance developer · Embedded systems",
    stack: ["ESP32", "Sensors", "Cloud alerts"],
  },
  {
    slug: "misting-sanitation",
    name: "Misting Sanitation System",
    color: ACCENT2,
    summary: "Arduino-powered misting pipes with sensor-triggered activation and QR-based attendance tracking.",
    role: "Freelance developer · Embedded systems",
    stack: ["Arduino", "Sensors", "QR attendance"],
  },
  {
    slug: "pos",
    name: "POS Systems",
    color: ACCENT4,
    summary: "Full-cycle point-of-sale systems with inventory management and real-time sales reporting for small businesses.",
    role: "Freelance developer",
  },
  // Gallery projects not in the CV yet: fill these in to promote them to full cards
  { slug: "juno", name: "Juno", color: ACCENT },
  { slug: "claro", name: "Claro", color: ACCENT3 },
  { slug: "homevision", name: "HomeVision", color: ACCENT, logo: "/logo/6.png", logoBg: "#ffffff" },
];
