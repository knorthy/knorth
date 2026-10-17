"use client";
// Contact form that actually sends (via /api/contact). States: idle → sending → sent | error.
// The playful "HTTP 200: OK" only appears after the server confirms delivery; failures keep what the
// visitor typed and offer the other ways to reach Tiffany.
import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { CONTACT_EMAIL, SOCIALS } from "@/lib/site";

const LIME = "#b5ff4d";
const PINK = "#f72585";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Fields = { name: string; email: string; message: string };
type FieldErrors = Partial<Record<keyof Fields, string>>;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; code: string };

const SERVER_ERRORS: Record<string, string> = {
  not_configured: "The form isn't connected to an inbox yet, so this didn't send.",
  rate_limited: "That's a lot of messages in a short time. Wait a few minutes and try again.",
  send_failed: "The message didn't go through on my end.",
  busy: "The inbox has had a lot of mail today. Please try again tomorrow.",
  spam: "This looks like spam to the filter. Try fewer links, or rephrase.",
  network: "Couldn't reach the server. Check your connection and try again.",
  invalid: "A field needs fixing first.",
};

function validate(f: Fields): FieldErrors {
  const e: FieldErrors = {};
  if (!f.name.trim()) e.name = "Add your name so Tiffany knows who's writing.";
  if (!f.email.trim()) e.email = "Add an email so she can reply.";
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "That email looks off. Check for a typo?";
  if (!f.message.trim()) e.message = "Write a message, even a short one.";
  return e;
}

const fieldClass = (invalid: boolean) =>
  `w-full px-4 py-3.5 rounded-2xl bg-[#0b0b0b] border text-foreground text-sm placeholder:text-foreground/45 transition-colors focus:outline-none focus-visible:outline-none ${
    invalid ? "border-[#ff6b9d] focus:border-[#ff6b9d]" : "border-white/10 hover:border-white/20 focus:border-[#ff7eb9]"
  }`;

export default function ContactForm() {
  const id = useId();
  const [fields, setFields] = useState<Fields>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [urgent, setUrgent] = useState(false);
  const [company, setCompany] = useState(""); // honeypot
  // When the form appeared: bots submit within a second or two, people don't
  const [openedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    if (status.kind === "error") setStatus({ kind: "idle" });
  };

  const allFilled = fields.name.trim() && fields.email.trim() && fields.message.trim();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = (["name", "email", "message"] as const).find((k) => found[k]);
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...fields, urgent, company, elapsed: Date.now() - openedAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus({ kind: "sent" });
        setFields({ name: "", email: "", message: "" });
        setUrgent(false);
        window.dispatchEvent(new CustomEvent("kniah:contact-sent"));
        return;
      }
      if (data.error === "invalid" && data.fields) {
        const map: FieldErrors = {};
        for (const k of Object.keys(data.fields) as (keyof Fields)[]) map[k] = validate({ ...fields, [k]: "" })[k] ?? "Check this field.";
        setErrors(map);
      }
      setStatus({ kind: "error", code: data.error ?? "send_failed" });
    } catch {
      setStatus({ kind: "error", code: "network" });
    }
  };

  if (status.kind === "sent") {
    return (
      <motion.div
        role="status"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 md:p-8 border bg-[#121212]"
        style={{ borderColor: `${LIME}55` }}
      >
        <p className="font-mono text-sm font-semibold" style={{ color: LIME }}>HTTP 200: OK</p>
        <p className="mt-2 text-lg font-semibold">Message delivered. Tiffany will get back to you soon.</p>
        <p className="mt-1 text-sm text-foreground/65">Go touch some grass while she compiles a reply.</p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-5 text-sm font-semibold underline underline-offset-4 decoration-1 hover:decoration-2"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-busy={sending}
      className="relative rounded-3xl p-6 md:p-8 space-y-5 bg-[#121212]/80 border border-white/10"
      style={{ boxShadow: "0 18px 40px -16px rgba(0, 0, 0, 0.6)" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["name", "email"] as const).map((key) => (
          <div key={key}>
            <label htmlFor={`${id}-${key}`} className="block text-xs font-semibold text-foreground/75 mb-1.5">
              {key === "name" ? "Your name" : "Your email"}
            </label>
            <input
              id={`${id}-${key}`}
              type={key === "email" ? "email" : "text"}
              autoComplete={key === "email" ? "email" : "name"}
              placeholder={key === "name" ? "Alan Turing" : "alanturing@gmail.com"}
              value={fields[key]}
              onChange={set(key)}
              maxLength={key === "email" ? 200 : 100}
              aria-invalid={!!errors[key]}
              aria-describedby={errors[key] ? `${id}-${key}-err` : undefined}
              className={fieldClass(!!errors[key])}
            />
            {errors[key] && <p id={`${id}-${key}-err`} className="mt-1.5 text-xs text-[#ff8fb5]">{errors[key]}</p>}
          </div>
        ))}
      </div>

      <div>
        <label htmlFor={`${id}-message`} className="block text-xs font-semibold text-foreground/75 mb-1.5">
          Message
        </label>
        <textarea
          id={`${id}-message`}
          rows={5}
          placeholder="A role, a project, a question, or a meme"
          value={fields.message}
          onChange={set("message")}
          maxLength={4000}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? `${id}-message-err` : undefined}
          className={`${fieldClass(!!errors.message)} resize-none`}
        />
        {errors.message && <p id={`${id}-message-err`} className="mt-1.5 text-xs text-[#ff8fb5]">{errors.message}</p>}
      </div>

      {/* Honeypot, hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>Company <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
      </div>

      <AnimatePresence>
        {allFilled && (
          <motion.label
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3 cursor-pointer group select-none"
          >
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="peer sr-only" />
            <span
              aria-hidden
              className="mt-0.5 shrink-0 w-5 h-5 rounded-md border grid place-items-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#ffe566]"
              style={{ backgroundColor: urgent ? `${LIME}22` : "transparent", borderColor: urgent ? LIME : "rgba(255,255,255,0.25)" }}
            >
              {urgent && <Check size={12} style={{ color: LIME }} />}
            </span>
            <span className="text-xs text-foreground/65 group-hover:text-foreground/85 transition-colors leading-relaxed">
              <span className="font-mono">git commit -m &quot;cat sat on enter key&quot;</span>: treat with urgency.
            </span>
          </motion.label>
        )}
      </AnimatePresence>

      <div aria-live="polite">
        {status.kind === "error" && (
          <div className="rounded-2xl px-4 py-3 text-sm border" style={{ borderColor: `${PINK}55`, background: `${PINK}12` }}>
            <p className="font-semibold">{SERVER_ERRORS[status.code] ?? SERVER_ERRORS.send_failed}</p>
            <p className="mt-1 text-foreground/70">
              Your message is still here. Try again, or reach her directly on{" "}
              <a href={SOCIALS.linkedin.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">LinkedIn</a>
              {CONTACT_EMAIL && (
                <> or at <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">{CONTACT_EMAIL}</a></>
              )}
              .
            </p>
          </div>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={sending}
        whileHover={sending ? undefined : { scale: 1.02 }}
        whileTap={sending ? undefined : { scale: 0.98 }}
        className="w-full py-4 rounded-2xl font-semibold text-[#0e0e0e] text-sm tracking-wide bg-[#f0f0f0] disabled:opacity-70 inline-flex items-center justify-center gap-2"
      >
        {sending ? (<><Loader2 size={16} className="animate-spin" aria-hidden /> Sending…</>) : "Send message"}
      </motion.button>
    </form>
  );
}
