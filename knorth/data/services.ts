// ─────────────────────────────────────────────────────────────────────────────
// Services: what Tiffany can be hired for. Shown in the "sudo make" wheel under the career heading.
// Gallery: drop images in /public/services and list them per service, in the order they should appear.
// Each sweep of the divider shows the next one and it loops back to the first, e.g.
//   gallery: [
//     { src: "/services/websites-1.jpg", caption: "Portfolio site for a client" },
//     { src: "/services/websites-2.jpg", caption: "Landing page" },
//   ],
// Until a service has images, it shows three placeholder slides.
// ─────────────────────────────────────────────────────────────────────────────
import { ACCENT, ACCENT2, ACCENT3, ACCENT4 } from "./career";

export type Service = {
  /** make target shown big, e.g. `sudo make websites` */
  slug: string;
  /** readable name, used for labels and screen readers */
  name: string;
  category: string;
  color: string;
  description: string;
  /** slugs of other services this one pairs with */
  pairs: string[];
  /** images shown in the swipe-through panel, in order (loops) */
  gallery?: { src: string; caption: string }[];
};

export const services: Service[] = [
  {
    slug: "websites",
    name: "Websites",
    category: "Build",
    color: ACCENT,
    description: "Responsive personal and portfolio sites in Next.js and React, with UI that feels finished.",
    pairs: ["ui-ux", "motion"],
  },
  {
    slug: "mobile-apps",
    name: "Mobile apps",
    category: "Build",
    color: ACCENT,
    description: "Mobile features in React Native and TypeScript, shipped inside a real product team.",
    pairs: ["ui-ux", "qa"],
  },
  {
    slug: "pos-systems",
    name: "POS systems",
    category: "Build",
    color: ACCENT2,
    description: "Point-of-sale systems with inventory management and real-time sales reporting for small businesses.",
    pairs: ["websites", "qa"],
  },
  {
    slug: "ui-ux",
    name: "UI/UX design",
    category: "Design",
    color: ACCENT4,
    description: "Flows and interfaces designed in Figma by the same person who builds them. AI in UX Hackathon champion.",
    pairs: ["websites", "mobile-apps"],
  },
  {
    slug: "graphics",
    name: "Graphic design",
    category: "Design",
    color: ACCENT4,
    description: "Posters, flyers and digital ads for events and campaigns, including on-the-spot content during live sessions.",
    pairs: ["motion", "ui-ux"],
  },
  {
    slug: "motion",
    name: "Video & motion",
    category: "Media",
    color: ACCENT3,
    description: "Promo videos, motion graphics and typography animation in DaVinci Resolve and After Effects.",
    pairs: ["graphics", "websites"],
  },
  {
    slug: "iot",
    name: "Embedded & IoT",
    category: "Hardware",
    color: ACCENT2,
    description: "ESP32 and Arduino builds with sensors, alerts and cloud logging: a power factor corrector, an earthquake detector, a misting sanitation system.",
    pairs: ["websites", "qa"],
  },
  {
    slug: "qa",
    name: "QA testing",
    category: "Quality",
    color: ACCENT,
    description: "Testing software, documenting bugs and verifying fixes across the product lifecycle.",
    pairs: ["mobile-apps", "pos-systems"],
  },
];
