"use client";
// Floating Kniah chat: the pixel cat lives in the bottom-right corner and comments on what the visitor
// is doing (see useKnoBrain). Hover makes it backflip, a click makes it hop and opens a small chat that
// streams answers about Tiffany from /api/chat.
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import KnoCat, { type KnoMood } from "./KnoCat";
import { useKnoBrain } from "./useKnoBrain";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

const GREETING =
  "Hi! I'm Kniah, Tiffany's pixel cat. Ask me what she builds, where she's worked, or how to reach her.";
const SUGGESTIONS = [
  "What does Tiffany build?",
  "Is she open to internships?",
  "Tell me about her hardware projects",
  "How do I contact her?",
];
const ERRORS: Record<string, string> = {
  not_configured: "My chat brain isn't plugged in yet. Reach Tiffany through the contact form below instead!",
  rate_limited: "That's a lot of questions! Give me a few minutes, or ask Tiffany directly through the contact form.",
  busy: "I'm a little swamped right now. Try again in a moment, or use the contact form below.",
  error: "My whiskers lost signal. Try again, or reach Tiffany through the contact form below.",
};
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const FLIP_MS = 820;

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-1 h-4" aria-label="Kniah is typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="kno-dot w-1.5 h-1.5 bg-[#ffb3d6]" style={{ animationDelay: `${i * 0.14}s` }} />
      ))}
    </span>
  );
}

export default function ChatWidget() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hop, setHop] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [chatSessions, setChatSessions] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setChatSessions((n) => n + 1);
    abortRef.current?.abort();
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, close]);

  // Keep the newest message in view while it streams
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    const history: Msg[] = [...messages.filter((m) => !m.error), { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const setLast = (patch: (m: Msg) => Msg) =>
      setMessages((ms) => [...ms.slice(0, -1), patch(ms[ms.length - 1])]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const { error } = await res.json().catch(() => ({ error: "error" }));
        setLast(() => ({ role: "assistant", content: ERRORS[error] ?? ERRORS.error, error: true }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const marker = acc.indexOf("\u0000");
        if (marker !== -1) {
          const code = acc.slice(marker + 1);
          const before = acc.slice(0, marker).trim();
          setLast(() => ({
            role: "assistant",
            content: before ? `${before}\n\n${ERRORS[code] ?? ERRORS.error}` : ERRORS[code] ?? ERRORS.error,
            error: !before,
          }));
          return;
        }
        setLast((m) => ({ ...m, content: acc }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setLast(() => ({ role: "assistant", content: ERRORS.error, error: true }));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const toggle = () => {
    if (open) { close(); return; }
    setHop((h) => h + 1);
    setTimeout(() => setOpen(true), reduce ? 0 : 260);
  };

  const brain = useKnoBrain(open || hovered, chatSessions);
  const launcherMood: KnoMood = flipping ? "flip" : hovered ? "idle" : brain.mood;

  const onEnter = () => {
    setHovered(true);
    if (reduce || flipping) return;
    setFlipping(true);
    setTimeout(() => setFlipping(false), FLIP_MS);
  };

  const bubbleText = open ? null : hovered ? "Ask me anything" : brain.line;
  const lastIsEmptyAssistant = streaming && messages[messages.length - 1]?.content === "";

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex items-end gap-2">
        <AnimatePresence mode="wait">
          {bubbleText && (
            <motion.div
              key={bubbleText}
              aria-hidden
              initial={{ opacity: 0, x: 8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 6, scale: 0.95, transition: { duration: 0.12 } }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="mb-7 max-w-[200px] md:max-w-[240px] px-3 py-2 rounded-xl rounded-br-sm bg-[#fff0f6] text-[#3d0a24] text-xs font-semibold leading-snug shadow-lg pointer-events-none origin-bottom-right"
            >
              {bubbleText}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          ref={launcherRef}
          type="button"
          onClick={toggle}
          onPointerEnter={onEnter}
          onPointerLeave={() => setHovered(false)}
          aria-label={open ? "Close chat with Kniah" : "Chat with Kniah, Tiffany's assistant"}
          aria-expanded={open}
          aria-controls="kno-chat"
          className={`kno-launcher relative grid place-items-center w-20 h-16 rounded-2xl ${hovered ? "kno-perk" : ""}`}
        >
          <motion.span
            key={hop}
            className="block"
            initial={false}
            animate={hop && !reduce ? { y: [0, -16, 0, -4, 0], scaleY: [1, 1.08, 0.9, 1.02, 1], scaleX: [1, 0.94, 1.08, 0.99, 1] } : undefined}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ transformOrigin: "50% 100%" }}
          >
            <KnoCat size={76} mood={launcherMood} />
          </motion.span>
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="kno-chat"
            role="dialog"
            aria-label="Chat with Kniah"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.16 } }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="fixed z-[61] inset-x-3 bottom-3 h-[78svh] md:inset-x-auto md:right-6 md:bottom-24 md:w-[380px] md:h-[min(560px,72vh)] flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#121212] origin-bottom-right"
            style={{ boxShadow: "0 24px 60px -12px rgba(0,0,0,0.75)" }}
          >
            <header className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-[#171717]">
              <span className="grid place-items-center w-11 h-9 shrink-0">
                <KnoCat size={44} decor={false} track={false} mood={streaming ? "think" : "idle"} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">Kniah</p>
                <p className="text-xs text-foreground/50 leading-tight truncate">
                  {streaming ? "thinking…" : "Tiffany's pixel cat · answers about her work"}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close chat"
                className="ml-auto grid place-items-center w-8 h-8 rounded-lg text-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 overscroll-contain" aria-live="polite">
              <p className="kno-msg kno-msg-bot">{GREETING}</p>

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.05, duration: 0.3, ease: EASE_OUT }}
                      className="px-3 py-1.5 rounded-full border border-[#ff7eb9]/40 text-xs text-[#ffc2dd] hover:bg-[#ff7eb9]/15 hover:border-[#ff7eb9]/70 transition-colors"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              )}

              {messages.map((m, i) =>
                m.role === "user" ? (
                  <p key={i} className="kno-msg kno-msg-user">{m.content}</p>
                ) : i === messages.length - 1 && lastIsEmptyAssistant ? (
                  <div key={i} className="kno-msg kno-msg-bot"><TypingDots /></div>
                ) : (
                  <p key={i} className={`kno-msg kno-msg-bot ${m.error ? "kno-msg-error" : ""}`}>
                    {m.content}
                    {m.error && (
                      <>
                        {" "}
                        <a href="#contact" onClick={close} className="underline underline-offset-2 font-semibold">
                          Go to contact form
                        </a>
                      </>
                    )}
                  </p>
                ),
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-end gap-2 p-3 border-t border-white/[0.07]"
            >
              <label htmlFor="kno-input" className="sr-only">Ask Kniah about Tiffany</label>
              <textarea
                id="kno-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={600}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
                placeholder="Ask about Tiffany…"
                // focus shows as a purple border instead of the site's yellow ring
                style={{ outline: "none" }}
                className="flex-1 resize-none max-h-28 px-3.5 py-2.5 rounded-xl bg-[#0b0b0b] border border-white/[0.08] text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-[#ff7eb9]/60 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                aria-label="Send"
                className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-[#ff7eb9] text-[#3d0a24] transition-[opacity,transform] hover:-translate-y-0.5 disabled:opacity-35 disabled:hover:translate-y-0"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </form>
            <p className="px-4 pb-3 -mt-1 text-[11px] text-foreground/40">
              AI answers from Tiffany&apos;s portfolio. They can be wrong, so double-check with her.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
