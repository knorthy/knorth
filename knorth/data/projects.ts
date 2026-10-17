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
    slug: "apfc",
    name: "APFC: Automatic Power Factor Corrector",
    color: ACCENT3,
    featured: true,
    summary: "ESP-based power factor correction with real-time monitoring and cloud-based logging.",
    role: "Embedded system engineer · freelance",
    stack: ["ESP32", "Microcontrollers", "Cloud logging"],
  },
  {
    slug: "earthquake-detector",
    name: "IoT Earthquake Detector",
    color: ACCENT,
    summary: "Seismic detection on ESP controllers with automated alerts and remote monitoring through the cloud.",
    role: "Embedded system engineer · freelance",
    stack: ["ESP32", "Sensors", "Cloud alerts"],
  },
  {
    slug: "misting-sanitation",
    name: "Misting Sanitation System",
    color: ACCENT2,
    summary: "Arduino-powered misting pipes with sensor-triggered activation and QR-based attendance tracking.",
    role: "Embedded system engineer · freelance",
    stack: ["Arduino", "Sensors", "QR attendance"],
  },
  {
    slug: "pos",
    name: "POS Systems",
    color: ACCENT4,
    summary: "Full-cycle point-of-sale systems with inventory management and real-time sales reporting for small businesses.",
    role: "Full-stack developer · freelance",
  },
  // Gallery projects: fill these in to promote them to full cards
  { slug: "juno", name: "Juno", color: ACCENT },
  { slug: "metacampus", name: "MetaCampus", color: ACCENT2, featured: true, logo: "/logo/5.png", logoBg: "#000000" },
  { slug: "claro", name: "Claro", color: ACCENT3 },
  { slug: "homevision", name: "HomeVision", color: ACCENT, featured: true, logo: "/logo/6.png", logoBg: "#ffffff" },
  { slug: "dashcar", name: "DashCar Rentals", color: ACCENT },
  { slug: "psometric", name: "PsoMetric", color: ACCENT4, featured: true, logo: "/logo/3.png", logoBg: "#ffffff" },
  { slug: "tbltbu", name: "TBLTBU", color: ACCENT3 },
  { slug: "oneindang", name: "OneIndang", color: ACCENT4 },
];
