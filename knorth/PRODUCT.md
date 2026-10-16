# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: tech recruiters and hiring managers evaluating Tiffany Lyssa for a role (job or internship). They arrive from a resume, LinkedIn or GitHub link, scan quickly, and decide whether to reach out.

## Product Purpose

Personal portfolio of Tiffany Lyssa, a Philippines-based software engineer, designer and developer. It exists to get her hired: success is a recruiter downloading the resume or sending a message through the contact form.

## Positioning

One person who covers the whole product:
- **Builds and designs.** Ships web and mobile software, and also designs it (Figma, Illustrator, motion graphics, video editing).
- **Hardware and software.** Embedded/IoT work (ESP32, Arduino: power factor corrector, earthquake detector, misting sanitation system) alongside Next.js/React, Node, Python and Spring Boot.
- **Shows up and leads.** Community roles in AWS User Group BuildHers+, AWS Cloud Club: Spade, Arduino Philippines, Quantum Computing Society of the Philippines; AI in UX Hackathon champion.

## Operating Context

- Entry is a full-screen intro (`/`) with a grabbable character face; pulling and releasing it wipes into the main page (`/home`).
- `/home` is one long page: hero, About, Projects (circular gallery), Career (tech stack, experience scroll story, leadership/volunteering, certifications), Contact.
- Navbar anchors: Home, About, Projects, Experience, Contact Me, plus a Resume button.
- Career content is edited in `data/career.ts`.

## Capabilities and Constraints

- Next.js 16 (App Router), React 19, Tailwind v4, Framer Motion, react-three-fiber (intro character), OGL (project gallery), react-icons.
- Dark site; the intro and character interactions are a signature and stay.
- Freelance company names and some certification dates in `data/career.ts` are placeholders until replaced.

## Brand Commitments

- Name: Tiffany Lyssa; nav wordmark "TIFFANY"; handle "knorth" / "kno_orth".
- Voice: playful, self-aware, casual. Jokey copy ("I reply faster than your group chat", "cat sat on enter key"), hand-drawn doodle text, stickers, and the interactive character are part of her personality and must be kept, not sanded down.
- Links: LinkedIn `linkedin.com/in/tiffany-lyssa-4b210b281`, GitHub `github.com/knorthy`, X `x.com/kno_orth`, Facebook `facebook.com/lystffny`.

## Evidence on Hand

Confirmed real by the owner:
- Resume PDF exists (not yet in the repo; the Resume button should link to it).
- Project details for the gallery projects (Juno, MetaCampus, Claro and others) exist and can be provided; the site currently shows some placeholder images.
- Certification credential links exist for the Cisco, DataCamp and hackathon entries (not yet added to `data/career.ts`).
- The contact form delivers messages.
- Experience, leadership and volunteer history in `data/career.ts` is real.

Do not invent: project metrics, client names, testimonials, or employers beyond what is listed.

## Product Principles

1. **Hireability first.** Every section should help a recruiter answer "can she do the job?" quickly; the resume and contact are always one step away.
2. **Show range, prove it.** The dev + design + hardware mix is the differentiator; back each claim with real work, links or credentials rather than adjectives.
3. **Personality is a feature.** Playfulness signals craft and culture fit; keep it, but never let it block scanning or contact.
4. **Real over filler.** Replace placeholders with real assets as they arrive; never ship fabricated proof.
