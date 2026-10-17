"use client";
// Kniah's brain: watches what the visitor is doing and decides what she says and how she moves.
// - Every section has first-visit lines and different lines for coming back
// - Interactions get their own lines: keys, nav, logo, resume, socials, gallery, wheel, slider,
//   certificates, the contact form, selecting/copying, double-click, typing, leaving, resizing…
// - Scrolling fast nonstop: she spins until the visitor slows down, getting dizzier the longer it goes
// - No activity for a while: sings, then falls asleep; any activity wakes her with a startled flip
// A cooldown and per-interaction throttles keep her from chattering. Everything stops while
// `paused` (chat open or Kniah hovered).
import { useEffect, useRef, useState } from "react";
import type { KnoMood } from "./KnoCat";

// ── Timing ───────────────────────────────────────────────────────────────────
const COOLDOWN_MS = 6000; // between any two unforced remarks
const THROTTLE_MS = 20000; // default gap before the same interaction comments again
const LINE_MS = 4200;
const IDLE_SING_MS = 15000;
const IDLE_SLEEP_MS = 40000;
const REVISIT_MS = 30000; // a section has to be away this long before a "back again" line
const DIZZY_START = 2400; // px/s to start spinning
const DIZZY_KEEP = 1200; // px/s that keeps her spinning once she's going
const DIZZY_SETTLE_MS = 650; // spinning stops this long after fast scrolling ends
const GREETED_KEY = "kniah-greeted";

type Reaction = { mood: KnoMood; ms: number };
const FLIP: Reaction = { mood: "flip", ms: 820 };
const SIT: Reaction = { mood: "sit", ms: 3200 };
const THINK: Reaction = { mood: "think", ms: 2800 };
const SING: Reaction = { mood: "sing", ms: 2600 };
const SPIN: Reaction = { mood: "spin", ms: 1350 };

// ── What she says ────────────────────────────────────────────────────────────
const SECTIONS: Record<string, { first: string[]; again: string[]; react?: Reaction }> = {
  about: {
    first: ["meet Tiffany: engineer, designer, developer", "she really does judge books by their covers"],
    again: ["still reading about her? good taste", "yep, still Tiffany. still great"],
  },
  projects: {
    first: ["ooh, the good stuff. drag to browse", "these are the things that actually run"],
    again: ["back for another look? they're worth it", "pick one, I'll wait"],
    react: THINK,
  },
  services: {
    first: ["scroll to spin the wheel, drag the line for more", "this is everything she can make for you"],
    again: ["changed your mind? pick another one", "the wheel missed you"],
    react: THINK,
  },
  stack: {
    first: ["press a key, it clicks!", "so many keys, so little time"],
    again: ["click clack, back again", "the keyboard remembers you"],
    react: SING,
  },
  work: {
    first: ["this is where she's put it all to work", "real jobs, real bugs squashed"],
    again: ["the experience part, take two", "re-reading? she'd be flattered"],
  },
  "side-quests": {
    first: ["keep scrolling, it goes sideways!", "her side quests! orgs and volunteering"],
    again: ["sideways again? wheee", "more lanyards, more fun"],
    react: SPIN,
  },
  certifications: {
    first: ["those papers? all hers", "the paper trail! very official"],
    again: ["still admiring the paper trail?", "they're still stamped, I checked"],
    react: SIT,
  },
  contact: {
    first: ["say hi! she replies faster than your group chat", "this is the part where you say hi"],
    again: ["the form misses you", "still thinking? it's just one message"],
    react: FLIP,
  },
};

const LINES = {
  greeting: ["hi! I'm Kniah. click me if you've got questions about Tiffany"],
  backToTop: ["back to the top! hi again", "the cover page, once more", "full circle! wanna start over?"],
  keycap: ["click clack!", "that one's my favorite key", "tap tap tap", "ooh, satisfying"],
  nav: ["going somewhere?", "shortcut! nice", "I'll come with you"],
  logo: ["that's her name, in pixels like me", "cute logo, right? I helped. not really"],
  resume: ["psst, she's hireable", "the resume! good choice", "go on, click it"],
  linkedin: ["LinkedIn: very professional over there", "go connect, she won't bite"],
  github: ["go peek at her code", "GitHub! where the magic lives"],
  social: ["she's on there too", "more Tiffany, elsewhere"],
  gallery: ["wheee, spin it!", "careful, don't get dizzy", "round and round"],
  wheelPick: ["good pick!", "ooh, that one's fun", "excellent taste"],
  slider: ["next picture coming up", "swipe swipe", "there's more where that came from"],
  certDrag: ["careful, those are official!", "tidy desk, tidy mind", "rearranging? I love it"],
  typing: ["ooh, writing to Tiffany? I won't peek", "type type type… I'm so curious"],
  submit: ["message sent! she's gonna love it", "sent! go touch some grass while she replies"],
  copy: ["taking notes? I like you already", "copy that!"],
  select: ["highlighting? so studious", "ooh, important part?"],
  dblclick: ["hey, that tickles!", "double click, double fun"],
  keypress: ["typing to me? click me instead!", "I can't read that, but I'm flattered"],
  leaveWindow: ["leaving already?", "wait, come back!"],
  resize: ["whoa, the world just changed size", "stretchy!"],
  tabReturn: ["welcome back!", "you're back! I saved your spot"],
  afterChat: ["that was fun! ask me again anytime", "come back if you think of more questions"],
  sing: ["♪ la la laa ♪", "♪ humming while you think ♪", "♪ do re mi meow ♪"],
  sleep: ["zzz…", "five more minutes…"],
  wake: ["huh?! oh, hi again", "I wasn't sleeping. I was resting my eyes"],
  dizzyStart: ["whoa, slow down!", "wheeeee!"],
  dizzyMore: ["I'm getting dizzy…", "the room is spinning!"],
  dizzyLong: ["are we there yet?!", "@_@ make it stop"],
  dizzyStop: ["okay… the floor is back", "phew. everything's still spinning a little"],
} satisfies Record<string, string[]>;

export function useKnoBrain(paused: boolean, chatSessions = 0): { mood: KnoMood; line: string | null } {
  const [mood, setMood] = useState<KnoMood>("idle");
  const [line, setLine] = useState<string | null>(null);
  // Remembered across pauses: what's been said, and when each section was last remarked on
  const memory = useRef({
    said: new Set<string>(),
    sectionAt: new Map<string, number>(),
    lastPick: new Map<string, string>(),
    seenSessions: 0,
  });

  useEffect(() => {
    if (paused) return;
    const mem = memory.current;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
      timers.add(t);
      return t;
    };
    const cancel = (t?: ReturnType<typeof setTimeout>) => { if (t) { clearTimeout(t); timers.delete(t); } };

    // Pick a line, avoiding the one used last time from the same pool
    const fresh = (key: string, pool: string[]) => {
      const options = pool.length > 1 ? pool.filter((l) => l !== mem.lastPick.get(key)) : pool;
      const choice = options[Math.floor(Math.random() * options.length)];
      mem.lastPick.set(key, choice);
      return choice;
    };

    let state: "awake" | "singing" | "sleeping" = "awake";
    let dizzy = false;
    let lastSpoke = 0;
    let lineT: ReturnType<typeof setTimeout> | undefined;
    let moodT: ReturnType<typeof setTimeout> | undefined;
    const restingMood = (): KnoMood => (dizzy ? "dizzy" : state === "sleeping" ? "sleep" : state === "singing" ? "sing" : "idle");

    const showLine = (text: string, ms = LINE_MS) => {
      cancel(lineT);
      setLine(text);
      lineT = later(() => setLine(null), ms);
    };
    const react = ({ mood: m, ms }: Reaction) => {
      if (dizzy) return; // nothing interrupts a good spin
      cancel(moodT);
      setMood(m);
      moodT = later(() => setMood(restingMood()), ms);
    };
    const say = (text: string, opts: { react?: Reaction; force?: boolean; ms?: number } = {}) => {
      const now = Date.now();
      if (!opts.force && now - lastSpoke < COOLDOWN_MS) return false;
      lastSpoke = now;
      showLine(text, opts.ms);
      if (opts.react) react(opts.react);
      return true;
    };
    // Throttled remark for a named interaction
    const lastByKey = new Map<string, number>();
    const comment = (key: keyof typeof LINES, opts: { react?: Reaction; force?: boolean; every?: number } = {}) => {
      const now = Date.now();
      if (now - (lastByKey.get(key) ?? 0) < (opts.every ?? THROTTLE_MS)) return false;
      if (!say(fresh(key, LINES[key]), opts)) return false;
      lastByKey.set(key, now);
      return true;
    };

    // ── Idle: sing, then sleep ──
    let singT: ReturnType<typeof setTimeout> | undefined;
    let sleepT: ReturnType<typeof setTimeout> | undefined;
    const armIdle = () => {
      cancel(singT);
      cancel(sleepT);
      singT = later(() => {
        if (document.hidden || dizzy) return;
        state = "singing";
        cancel(moodT);
        setMood("sing");
        showLine(fresh("sing", LINES.sing), 5000);
      }, IDLE_SING_MS);
      sleepT = later(() => {
        if (document.hidden || dizzy) return;
        state = "sleeping";
        cancel(moodT);
        setMood("sleep");
        showLine(fresh("sleep", LINES.sleep), 3200);
      }, IDLE_SLEEP_MS);
    };
    let lastActivity = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 300) return;
      lastActivity = now;
      if (state === "sleeping") {
        state = "awake";
        say(fresh("wake", LINES.wake), { react: FLIP, force: true });
      } else if (state === "singing") {
        state = "awake";
        cancel(moodT);
        setMood(restingMood());
      }
      armIdle();
    };

    // ── Dizzy: spin for as long as the fast scrolling lasts ──
    let settleT: ReturnType<typeof setTimeout> | undefined;
    let moreT: ReturnType<typeof setTimeout> | undefined;
    let longT: ReturnType<typeof setTimeout> | undefined;
    const startDizzy = () => {
      dizzy = true;
      state = "awake";
      cancel(moodT);
      setMood("dizzy");
      say(fresh("dizzyStart", LINES.dizzyStart), { force: true, ms: 2400 });
      moreT = later(() => dizzy && say(fresh("dizzyMore", LINES.dizzyMore), { force: true, ms: 3000 }), 2500);
      longT = later(() => dizzy && say(fresh("dizzyLong", LINES.dizzyLong), { force: true, ms: 3200 }), 6000);
    };
    const stopDizzy = () => {
      dizzy = false;
      cancel(moreT);
      cancel(longT);
      setMood("idle");
      say(fresh("dizzyStop", LINES.dizzyStop), { force: true, react: SIT });
    };

    let lastY = window.scrollY;
    let lastT = performance.now();
    let fastUntil = 0; // section remarks wait while sections are just flying past
    let wasDeep = window.scrollY > 1500;
    const onScroll = () => {
      onActivity();
      const now = performance.now();
      const dt = now - lastT;
      if (dt < 50) return;
      const speed = (Math.abs(window.scrollY - lastY) / dt) * 1000;
      lastY = window.scrollY;
      lastT = now;
      if (speed > DIZZY_KEEP) fastUntil = Date.now() + 1200;
      // Back at the top after exploring
      if (window.scrollY > 1500) wasDeep = true;
      else if (wasDeep && window.scrollY < 120 && !dizzy) { wasDeep = false; comment("backToTop", { react: FLIP, every: 30000 }); }
      if (!dizzy && speed > DIZZY_START) startDizzy();
      if (dizzy && speed > DIZZY_KEEP) {
        cancel(settleT);
        settleT = later(stopDizzy, DIZZY_SETTLE_MS);
      }
    };

    // ── Sections: first-visit lines, then different ones when coming back ──
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          const section = SECTIONS[id];
          if (!entry.isIntersecting || !section || dizzy || Date.now() < fastUntil) continue;
          const last = mem.sectionAt.get(id);
          const pool = last === undefined ? section.first : section.again;
          if (!pool.length || (last !== undefined && Date.now() - last < REVISIT_MS)) {
            if (last === undefined) mem.sectionAt.set(id, Date.now());
            continue;
          }
          if (say(fresh(`section-${id}`, pool), { react: section.react })) mem.sectionAt.set(id, Date.now());
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    Object.keys(SECTIONS).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // ── Hovering things ──
    const onPointerOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest) return;
      if (el.closest(".keycap")) { comment("keycap", { react: SING, every: 15000 }); return; }
      const link = el.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (link.closest("nav")) {
        if (link.querySelector(".pixel-logo")) comment("logo", { react: FLIP, every: 30000 });
        else if (/resume|hire/i.test(link.textContent ?? "")) comment("resume", { react: SIT, every: 25000 });
        else if (href.startsWith("#")) comment("nav", { every: 25000 });
        return;
      }
      if (href.includes("linkedin.com")) comment("linkedin", { every: 30000 });
      else if (href.includes("github.com")) comment("github", { every: 30000 });
      else if (/x\.com|facebook\.com|instagram\.com|figma/.test(href)) comment("social", { every: 30000 });
    };

    // ── Grabbing things ──
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest) return;
      if (el.closest("#projects canvas")) comment("gallery", { react: SPIN });
      else if (el.closest("#services figure")) comment("slider", { every: 15000 });
      else if (el.closest("#certifications li")) comment("certDrag", { react: SIT });
    };
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("#services [aria-label='Services'] button, #services p button")) comment("wheelPick", { react: FLIP, every: 15000 });
    };

    // ── The contact form ──
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("#contact") && el.matches("input, textarea")) comment("typing", { react: THINK, force: true, every: 60000 });
    };
    const onSent = () => comment("submit", { react: FLIP, force: true, every: 5000 }); // only after a confirmed send

    // ── Reading, copying, poking ──
    let selT: ReturnType<typeof setTimeout> | undefined;
    const onSelection = () => {
      cancel(selT);
      selT = later(() => {
        const text = document.getSelection()?.toString() ?? "";
        if (text.trim().length > 30) comment("select", { every: 45000 });
      }, 600);
    };
    const onCopy = () => comment("copy", { react: SIT, force: true, every: 30000 });
    const onDblClick = () => comment("dblclick", { react: FLIP, every: 30000 });
    const onKeyDown = (e: KeyboardEvent) => {
      onActivity();
      const el = e.target as HTMLElement | null;
      if (el?.matches?.("input, textarea, [contenteditable='true']") || e.metaKey || e.ctrlKey || e.key.length !== 1) return;
      comment("keypress", { every: 60000 });
    };

    // ── Leaving, resizing, coming back ──
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) comment("leaveWindow", { react: THINK, every: 60000 });
    };
    let resizeT: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      cancel(resizeT);
      resizeT = later(() => comment("resize", { react: SPIN, every: 60000 }), 400);
    };
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      if (hiddenAt && Date.now() - hiddenAt > 8000) {
        state = "awake";
        comment("tabReturn", { react: FLIP, force: true, every: 15000 });
      }
      armIdle();
    };

    // ── Hello once per visit, or a word after the chat closes ──
    if (chatSessions > mem.seenSessions) {
      mem.seenSessions = chatSessions;
      later(() => comment("afterChat", { react: SIT, force: true, every: 0 }), 500);
    } else {
      let greeted = mem.said.has("hello");
      try { greeted ||= sessionStorage.getItem(GREETED_KEY) === "1"; } catch { /* storage blocked */ }
      if (!greeted) {
        later(() => {
          mem.said.add("hello");
          try { sessionStorage.setItem(GREETED_KEY, "1"); } catch { /* storage blocked */ }
          say(LINES.greeting[0], { force: true, ms: 6000 });
        }, 4000);
      }
    }

    const opts = { passive: true } as const;
    window.addEventListener("pointermove", onActivity, opts);
    window.addEventListener("touchstart", onActivity, opts);
    window.addEventListener("scroll", onScroll, opts);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerover", onPointerOver, opts);
    document.addEventListener("pointerdown", onPointerDown, opts);
    document.addEventListener("click", onClick);
    document.addEventListener("focusin", onFocusIn);
    window.addEventListener("kniah:contact-sent", onSent);
    document.addEventListener("selectionchange", onSelection);
    document.addEventListener("copy", onCopy);
    document.addEventListener("dblclick", onDblClick);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", onVisibility);
    armIdle();

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("click", onClick);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("kniah:contact-sent", onSent);
      document.removeEventListener("selectionchange", onSelection);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("dblclick", onDblClick);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", onVisibility);
      setLine(null);
      setMood("idle");
    };
  }, [paused, chatSessions]);

  return { mood, line };
}
