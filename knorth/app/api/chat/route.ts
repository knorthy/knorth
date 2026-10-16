// Kniah chat: streams short answers about Tiffany from Claude, grounded in the site's own data.
// Needs ANTHROPIC_API_KEY in .env.local (or any credential the Anthropic SDK can resolve).
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/chat-knowledge";

export const runtime = "nodejs";

const MODEL = "claude-haiku-5-5";
const MAX_TURNS = 12; // conversation history sent per request
const MAX_CHARS = 600; // per visitor message
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 20 }; // per visitor IP

const SYSTEM = buildSystemPrompt();

// Best-effort, per-instance limiter. Good enough for a portfolio; swap for a shared store if needed.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT.max;
}

function parseMessages(body: unknown): Anthropic.MessageParam[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) return null;
  const raw = (body as { messages: unknown[] }).messages.slice(-MAX_TURNS);
  const messages: Anthropic.MessageParam[] = [];
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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return json(429, "rate_limited");

  const messages = parseMessages(await req.json().catch(() => null));
  if (!messages) return json(400, "bad_request");

  // No key on the server: say so plainly instead of failing mid-stream
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return json(503, "not_configured");
  const client = new Anthropic();

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: 1024, // deliberately short chat answers
          system: SYSTEM,
          // No tools and short answers: skip thinking for fast first tokens
          thinking: { type: "disabled" },
          output_config: { effort: "low" },
          messages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode("\n\nThat one's outside what I can answer. Ask Tiffany directly through the contact form below!"),
          );
        }
      } catch (error) {
        // Mid-stream failure: tell the client with a marker it knows how to render
        const code =
          error instanceof Anthropic.AuthenticationError ? "not_configured"
          : error instanceof Anthropic.RateLimitError ? "busy"
          : "error";
        console.error("Kniah chat failed:", error);
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
