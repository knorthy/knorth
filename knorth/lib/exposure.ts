// What a visitor's browser hands to any website the moment a page loads, with no prompt and no click.
// Kniah shows this once per visit to make the point that opening a link is never "just looking".
// Everything is read in the visitor's own browser (plus /api/whoami for the IP); nothing is stored,
// and none of it is sent to the chat model.

export type ExposureRow = { label: string; value: string; note?: string };
export type ExposureGroup = { title: string; rows: ExposureRow[] };
export type Exposure = { groups: ExposureGroup[]; fingerprint: string | null };

type UAData = {
  platform?: string;
  mobile?: boolean;
  brands?: { brand: string; version: string }[];
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
};
type Nav = Navigator & {
  userAgentData?: UAData;
  deviceMemory?: number;
  connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
  globalPrivacyControl?: boolean;
};

const settle = <T,>(p: Promise<T>, ms = 1500): Promise<T | null> =>
  Promise.race([p.catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), ms))]);

async function network(): Promise<ExposureRow[]> {
  const rows: ExposureRow[] = [];
  const who = await settle(
    fetch("/api/whoami", { cache: "no-store" }).then((r) => r.json() as Promise<{
      ip: string | null; isLocal: boolean; city: string | null; region: string | null; country: string | null;
    }>),
    2500,
  );
  if (who?.ip) rows.push({ label: "IP address", value: who.ip });
  else if (who?.isLocal) rows.push({ label: "IP address", value: "localhost", note: "on the live site this is your public IP" });
  if (who?.country) {
    let country = who.country;
    try { country = new Intl.DisplayNames(["en"], { type: "region" }).of(who.country) ?? who.country; } catch {}
    rows.push({ label: "Location", value: [who.city, who.region && who.region !== who.country ? who.region : null, country].filter(Boolean).join(", "), note: "from your IP alone" });
  }
  const c = (navigator as Nav).connection;
  if (c?.effectiveType) {
    const bits = [c.effectiveType.toUpperCase()];
    if (c.downlink) bits.push(`~${c.downlink} Mbps`);
    if (c.rtt) bits.push(`${c.rtt} ms ping`);
    rows.push({ label: "Connection", value: bits.join(" · ") });
  }
  return rows;
}

function gpu(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const raw = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    // "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)" -> "NVIDIA GeForce RTX 3060"
    const angle = raw.match(/ANGLE \([^,]+,\s*(.+?)(?:\s+Direct3D|\s+\(0x|,\s*[^,]+\)$|\)$)/);
    const name = (angle ? angle[1] : raw).replace(/\s*\(0x[0-9a-f]+\)/i, "").trim();
    return name || null;
  } catch {
    return null;
  }
}

function osFromUA(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return `iOS ${(ua.match(/OS (\d+[_.]\d+)/)?.[1] ?? "").replace("_", ".")}`.trim();
  if (/Android/.test(ua)) return `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ""}`.trim();
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown OS";
}
function browserFromUA(ua: string): string {
  const names: Record<string, string> = { Edg: "Edge", OPR: "Opera", SamsungBrowser: "Samsung Internet", FxiOS: "Firefox", CriOS: "Chrome" };
  const m = ua.match(/(Edg|OPR|SamsungBrowser|Firefox|FxiOS|CriOS)\/(\d+)/);
  if (m) return `${names[m[1]] ?? m[1]} ${m[2]}`;
  const chrome = ua.match(/Chrome\/(\d+)/);
  if (chrome) return `Chrome ${chrome[1]}`;
  const safari = ua.match(/Version\/(\d+).*Safari/);
  return safari ? `Safari ${safari[1]}` : "Unknown browser";
}

async function machine(): Promise<ExposureRow[]> {
  const nav = navigator as Nav;
  const ua = nav.userAgent;
  let os = osFromUA(ua);
  let browser = browserFromUA(ua);
  let model: string | null = null;
  let arch: string | null = null;

  // Chromium hides detail in the UA string but hands it over to any site that asks
  const hi = await settle(
    nav.userAgentData?.getHighEntropyValues?.(["platformVersion", "model", "architecture", "bitness", "fullVersionList"]) ??
      Promise.reject(),
  );
  if (hi) {
    const platform = nav.userAgentData?.platform;
    const pv = String(hi.platformVersion ?? "");
    if (platform === "Windows" && pv) os = parseInt(pv, 10) >= 13 ? "Windows 11" : "Windows 10";
    else if (platform === "macOS" && pv) os = `macOS ${pv.split(".").slice(0, 2).join(".")}`;
    else if (platform === "Android" && pv) os = `Android ${pv}`;
    if (hi.model) model = String(hi.model);
    if (hi.architecture) arch = `${hi.architecture === "x86" ? "x86" : String(hi.architecture).toUpperCase()}${hi.bitness ? `-${hi.bitness}` : ""}`;
    const full = (hi.fullVersionList as { brand: string; version: string }[] | undefined)?.find(
      (b) => !/Not.?A.?Brand|Chromium/i.test(b.brand),
    );
    if (full) browser = `${full.brand.replace("Microsoft ", "").replace("Google ", "")} ${full.version}`;
  }

  const rows: ExposureRow[] = [
    { label: "System", value: [os, arch].filter(Boolean).join(" · ") },
    { label: "Browser", value: browser },
  ];
  if (model) rows.push({ label: "Device", value: model });
  if (nav.hardwareConcurrency) rows.push({ label: "CPU", value: `${nav.hardwareConcurrency} threads` });
  if (nav.deviceMemory) rows.push({ label: "Memory", value: `${nav.deviceMemory >= 8 ? "8 GB or more" : `~${nav.deviceMemory} GB`}` });
  const g = gpu();
  if (g) rows.push({ label: "Graphics", value: g });
  const dpr = Math.round(window.devicePixelRatio * 100) / 100;
  rows.push({ label: "Screen", value: `${screen.width}×${screen.height}${dpr !== 1 ? ` at ${dpr}x` : ""} · window ${innerWidth}×${innerHeight}` });
  if (nav.maxTouchPoints > 0) rows.push({ label: "Touch", value: `${nav.maxTouchPoints}-point touchscreen` });

  const battery = await settle(nav.getBattery?.() ?? Promise.reject(), 800);
  if (battery) rows.push({ label: "Battery", value: `${Math.round(battery.level * 100)}%${battery.charging ? ", charging" : ", on battery"}` });

  const est = await settle(navigator.storage?.estimate?.() ?? Promise.reject(), 800);
  if (est?.quota) rows.push({ label: "Storage", value: `${Math.round(est.quota / 1e9)} GB this site could use`, note: "browsers size this from your drive" });
  return rows;
}

function habits(): ExposureRow[] {
  const nav = navigator as Nav;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const rows: ExposureRow[] = [
    { label: "Time zone", value: `${tz} · ${time} for you` },
    { label: "Languages", value: (nav.languages?.length ? nav.languages : [nav.language]).join(", ") },
  ];
  const prefs = [
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark mode" : "light mode",
    matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced motion" : null,
    matchMedia("(prefers-contrast: more)").matches ? "high contrast" : null,
  ].filter(Boolean);
  rows.push({ label: "Settings", value: prefs.join(", ") });

  let from = "typed it in, or a bookmark";
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      from = host === location.hostname ? "another page here" : host;
    }
  } catch {}
  rows.push({ label: "Came from", value: from });
  if (history.length > 1) rows.push({ label: "This tab", value: `${history.length} pages deep in its history` });

  const tracking = nav.globalPrivacyControl ? "Global Privacy Control on" : nav.doNotTrack === "1" ? "Do Not Track on (most sites ignore it)" : "no do-not-track signal";
  rows.push({ label: "Tracking", value: `${nav.cookieEnabled ? "cookies allowed" : "cookies blocked"} · ${tracking}` });
  return rows;
}

// Draws hidden text and shapes; tiny rendering differences between machines make the pixels a stable ID
function canvasPrint(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 60;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f72585";
    ctx.fillRect(100, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.font = "15px Arial";
    ctx.fillText("Kniah sees you, 1.0 \u{1F431}", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.font = "18px Times New Roman";
    ctx.fillText("Kniah sees you, 1.0 \u{1F431}", 4, 45);
    return c.toDataURL();
  } catch {
    return "";
  }
}

async function sha(text: string): Promise<string | null> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf).slice(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

let cached: Promise<Exposure> | null = null;

/** Collected once per page load; later calls reuse the same result. */
export function collectExposure(): Promise<Exposure> {
  cached ??= (async () => {
    const [net, mach] = await Promise.all([network(), machine()]);
    const you = habits();
    const groups: ExposureGroup[] = [
      { title: "Where you are", rows: net },
      { title: "Your machine", rows: mach },
      { title: "About you", rows: you },
    ].filter((g) => g.rows.length);
    // Stable traits only: what stays the same each visit is what lets a site recognise you
    const stable = [...mach.filter((r) => r.label !== "Battery" && r.label !== "Storage"), ...you.filter((r) => r.label === "Languages" || r.label === "Settings")]
      .map((r) => `${r.label}=${r.value.replace(/ · window \d+×\d+/, "")}`)
      .concat(Intl.DateTimeFormat().resolvedOptions().timeZone, canvasPrint());
    return { groups, fingerprint: await sha(stable.join("|")) };
  })();
  return cached;
}
