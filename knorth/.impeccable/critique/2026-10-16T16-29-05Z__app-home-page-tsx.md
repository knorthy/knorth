---
target: the whole website
total_score: 14
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 3
target_identity: "file:C:\\Users\\ricoe\\SOFTENG\\knorth\\knorth\\app\\home\\page.tsx"
target_fingerprint: "sha256:8c7808ca480b654d7fd21c4976d4d6b6d743d6305c830866583180a370a3befe"
target_path: "C:\\Users\\ricoe\\SOFTENG\\knorth\\knorth\\app\\home\\page.tsx"
timestamp: 2026-10-16T16-29-05Z
slug: app-home-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Counters good; nav active state sticks on "Contact Me" (#home is the <main> wrapping every section) |
| 2 | Match System / Real World | 3 | Dev metaphors fit; hero line never says the role; "Hover a key" shown on touch |
| 3 | User Control and Freedom | 1 | Intro "/" is drag-only, no skip/keyboard path; logo returns to the gate |
| 4 | Consistency and Standards | 2 | Resume relabels to "Hire Me" on hover; footer nav drops Contact/Resume |
| 5 | Error Prevention | 1 | Contact form never sends (handleSubmit only console.logs, Contact.tsx:248) |
| 6 | Recognition Rather Than Recall | 2 | 6 unnamed hero social icons; projects only inside a WebGL canvas |
| 7 | Flexibility and Efficiency | n/a | portfolio |
| 8 | Aesthetic and Minimalist Design | 2 | blobs + grid + dots + stickers + looping doodles + typewriter + cat at once |
| 9 | Error Recovery | 1 | fake "HTTP 200: OK" success for a message that went nowhere |
| 10 | Help and Documentation | n/a | portfolio |
| **Total** | | **14/32** | **Poor (44%)** |

## Design Specificity Verdict
Authored: face intro, pixel wordmark, keycaps, lanyards, cert desk, Kniah, dev-joke voice. Generic seams: blobs/grid/ghost text in hero, about, contact; same 7 stickers everywhere. Proof is placeholder: stock gallery photos, "your image 1 of 3", numbered experience tiles.
Detector: CLI 0 findings; in-browser 15 undersized-ui-text (10px pills, BASE IN PH), up to 18 low-contrast (contact placeholders 2.5:1, footer 3.5:1, chat footnote 3.5:1, cert issuer ink ~2.4:1, Skip to side quests 4.1:1, faded wheel items to 1.5:1), skipped-heading h1→h3, heading-rhythm on side-quest h4s, ai-color-palette/overused-font (intentional per brief). No user-visible overlay (headless).

## Priority Issues
- [P0] Contact form fake + claims success; email placeholder. Fix: real route handler + email provider, sending/sent/failed states, real CONTACT_EMAIL; hide form until wired. (/impeccable harden, /impeccable clarify)
- [P0] No resume; Resume href="#" (Navbar.tsx:91) and relabels "Hire Me". Fix: PDF in /public with download, stable label, repeat as hero + contact CTA. (/impeccable clarify, /impeccable polish)
- [P1] Mobile nav broken at 390px: pill covers logo, Resume covers Experience + Contact Me. Fix: logo + Resume + menu below md. (/impeccable adapt)
- [P1] Intro gate drag-only: no skip, no heading, alt "Loading...", 423px-wide at 390, 404 /hero/strand.png, mobile text overlaps face. Fix: focusable "Skip intro", reduced-motion path, stacked mobile layout with drag hint. (/impeccable adapt, /impeccable harden)
- [P1] Projects carry no proof: canvas-only stock images, no descriptions/links, "Inspect the build" pill opens nothing. Fix: real project cards/panel with problem, role, stack, link, real screenshots. (/impeccable distill, /impeccable polish)

## Persona Red Flags
Recruiter (90s): gate → roleless hero → dead Resume → unopenable projects → 6-viewport experience with no summary → message lost.
Jordan: drag not explained; role only in typewriter; Instagram/Figma "#"; Hire Me swap.
Casey: intro clipped/overlapping, 423px wide; nav hidden under Resume; sun sticker over tagline; hover copy on touch; long pinned sections; side-quest cards cut.
Sam: intro keyboard trap; unnamed social links; placeholder-only contact labels 2.5:1 with focus outline removed; checkbox no focus state; 10px 50%-opacity text; hero loops ignore reduced motion; reduced-motion hydration error reported in SkillsSection.

## Minor Observations
About photo file is /jennie.jpg (profile.jpg unused): confirm it's Tiffany. "BASE IN PH" → "Based in PH". Services wheel/detail lag during fast scroll (AnimatePresence wait). Duplicate AWS Spade badge. Kniah bubble overlaps experience counter. Footer missing Contact/Resume; empty gap above Reach out. Cert dates placeholder, no credential links. Desktop hero bottom third empty.

## Questions to Consider
1. Should resume-link visitors pass a toy first, or should the face live in the /home hero?
2. Why do the best-designed objects hold the least important evidence while projects sit in a stock-photo canvas?
3. Does the cover say "software engineer who designs and builds hardware", or "sticker collection"?
