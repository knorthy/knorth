// Contact form: validates the message and emails it to Tiffany through Resend (https://resend.com).
// Needs in .env.local:
//   RESEND_API_KEY=re_...                 (from the Resend dashboard)
//   CONTACT_TO_EMAIL=you@yourmail.com     (where messages land)
//   CONTACT_FROM_EMAIL="Portfolio <hello@yourdomain.com>"   (optional; a verified Resend sender)
// Without the key the route answers 503 "not_configured" and the form says so honestly.
export const runtime = "nodejs";

const LIMITS = { name: 100, email: 200, message: 4000 };
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT.max;
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return json(429, { error: "rate_limited" });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json(400, { error: "bad_request" });

  // Honeypot: real people never see or fill this field
  if (typeof body.company === "string" && body.company.trim()) return json(200, { ok: true });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const urgent = body.urgent === true;

  const fields: Record<string, string> = {};
  if (!name) fields.name = "required";
  else if (name.length > LIMITS.name) fields.name = "too_long";
  if (!email) fields.email = "required";
  else if (!EMAIL_RE.test(email) || email.length > LIMITS.email) fields.email = "invalid";
  if (!message) fields.message = "required";
  else if (message.length > LIMITS.message) fields.message = "too_long";
  if (Object.keys(fields).length) return json(422, { error: "invalid", fields });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) return json(503, { error: "not_configured" });

  const from = process.env.CONTACT_FROM_EMAIL || "Portfolio contact <onboarding@resend.dev>";
  const subject = `${urgent ? "[URGENT, cat on keyboard] " : ""}Portfolio message from ${name}`;
  const html = `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt; wrote:</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject, html, text: `${name} <${email}> wrote:\n\n${message}` }),
    });
    if (!res.ok) {
      console.error("Contact send failed:", res.status, await res.text().catch(() => ""));
      return json(502, { error: "send_failed" });
    }
    return json(200, { ok: true });
  } catch (error) {
    console.error("Contact send failed:", error);
    return json(502, { error: "send_failed" });
  }
}
