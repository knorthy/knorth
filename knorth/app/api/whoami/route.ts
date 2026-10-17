// Echoes back what any server learns from a plain page request: the visitor's IP and the rough location
// the host derives from it. Used by Kniah's "what your browser gave away" reveal.
// Nothing is logged or stored here, and no third-party lookup is made: the location comes from headers
// the host (Vercel / Cloudflare) already attaches to every request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function header(req: Request, name: string): string | null {
  const v = req.headers.get(name);
  if (!v) return null;
  try {
    return decodeURIComponent(v).trim() || null;
  } catch {
    return v.trim() || null;
  }
}

export async function GET(req: Request) {
  const ip =
    header(req, "cf-connecting-ip") ??
    header(req, "x-real-ip") ??
    header(req, "x-forwarded-for")?.split(",")[0].trim() ??
    null;
  const isLocal = !ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.");

  return Response.json(
    {
      ip: isLocal ? null : ip,
      isLocal,
      city: header(req, "x-vercel-ip-city"),
      region: header(req, "x-vercel-ip-country-region"),
      country: header(req, "x-vercel-ip-country") ?? header(req, "cf-ipcountry"),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
