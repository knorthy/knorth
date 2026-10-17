// Contact form: validates the message and emails it to Tiffany through Resend (https://resend.com).
// Needs in .env.local (and in the host's environment variables when deployed):
//   RESEND_API_KEY=re_...                 (from the Resend dashboard)
//   CONTACT_TO_EMAIL=you@yourmail.com     (where messages land; never sent to the browser)
//   CONTACT_FROM_EMAIL="Portfolio <hello@yourdomain.com>"   (optional; a verified Resend sender)
// Without the key the route answers 503 "not_configured" and the form says so honestly.
//
// Abuse protection, cheapest check first:
//   1. same-origin requests only, JSON only, small bodies only
//   2. per-IP limits (burst and daily) and a site-wide daily cap that keeps the Resend quota safe
//   3. bot traps: hidden honeypot field and a minimum time on the form (bots get a fake "sent")
//   4. content checks: link stuffing, links in the name, repeated identical messages
// The limits live in memory, so they reset when a server instance restarts. Volumetric (DDoS) traffic
// is stopped by the host before it reaches this code; see the note at the bottom.
export const runtime = "nodejs";

const LIMITS = { name: 100, email: 200, message: 4000, bodyBytes: 12_000 };
const MIN_FILL_MS = 3000; // faster than any person can type a message
const MAX_LINKS = 3;
const PER_IP = [
  { windowMs: 10 * 60 * 1000, max: 3 },
  { windowMs: 24 * 60 * 60 * 1000, max: 10 },
];
const GLOBAL_PER_DAY = 60; // Resend's free plan allows 100/day; leave headroom
const MAX_TRACKED = 5000; // bounded memory even under a flood of distinct IPs
const DAY = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /(https?:\/\/|www\.)\S+/i;
const URLS_RE = /(https?:\/\/|www\.)\S+/gi;

const ipHits = new Map<string, number[]>();
let globalHits: number[] = [];
const recentMessages = new Map<string, number>(); // message hash -> time, to drop resends of the same text

function prune<V>(map: Map<string, V>) {
  // Maps keep insertion order, so the oldest entries go first
  while (map.size > MAX_TRACKED) map.delete(map.keys().next().value as string);
}

function ipLimited(ip: string, now: number): boolean {
  const recent = (ipHits.get(ip) ?? []).filter((t) => now - t < DAY);
  if (PER_IP.some(({ windowMs, max }) => recent.filter((t) => now - t < windowMs).length >= max)) return true;
  recent.push(now);
  ipHits.delete(ip);
  ipHits.set(ip, recent);
  prune(ipHits);
  return false;
}

function globalLimited(now: number): boolean {
  globalHits = globalHits.filter((t) => now - t < DAY);
  return globalHits.length >= GLOBAL_PER_DAY;
}

async function digest(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Buffer.from(buf).toString("hex");
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
// Bots get the same answer as a real send, so they learn nothing and don't retry
const fakeOk = () => json(200, { ok: true });

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();

function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  // 1. Shape of the request
  if (!sameOrigin(req)) return json(403, { error: "forbidden" });
  if (!req.headers.get("content-type")?.includes("application/json")) return json(415, { error: "bad_request" });
  if (Number(req.headers.get("content-length") ?? 0) > LIMITS.bodyBytes) return json(413, { error: "bad_request" });

  // 2. Rate limits
  const now = Date.now();
  if (ipLimited(clientIp(req), now)) return json(429, { error: "rate_limited" });
  if (globalLimited(now)) return json(503, { error: "busy" });

  const raw = await req.text().catch(() => "");
  if (!raw || raw.length > LIMITS.bodyBytes) return json(400, { error: "bad_request" });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "bad_request" });
  }
  if (!body || typeof body !== "object") return json(400, { error: "bad_request" });

  // 3. Bot traps
  if (typeof body.company === "string" && body.company.trim()) return fakeOk();
  const elapsed = Number(body.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return fakeOk();

  const name = oneLine(String(body.name ?? ""));
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const urgent = body.urgent === true;

  const fields: Record<string, string> = {};
  if (!name) fields.name = "required";
  else if (name.length > LIMITS.name) fields.name = "too_long";
  if (!email) fields.email = "required";
  else if (!EMAIL_RE.test(email) || email.length > LIMITS.email || /[\r\n,;<>]/.test(email)) fields.email = "invalid";
  if (!message) fields.message = "required";
  else if (message.length > LIMITS.message) fields.message = "too_long";
  if (Object.keys(fields).length) return json(422, { error: "invalid", fields });

  // 4. Content checks
  if (URL_RE.test(name) || (message.match(URLS_RE)?.length ?? 0) > MAX_LINKS) return json(422, { error: "spam" });
  const hash = await digest(`${email.toLowerCase()}|${message.toLowerCase().replace(/\s+/g, " ")}`);
  for (const [h, t] of recentMessages) if (now - t > DAY) recentMessages.delete(h);
  if (recentMessages.has(hash)) return fakeOk(); // already delivered once; don't fill the inbox with copies

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) return json(503, { error: "not_configured" });

  const from = process.env.CONTACT_FROM_EMAIL || "Portfolio contact <onboarding@resend.dev>";
  const subject = `${urgent ? "[URGENT, cat on keyboard] " : ""}Portfolio message from ${name}`.slice(0, 160);
  const html = `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt; wrote:</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject, html, text: `${name} <${email}> wrote:\n\n${message}` }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Log Resend's status and error only; never the visitor's message or address
      const detail = await res.json().catch(() => null) as { name?: string; message?: string } | null;
      console.error("Contact send failed:", res.status, detail?.name ?? "", detail?.message ?? "");
      return json(502, { error: "send_failed" });
    }
    globalHits.push(now);
    recentMessages.set(hash, now);
    prune(recentMessages);
    return json(200, { ok: true });
  } catch (error) {
    console.error("Contact send failed:", (error as Error).name);
    return json(502, { error: "send_failed" });
  }
}

// DDoS: floods of traffic are absorbed by the host before they reach this function (Vercel and
// Cloudflare both mitigate this by default on every plan). For extra cover on Vercel, add a Firewall
// rate-limit rule for /api/contact in the project dashboard.
