---
target: career part of /home
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 6
target_identity: "file:C:\\Users\\ricoe\\SOFTENG\\knorth\\knorth\\app\\home\\page.tsx"
target_fingerprint: "sha256:8c7808ca480b654d7fd21c4976d4d6b6d743d6305c830866583180a370a3befe"
target_path: "C:\\Users\\ricoe\\SOFTENG\\knorth\\knorth\\app\\home\\page.tsx"
timestamp: 2026-11-16T01-16-36Z
slug: app-home-page-tsx
---
Method: dual-agent (A: design review + taste-skill second opinion · B: detector + Playwright evidence at 1440 and 390). Focus: career part of /home (services wheel, keyboard, experience, side quests, certificates).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good counters; job panel goes stale after a jump scroll |
| 2 | Match System / Real World | 3 | Lanyards, desk, keycaps read instantly; compare slider used as carousel |
| 3 | User Control and Freedom | 2 | Mostly pinned; one skip, landing in another pinned section |
| 4 | Consistency and Standards | 2 | Heading scale inverted; "Experience" vs "Career" in nav |
| 5 | Error Prevention | 3 | Resize can pile the certificates |
| 6 | Recognition Rather Than Recall | 2 | One service/job at a time; phone hides ~11 of 33 skills |
| 7 | Flexibility and Efficiency | n/a | portfolio |
| 8 | Aesthetic and Minimalist Design | 3 | Placeholder tiles; empty lower 45% of services at 1440x900 |
| 9 | Error Recovery | 2 | No reset for a piled/dragged desk |
| 10 | Help and Documentation | n/a | portfolio |
| **Total** | | **20/32** | **Acceptable (62%)** |

## Design Specificity Verdict
Authored: lanyards, stamped paper desk, `sudo make <service>`. Generic seam: experience story = five numbered gradient tiles around thin content. Four scroll-driven set pieces back to back = 16.1 desktop screens (14,496px), 11 on phone.
Detector: CLI 0 findings (components/career, components, app). In-page 32-38 findings, mostly #projects case files (border-accent-on-rounded x6, tiny/undersized text) or style heuristics conflicting with the brief (ai-color-palette, overused-font, codex-grid-background). Career-relevant: low-contrast and small text. Headless, no user-visible overlay.
Console: 0 errors, 0 failed requests, no horizontal overflow. One warning per load: scroll container has non-static position missing.

## Section lengths (viewport-heights)
1440x900: services 4.20, stack 0.83, work+quests 6.47 (quests 2.45), certifications 4.50. 390x844: services 2.92, stack 0.87, work+quests 4.08, certifications 3.04.

## Priority Issues
- [P1] Career costs 16 desktop screens, one skip. Fix: halve pin lengths (~20vh/service, ~25vh/cert), jump row under career heading, skip on every pinned part. ServicesWheel.tsx:500, CertificationsGrid.tsx:222, ExperienceTimeline.tsx:228. (/impeccable distill, /impeccable layout)
- [P1] Placeholders as content: POS systems "your image 1 of 3" (ServicesWheel.tsx:165-212, data/services.ts:63-70); five job number tiles (ExperienceTimeline.tsx:84-97). Fix: hide gallery when empty; real images or drop tile column. (/impeccable harden)
- [P1] Phone keyboard hides ~11 of 33 skills (JavaScript, TypeScript, CSS, Node.js, Firebase, Supabase, Spring Boot, Illustrator, After Effects, DaVinci Resolve, Picsart); rows move only with page scroll (SkillsSection.tsx:42-43). Fix: StaticBoard on phones. Approximate (60px stepped scroll). (/impeccable adapt)
- [P1] Resume and nav hide on scroll down (Navbar.tsx:76-83); mobile dock has no Resume. Fix: persistent Resume pill or dock item. (/impeccable adapt)
- [P1] Desktop renders only the active job (ExperienceTimeline.tsx:211-252); only 5 tab stops in #experience; desktop h4 textContent "EngineeringSandboxTrainee". Fix: hidden full list, spaces between words. (/impeccable harden)
- [P1] Experience content thin and badly ordered: three one-bullet whiteStrings internships = 3 of 5 stops; Freelance Developer fourth (data/career.ts:117-150). Fix: merge into one stop with dated role lines. (/impeccable clarify)
- [P2] Reduced motion: job tiles frozen at scale(0.82) rotate(±6deg), clipped; quests row overflow 2264 in 1104 with no keyboard scroll and false "keep scrolling" hint (ExperienceTimeline.tsx:466-476, :403); services and work still pinned. (/impeccable harden)
- [P2] Certificates overlap on phones: titles cut, "Champion" hidden, issuer 9px, dock covers lower desk. (/impeccable adapt)
- [P2] Certificates: no dates, no credential links (data/career.ts:211-217; slot at CertificationsGrid.tsx:89); Champion dealt fifth then covered. (/impeccable clarify)
- [P2] Services panel lower 45% empty at 1440x900 for the whole pin; gallery ~380x260 (ServicesWheel.tsx:501). (/impeccable layout)
- [P2] Heading hierarchy inverted: "$ sudo make career" and "Put to work" 24px vs 48px siblings (ExperienceTimeline.tsx:205-210). (/impeccable typeset)
- [P2] Kniah covers content: job counter, lanyard title, TESDA stamp, mobile contact textarea placeholder, footer Contact link centre. (/impeccable layout)
- [P2] Resize piles all six certificates (seen once; cause inferred: dragConstraints re-resolving, CertificationsGrid.tsx:136-140). (/impeccable harden)
- [P2] Contrast and small text: "$" and "·" 2.46:1 (text-foreground/30), /ui-ux chip ~3.5:1; 11px hints and badge labels, 10px dock labels. (/impeccable polish)
- [P3] Job panel stale after instant jump (ExperienceTimeline.tsx:159-176); ~960px mostly blank between story release (y~10565) and quests pin (11529). (/impeccable polish)
- [P3] Small targets: "Skip to side quests" 110x16; phone service tabs 32px tall. (/impeccable adapt)
- [P3] Desk empty at 0/6 for first screen of its pin. (/impeccable polish)
- [P3] "Hover a key, it clicks" overpromises; "What you can hire me for" reads as a rate card. (/impeccable clarify)

## Persona Red Flags
Recruiter (90s): no one-screen summary of roles and dates; three stops on internships; Resume hidden while scrolling; "your image" slide; no credential links; Contact after 4.5 screens of certificates.
Casey: keyboard rows not swipeable; certificate titles occluded; gallery handle at far right edge; no skip on mobile.
Sam: four of five jobs absent from DOM on desktop; 5 tab stops in career; reduced-motion quests row not keyboard scrollable; certificates not focusable. Focus ring visible where focus lands.

## Minor Observations
Kniah's "keep scrolling" tip is false under reduced motion. Paper trail heading slides under the wordmark on phones as the pin releases. Certificate cards overlap at rest (card 2 covers card 1's stamp; TESDA clips the Champion ribbon). APFC appears four times across the page. data/career.ts header comment still refers to /experience. Six picsum.photos placeholder photos in the projects gallery. Contact inputs report no outline on focus (border change not checked).

## Taste-skill second opinion
Accepted: no placeholder labels; one or two set pieces per page; visuals fill their ground; scroll movement must not hide content; no fact twice. Rejected (PRODUCT.md wins): plain copy, no tilt, no violet, stock stand-in photos, no captions under images.

## Questions to Consider
1. If a recruiter saw only one screen of the career part, which should it be, and why is it not the first?
2. Do three internships at one company deserve three stops, or is the template dictating the content?
3. Does a services menu belong ahead of work history on a site meant to get hired into a role?

Not checked: real touch, real screen reader, 768 and 1024 widths, Tab run at 390.
