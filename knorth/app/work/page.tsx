// /work: every project as a card, plus achievements, and research and articles once data/writing.ts
// has entries. The case files on /home are the teaser; this is the open folder.
// Content comes from data/projects.ts, data/career.ts (certifications) and data/writing.ts.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileDown } from "lucide-react";
import GalaxyDots from "@/components/GalaxyDots";
import PixelLogo from "@/components/PixelLogo";
import { certifications } from "@/data/career";
import { projects, type Project } from "@/data/projects";
import { articles, research, type Writing } from "@/data/writing";
import { RESUME_URL } from "@/lib/site";
import "./work.css";

export const metadata: Metadata = {
  title: "Work · Tiffany Lyssa",
  description: "Projects, achievements, research and articles by Tiffany Lyssa: what each build does, her role in it and what it runs on.",
};

const LINK = "underline underline-offset-4 decoration-1 decoration-foreground/30 hover:decoration-foreground transition-colors";

// ── Project card: picture on top melting into the card, stack as pills over it ──
function ProjectVisual({ p }: { p: Project }) {
  if (p.image) {
    // eslint-disable-next-line @next/next/no-img-element -- plain <img>, like the rest of the site
    return <img src={p.image} alt="" loading="lazy" className="work-card-img absolute inset-0 w-full h-full object-cover object-top" />;
  }
  if (p.logo) {
    return (
      <div className="absolute inset-0 grid place-items-center pb-[22%]" style={{ background: `color-mix(in srgb, ${p.color} 16%, #121212)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.logo} alt="" loading="lazy" className="work-card-img h-[50%] w-auto rounded-xl" />
      </div>
    );
  }
  // No picture yet: the project's short name, set large in its own colour
  return (
    <div className="absolute inset-0 grid place-items-center pb-[14%]" style={{ background: `color-mix(in srgb, ${p.color} 14%, #121212)` }}>
      <span aria-hidden className="work-card-img font-mono font-semibold text-[clamp(2.5rem,6vw,4rem)] leading-none tracking-[-0.04em]" style={{ color: p.color }}>
        {p.slug}
      </span>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <article aria-labelledby={`${p.slug}-title`} className="work-card flex flex-col overflow-hidden rounded-3xl bg-[#151515] border border-white/[0.08]">
      <div className="relative aspect-[16/9] overflow-hidden">
        <ProjectVisual p={p} />
        {/* the picture fades into the card */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#151515]" />
        {p.stack && (
          <ul className="absolute top-4 left-4 right-4 md:top-5 md:left-5 md:right-5 flex flex-wrap gap-1.5">
            {p.stack.map((s) => (
              <li key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 backdrop-blur-sm text-xs text-white/90">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative flex flex-col flex-1 px-5 md:px-7 pb-6 md:pb-7 -mt-2">
        <h3 id={`${p.slug}-title`} className="text-xl md:text-2xl font-medium leading-[1.15] tracking-tight text-balance">{p.name}</h3>
        {p.role && <p className="mt-2 text-[13px] font-semibold" style={{ color: p.color }}>{p.role}</p>}
        <p className="mt-2.5 text-sm md:text-[15px] leading-relaxed text-foreground/65 max-w-[52ch]">{p.summary}</p>
        {p.link && (
          <a
            href={p.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 self-start inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f0f0f0] text-[#0e0e0e] text-sm font-semibold transition-[transform,background-color] duration-150 ease-out hover:bg-white active:scale-[0.97]"
          >
            {p.link.label} <ArrowUpRight size={15} aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}

// ── Research and articles: appear once they have entries ──
function WritingList({ id, title, accent, items }: { id: string; title: React.ReactNode; accent: string; items: Writing[] }) {
  if (!items.length) return null;
  return (
    <section id={id} className="mt-20 md:mt-24 scroll-mt-36">
      <h2 className="text-2xl md:text-4xl font-bold tracking-tight">{title}</h2>
      <ul className="mt-6 border-t border-foreground/10">
        {items.map((w) => (
          <li key={w.href} className="border-b border-foreground/10">
            <a href={w.href} target="_blank" rel="noopener noreferrer" className="group grid md:grid-cols-[180px_1fr_auto] gap-x-10 gap-y-1 py-6">
              <span className="text-sm text-foreground/60 tabular-nums">{[w.where, w.date].filter(Boolean).join(" · ")}</span>
              <span>
                <span className="block text-lg font-semibold leading-snug group-hover:text-[var(--tint)] transition-colors" style={{ "--tint": accent } as React.CSSProperties}>{w.title}</span>
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
  const built = projects.filter((p) => p.summary);
  // the win first, then the certificates
  const achievements = [...certifications].sort((a, b) => Number(/champion/i.test(b.name)) - Number(/champion/i.test(a.name)));
  const tabs = [
    { id: "projects", label: "Projects", count: built.length },
    { id: "achievements", label: "Achievements", count: achievements.length },
    { id: "research", label: "Research", count: research.length },
    { id: "articles", label: "Articles", count: articles.length },
  ];

  return (
    <div className="relative overflow-x-clip">
      <header className="fixed top-4 md:top-6 inset-x-4 md:inset-x-6 z-50 flex items-center justify-between h-10">
        {/* fade behind the bar so scrolling text doesn't collide with it (same as the home nav) */}
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 h-32 md:h-24 -z-10 pointer-events-none"
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
        {/* Section navigation, fixed in the top bar: centred between the logo and Resume on desktop, on
            its own row under them on phones. A section with nothing in it yet is shown as on its way. */}
        <nav aria-label="On this page" className="absolute top-12 inset-x-0 md:top-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 flex justify-center pointer-events-none">
          <ul className="pointer-events-auto inline-flex max-w-full overflow-x-auto gap-1 p-1 rounded-full bg-[#161616]/90 border border-white/10 backdrop-blur-md shadow-[0_16px_32px_-16px_rgba(0,0,0,0.9)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <li key={t.id} className="shrink-0">
                {t.count > 0 ? (
                  <a href={`#${t.id}`} className="work-tab inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold text-foreground/85">
                    {t.label} <span className="text-foreground/55 tabular-nums font-medium">{t.count}</span>
                  </a>
                ) : (
                  <span aria-disabled="true" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold text-foreground/45">
                    {t.label} <span className="font-medium">soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 pt-40 md:pt-36 pb-24">
        {/* same sky as the case files this page opens from */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[560px] pointer-events-none [mask-image:linear-gradient(#000_55%,transparent)]">
          <GalaxyDots count={50} />
        </div>

        <div className="relative">
          <Link href="/home#projects" className="group inline-flex items-center gap-2 py-2 text-sm text-foreground/65 hover:text-foreground transition-colors">
            <ArrowLeft size={15} aria-hidden className="transition-transform duration-200 ease-out group-hover:-translate-x-1" />
            Back to the folder
          </Link>

          <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-[1.02] tracking-tight text-balance">
            Every file, <span className="text-[var(--color-accent)]">opened</span>
          </h1>
          <p className="mt-4 text-[15px] md:text-base leading-relaxed text-foreground/70 max-w-[52ch]">
            What I&apos;ve built, what I&apos;ve won and what I&apos;ve written up: each build with what it does, my part in it and what it runs on.
          </p>
        </div>

        <section id="projects" className="relative mt-10 md:mt-12 scroll-mt-36">
          <h2 className="sr-only">Projects</h2>
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {built.map((p) => <ProjectCard key={p.slug} p={p} />)}
          </div>
        </section>

        <section id="achievements" className="mt-20 md:mt-24 scroll-mt-36">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
            Things I&apos;ve <span className="text-[var(--color-accent3)]">earned</span>
          </h2>
          <ul className="mt-6 border-t border-foreground/10">
            {achievements.map((c) => {
              const [name, honour] = c.name.split(" — ");
              return (
                <li key={c.name} className="grid md:grid-cols-[1fr_auto] items-baseline gap-x-10 gap-y-1 py-5 border-b border-foreground/10">
                  <p className="flex flex-wrap items-baseline gap-x-3 text-base md:text-lg font-semibold leading-snug">
                    <c.icon aria-hidden className="self-center w-5 h-5 shrink-0" style={{ color: c.color }} />
                    {name}
                    {honour && <span className="text-sm font-bold" style={{ color: c.color }}>{honour}</span>}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {c.issuer}
                    {c.credentialUrl && (
                      <>
                        {" · "}
                        <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className={`py-2 font-semibold text-foreground/85 hover:text-foreground ${LINK}`}>View credential</a>
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <WritingList id="research" accent="var(--color-accent4)" items={research} title={<>Things I&apos;ve <span className="text-[var(--color-accent4)]">researched</span></>} />
        <WritingList id="articles" accent="var(--color-accent2)" items={articles} title={<>Things I&apos;ve <span className="text-[var(--color-accent2)]">written</span></>} />

      </main>
    </div>
  );
}
