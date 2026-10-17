// ─────────────────────────────────────────────────────────────────────────────
// Services: what Tiffany can be hired for. Shown in the "sudo make" wheel under the career heading.
// Gallery: drop images in /public/services and list them per service, in the order they should appear.
// Each sweep of the divider shows the next one and it loops back to the first, e.g.
//   gallery: [
//     { src: "/services/websites-1.jpg", caption: "Portfolio site for a client" },
//     { src: "/services/websites-2.jpg", caption: "Landing page" },
//   ],
// Videos work too: give an .mp4 as `src` and a still frame as `poster`; it plays muted on loop while
// it's the visible slide, with play/pause and sound buttons.
// Until a service has images, it shows three placeholder slides.
// ─────────────────────────────────────────────────────────────────────────────
import { ACCENT, ACCENT2, ACCENT3, ACCENT4 } from "./career";

export type GalleryItem = {
  src: string;
  caption: string;
  /** still frame for a video: shown before it loads, while it peeks in, and as the blurred backdrop */
  poster?: string;
  /** seconds into a video to start from, e.g. to skip a fade-in from black */
  start?: number;
};

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
  /** images or videos shown in the swipe-through panel, in order (loops) */
  gallery?: GalleryItem[];
};

export const services: Service[] = [
  {
    slug: "websites",
    name: "Websites",
    category: "Build",
    color: ACCENT,
    description: "Responsive personal and portfolio sites in Next.js and React, with UI that feels finished.",
    pairs: ["ui-ux", "motion"],
    gallery: [
      { src: "/services/websites-claro-hero.webp", caption: "Claro: landing page for a personal expense tracker" },
      { src: "/services/websites-claro-feedback.webp", caption: "Claro: feedback form and footer" },
    ],
  },
  {
    slug: "mobile-apps",
    name: "Mobile apps",
    category: "Build",
    color: ACCENT,
    description: "Cross-platform mobile apps, from a React Native clinical imaging tool to the official app of the Municipality of Indang.",
    pairs: ["ui-ux", "qa"],
    gallery: [
      { src: "/services/mobile-metacampus.webp", caption: "MetaCampus running on a phone emulator, next to its code" },
      { src: "/services/mobile-psometric.webp", caption: "PsoMetric: assessment, lesion analysis and results screens" },
    ],
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
    description: "Flows and interfaces designed in Figma by the same person who builds them. Champion of the AI in UX for FinTech Hackathon.",
    pairs: ["websites", "mobile-apps"],
    gallery: [
      { src: "/services/uiux-dash-car-rentals.webp", caption: "Dash Car Rentals: login, sign-up and booking screens" },
      { src: "/services/uiux-psometric.webp", caption: "PsoMetric: sign-in, assessment and photo guide flows" },
      { src: "/services/uiux-event-app.webp", caption: "Event app: character setup, events and discover" },
      { src: "/services/uiux-competition-site.webp", caption: "Competition site: rulebook, eligibility and more events" },
    ],
  },
  {
    slug: "graphics",
    name: "Graphic design",
    category: "Design",
    color: ACCENT4,
    description: "Posters, flyers and digital ads for events and campaigns, including on-the-spot content during live sessions.",
    pairs: ["motion", "ui-ux"],
    gallery: [
      { src: "/services/graphics-project-coding-2025.webp", caption: "Project Coding 2025 event graphics for the CSSO" },
      { src: "/services/graphics-blockchain-decoders.webp", caption: "Blockchain Decoders speaker poster for the CSSO" },
      { src: "/services/graphics-stix-n-print.webp", caption: "Social ad for Stix 'N Print co." },
    ],
  },
  {
    slug: "motion",
    name: "Video & motion",
    category: "Media",
    color: ACCENT3,
    description: "Promo videos, motion graphics and typography animation in DaVinci Resolve and After Effects.",
    pairs: ["graphics", "websites"],
    gallery: [
      { src: "/services/motion-bcc-teaser.mp4", poster: "/services/motion-bcc-teaser.jpg", caption: "Teaser for the Blockchain Campus Conference" },
    ],
  },
  {
    slug: "iot",
    name: "Embedded & IoT",
    category: "Hardware",
    color: ACCENT2,
    description: "ESP32 and Arduino builds with sensors, alerts and cloud logging: a power factor corrector, an earthquake detector, a misting sanitation system.",
    pairs: ["websites", "qa"],
    gallery: [
      { src: "/services/iot-earthquake-detector.webp", caption: "IoT earthquake detector prototype with its monitoring app" },
      { src: "/services/iot-misting-sanitation.webp", caption: "Misting sanitation system: front and inside views" },
    ],
  },
  {
    slug: "qa",
    name: "QA testing",
    category: "Quality",
    color: ACCENT,
    description: "Testing software, documenting bugs and verifying fixes across the product lifecycle.",
    pairs: ["mobile-apps", "pos-systems"],
    gallery: [
      { src: "/services/qa-illustration.webp", caption: "Illustration: a regression run and a bug report" },
    ],
  },
];
