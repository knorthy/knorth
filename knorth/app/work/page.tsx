// /work: every system in full, plus articles and research once data/writing.ts has entries.
// The case files on /home are the teaser; this is the open folder. Content comes from data/projects.ts.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileDown } from "lucide-react";
import GalaxyDots from "@/components/GalaxyDots";
import PixelLogo from "@/components/PixelLogo";
import { projects } from "@/data/projects";
import { articles, research, type Writing } from "@/data/writing";
import { RESUME_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Work · Tiffany Lyssa",
  description: "Every system Tiffany Lyssa has built: what each one does, her role in it and what it was built with.",
};

const pad = (n: number) => String(n).padStart(2, "0");
const LINK = "underline underline-offset-4 decoration-1 decoration-foreground/30 hover:decoration-foreground transition-colors";

function WritingList({ id, title, accent, items }: { id: string; title: React.ReactNode; accent: string; items: Writing[] }) {
  if (!items.length) return null;
  return (
    <section id={id} className="mt-24 md:mt-32 scroll-mt-28">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      <ul className="mt-8 border-t border-foreground/10">
        {items.map((w) => (
          <li key={w.href} className="border-b border-foreground/10">
            <a href={w.href} target="_blank" rel="noopener noreferrer" className="group grid md:grid-cols-[180px_1fr_auto] gap-x-10 gap-y-1 py-6">
              <span className="text-sm text-foreground/60 tabular-nums">{[w.where, w.date].filter(Boolean).join(" · ")}</span>
              <span>
                <span className="block text-xl font-semibold leading-snug group-hover:text-[var(--tint)] transition-colors" style={{ "--tint": accent } as React.CSSProperties}>{w.title}</span>
                {w.summary && <span className="mt-2 block text-[15px] leading-relaxed text-foreground/70 max-w-[65ch]">{w.summary}</span>}
              </span>
              <ArrowUpRight size={20} aria-hidden className="hidden md:block mt-1 text-foreground/50 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function WorkPage() {
  const systems = projects.filter((p) => p.summary);
  const sections = [
    { id: "systems", label: "Systems", count: systems.length },
    { id: "articles", label: "Articles", count: articles.length },
    { id: "research", label: "Research", count: research.length },
  ].filter((s) => s.count > 0);

  return (
    <div className="relative overflow-x-clip">
      <header className="fixed top-4 md:top-6 inset-x-4 md:inset-x-6 z-50 flex items-center justify-between h-10">
        {/* fade behind the bar so scrolling text doesn't collide with it (same as the home nav) */}
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 h-24 -z-10 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, var(--background) 35%, color-mix(in srgb, var(--background) 70%, transparent) 65%, transparent)" }}
        />
        <Link href="/home" aria-label="Tiffany Lyssa, home" className="block py-1">
          <PixelLogo cell={3} />
        </Link>
        <a
          href={RESUME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold text-foreground/85 bg-[#161616]/85 border border-white/15 backdrop-blur-md transition-colors hover:text-foreground hover:border-white/30"
        >
          <FileDown size={15} aria-hidden /> Resume
        </a>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 pt-32 md:pt-40 pb-24">
        {/* same sky as the case files this page opens from */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[560px] pointer-events-none [mask-image:linear-gradient(#000_55%,transparent)]">
          <GalaxyDots count={50} />
        </div>

        <div className="relative">
          <Link href="/home#projects" className="group inline-flex items-center gap-2 py-2 text-sm text-foreground/65 hover:text-foreground transition-colors">
            <ArrowLeft size={15} aria-hidden className="transition-transform duration-200 ease-out group-hover:-translate-x-1" />
            Back to the folder
          </Link>

          <h1 className="mt-8 text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight text-balance">
            Every file, <span className="text-[var(--color-accent)]">opened</span>
          </h1>
          <p className="mt-5 text-base md:text-lg leading-relaxed text-foreground/70 max-w-[52ch]">
            All {systems.length} systems I&apos;ve built so far: what each one does, my part in it and what it runs on.
          </p>

          {sections.length > 1 && (
            <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className={`py-2 font-medium text-foreground/85 hover:text-foreground ${LINK}`}>
                  {s.label} <span className="text-foreground/55 tabular-nums">{s.count}</span>
                </a>
              ))}
            </nav>
          )}

          {/* index: the folder's contents list */}
          <ol className="mt-12 md:mt-16 grid sm:grid-cols-2 gap-x-12 border-t border-foreground/10">
            {systems.map((p, i) => (
              <li key={p.slug} className="border-b border-foreground/10">
                <a href={`#${p.slug}`} className="group flex items-baseline gap-4 py-3.5">
                  <span className="font-mono text-xs text-foreground/55 tabular-nums">{pad(i + 1)}</span>
                  <span className="text-[15px] font-medium leading-snug text-foreground/85 group-hover:text-[var(--tint)] transition-colors" style={{ "--tint": p.color } as React.CSSProperties}>
                    {p.name}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        <section id="systems" className="relative mt-20 md:mt-28 scroll-mt-28">
          <h2 className="sr-only">Systems</h2>
          {systems.map((p, i) => (
            <article
              key={p.slug}
              id={p.slug}
              aria-labelledby={`${p.slug}-title`}
              className="grid md:grid-cols-[200px_1fr] gap-x-12 gap-y-4 py-12 md:py-16 border-t border-foreground/10 scroll-mt-24"
            >
              <div>
                <p className="flex items-center gap-2 font-mono text-xs tracking-[0.12em] text-foreground/60">
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                  CASE {pad(i + 1)}
                </p>
                {p.role && (
                  <ul className="mt-3 md:mt-4 flex flex-wrap md:flex-col gap-x-3 gap-y-1 text-sm font-semibold" style={{ color: p.color }}>
                    {p.role.split(" · ").map((r) => <li key={r}>{r}</li>)}
                  </ul>
                )}
              </div>
              <div>
                <h3 id={`${p.slug}-title`} className="text-2xl md:text-4xl font-bold leading-[1.1] tracking-tight text-balance">{p.name}</h3>
                <p className="mt-4 text-base md:text-lg leading-relaxed text-foreground/75 max-w-[62ch]">{p.summary}</p>
                {p.stack && (
                  <p className="mt-5 text-sm text-foreground/60">
                    <span className="text-foreground/85">Built with</span> {p.stack.join(", ")}
                  </p>
                )}
                {p.link && (
                  <a href={p.link.href} target="_blank" rel="noopener noreferrer" className={`mt-5 inline-flex items-center gap-1.5 py-2 text-sm font-semibold ${LINK}`}>
                    {p.link.label} <ArrowUpRight size={15} aria-hidden />
                  </a>
                )}
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- plain <img>, like the rest of the site
                  <img src={p.image} alt={`${p.name} screenshot`} loading="lazy" className="mt-8 w-full rounded-2xl border border-white/10" />
                )}
              </div>
            </article>
          ))}
        </section>

        <WritingList id="articles" accent="var(--color-accent2)" items={articles} title={<>Things I&apos;ve <span className="text-[var(--color-accent2)]">written</span></>} />
        <WritingList id="research" accent="var(--color-accent4)" items={research} title={<>Things I&apos;ve <span className="text-[var(--color-accent4)]">researched</span></>} />

        <footer className="mt-20 md:mt-28 pt-10 border-t border-foreground/10 flex flex-wrap items-center justify-between gap-6">
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-balance max-w-[20ch]">Want the long version of one of these?</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/home#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f0f0f0] text-[#0e0e0e] text-sm font-bold transition-[transform,background-color] duration-150 ease-out hover:bg-white active:scale-[0.97]">
              Ask me about it
            </Link>
            <Link href="/home" className={`py-3 text-sm font-semibold text-foreground/85 hover:text-foreground ${LINK}`}>
              Back to the site
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
