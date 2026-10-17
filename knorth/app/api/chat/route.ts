// Kniah chat: streams short answers about Tiffany from Google Gemini, grounded in the site's own data.
// Needs GEMINI_API_KEY in .env.local (free from https://aistudio.google.com/apikey).
// Optional GEMINI_MODEL picks the first model to try; otherwise fast free-tier models are tried in order.
import { ApiError, GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "@/lib/chat-knowledge";

export const runtime = "nodejs";

// Google retires and throttles models often, so a busy or retired model falls through to the next one.
// Lite models answer portfolio questions well and start replying in about 2 seconds.
const MODELS = [
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];
const RETRYABLE = new Set([404, 429, 500, 503]);
const MAX_TURNS = 12; // conversation history sent per request
const MAX_CHARS = 600; // per visitor message
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 }; // per visitor IP

const SYSTEM = buildSystemPrompt();

type ChatMessage = { role: "user" | "assistant"; content: string };

// Best-effort, per-instance limiter. Good enough for a portfolio; swap for a shared store if needed.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value as string);
  return recent.length > RATE_LIMIT.max;
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) return null;
  const raw = (body as { messages: unknown[] }).messages.slice(-MAX_TURNS);
  const messages: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_CHARS);
    if (text) messages.push({ role, content: text });
  }
  // The API needs the history to start with a user turn and end on the visitor's new message
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

export async function POST(req: Request) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return json(429, "rate_limited");

  const messages = parseMessages(await req.json().catch(() => null));
  if (!messages) return json(400, "bad_request");

  // No key on the server: say so plainly instead of failing mid-stream
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(503, "not_configured");
  const ai = new GoogleGenAI({ apiKey });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Gemini calls the assistant side "model"
        const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
        let stream: Awaited<ReturnType<typeof ai.models.generateContentStream>> | null = null;
        for (const [i, model] of MODELS.entries()) {
          try {
            stream = await ai.models.generateContentStream({
              model,
              contents,
              config: {
                systemInstruction: SYSTEM,
                maxOutputTokens: 2048, // the prompt asks for short answers; this is only a ceiling
                temperature: 0.7,
              },
            });
            break;
          } catch (error) {
            const last = i === MODELS.length - 1;
            if (last || !(error instanceof ApiError && RETRYABLE.has(error.status))) throw error;
          }
        }
        if (!stream) throw new Error("no model available");

        let sent = false;
        let blocked = false;
        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
            sent = true;
          }
          const reason = chunk.candidates?.[0]?.finishReason;
          if (chunk.promptFeedback?.blockReason || reason === "SAFETY" || reason === "PROHIBITED_CONTENT") blocked = true;
        }
        if (blocked || !sent) {
          controller.enqueue(
            encoder.encode(`${sent ? "\n\n" : ""}That one's outside what I can answer. Ask Tiffany directly through the contact form below!`),
          );
        }
      } catch (error) {
        // Mid-stream failure: tell the client with a marker it knows how to render
        const status = error instanceof ApiError ? error.status : 0;
        const code = status === 401 || status === 403 ? "not_configured" : status === 429 || status === 503 ? "busy" : "error";
        console.error("Kniah chat failed:", status, (error as Error).message);
        controller.enqueue(encoder.encode(`\u0000${code}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
