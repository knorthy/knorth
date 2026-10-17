"use client";
// Kniah's first reply: before answering, she shows what the visitor's browser handed this site the moment
// it loaded (see lib/exposure.ts). Rows decode one after another like a readout, ending on the fingerprint
// those traits add up to, then a few tips. It plays once; reopening the chat shows it settled.
import { useEffect, useRef, useState } from "react";
import { collectExposure, type Exposure } from "@/lib/exposure";
import { useReducedMotion } from "@/components/useReducedMotionSafe";

const ROW_STEP = 110; // ms between rows
const DECODE_MS = 420;
const GLYPHS = "abcdef0123456789#%&*+/<>=";

// Keep each line in view as it lands, so the reader follows the readout down the chat
const follow = (e: React.AnimationEvent<HTMLElement>) =>
  e.currentTarget.scrollIntoView({ block: "nearest", behavior: "smooth" });

function Decode({ text, delay, play }: { text: string; delay: number; play: boolean }) {
  const [shown, setShown] = useState(play ? "" : text);
  useEffect(() => {
    if (!play) return;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      start ||= t;
      const p = (t - start - delay) / DECODE_MS;
      if (p < 0) { raf = requestAnimationFrame(tick); return; }
      if (p >= 1) { setShown(text); return; }
      const fixed = Math.floor(text.length * p);
      let out = text.slice(0, fixed);
      for (let i = fixed; i < text.length; i++) out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      setShown(out);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, play]);
  return <>{shown}</>;
}

export default function ExposureCard({ play, onRevealed }: {
  /** animate the reveal (first time only) */
  play: boolean;
  /** fires once every row has landed */
  onRevealed?: () => void;
}) {
  const reduce = useReducedMotion();
  const animate = play && !reduce;
  const [data, setData] = useState<Exposure | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const revealedRef = useRef(onRevealed);
  useEffect(() => { revealedRef.current = onRevealed; }, [onRevealed]);

  useEffect(() => {
    let alive = true;
    const t0 = performance.now();
    collectExposure().then((d) => {
      if (!alive) return;
      setData(d);
      setMs(Math.max(1, Math.round(performance.now() - t0)));
    });
    return () => { alive = false; };
  }, []);

  const rowCount = data?.groups.reduce((n, g) => n + g.rows.length, 0) ?? 0;
  const total = animate ? rowCount * ROW_STEP + DECODE_MS + 500 : 0;

  useEffect(() => {
    if (!data || !play) return;
    const t = setTimeout(() => revealedRef.current?.(), total);
    return () => clearTimeout(t);
  }, [data, play, total]);

  let index = 0;
  return (
    <div className="space-y-3">
      <p className="kno-msg kno-msg-bot">
        Before I answer: here&apos;s what your browser told my site the second you opened it. You didn&apos;t
        click or agree to anything.
      </p>

      <section className="kno-exposure" aria-label="What your browser shared with this site">
        <header className="flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2">
          <h3 className="text-[13px] font-bold text-[#ffc2dd]">Your browser, unprompted</h3>
          {ms !== null && <span className="font-mono text-[11px] text-foreground/55">read in {ms} ms</span>}
        </header>

        {!data ? (
          <p className="px-4 pb-4 text-xs text-foreground/60">Reading what your browser sent…</p>
        ) : (
          <>
            {data.groups.map((g) => (
              <div key={g.title} className="px-4 pb-2.5">
                <h4 className="text-[11px] font-semibold text-foreground/55 pb-1 pt-1.5 border-t border-white/[0.06]">{g.title}</h4>
                <dl className="space-y-1">
                  {g.rows.map((r) => {
                    const delay = index++ * ROW_STEP;
                    return (
                      <div
                        key={r.label}
                        className={`kno-exposure-row ${animate ? "kno-exposure-in" : ""}`}
                        style={animate ? { animationDelay: `${delay}ms` } : undefined}
                        onAnimationStart={animate ? follow : undefined}
                      >
                        <dt className="text-[11px] text-foreground/55 pt-px">{r.label}</dt>
                        <dd className="min-w-0">
                          <span className="sr-only">{r.value}</span>
                          <span aria-hidden className="font-mono text-xs text-foreground/90 break-words">
                            <Decode text={r.value} delay={delay} play={animate} />
                          </span>
                          {r.note && <span className="block text-[11px] text-foreground/50 leading-snug">{r.note}</span>}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}

            {data.fingerprint && (
              <div
                className={`kno-exposure-print mx-2 mb-2 px-3 py-3 rounded-lg ${animate ? "kno-exposure-in" : ""}`}
                style={animate ? { animationDelay: `${rowCount * ROW_STEP + 150}ms` } : undefined}
                onAnimationStart={animate ? follow : undefined}
              >
                <p className="text-[11px] font-semibold text-[#ffc2dd]">Your fingerprint</p>
                <p className="font-mono text-lg font-bold tracking-wider text-[#ff7eb9] leading-tight">
                  <span className="sr-only">{data.fingerprint}</span>
                  <span aria-hidden>
                    <Decode text={data.fingerprint.match(/.{1,4}/g)!.join(" ")} delay={rowCount * ROW_STEP + 150} play={animate} />
                  </span>
                </p>
                <p className="mt-1 text-[11px] leading-snug text-foreground/65">
                  Together these traits are rare enough to pick you out from one site to the next. No cookies or
                  login needed.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {data && (
        <p
          className={`kno-msg kno-msg-bot ${animate ? "kno-exposure-in" : ""}`}
          style={animate ? { animationDelay: `${total - 250}ms` } : undefined}
          onAnimationStart={animate ? follow : undefined}
        >
          Every site you open gets this list, sketchy ones included, so be choosy about what you click. A VPN
          hides your IP; Brave, Firefox in strict mode or Tor blur most of the rest. I don&apos;t keep any of it.
          Now, your question:
        </p>
      )}
    </div>
  );
}
