// Site-wide facts that live in one place. Fill these in and every button that uses them updates.

/** Put the PDF at public/Tiffany-Lyssa-Resume.pdf (or change this path). */
export const RESUME_URL = "/Tiffany-Lyssa-Resume.pdf";

/**
 * Public email shown on the site. Set NEXT_PUBLIC_CONTACT_EMAIL in .env.local; until then the email
 * link stays hidden instead of showing a fake address.
 */
export const CONTACT_EMAIL: string | null = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

export const SOCIALS = {
  linkedin: { label: "LinkedIn", handle: "tiffany-lyssa", href: "https://www.linkedin.com/in/tiffany-lyssa-4b210b281/" },
  github: { label: "GitHub", handle: "knorthy", href: "https://github.com/knorthy" },
  x: { label: "X", handle: "kno_orth", href: "https://x.com/kno_orth" },
  facebook: { label: "Facebook", handle: "lystffny", href: "https://www.facebook.com/lystffny/" },
} as const;
