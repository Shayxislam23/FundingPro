/** Origin / IP / app restrictions for partner keys. Pure functions — unit tested. */

export function normalizeOrigin(origin: string): string | null {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Browser calls carry an Origin header. A partner with no allowed domains may only
 * call server-to-server (no Origin). A partner with domains may call from those origins.
 */
export function isOriginAllowedForPartner(origin: string | null, allowedDomains: string[]): boolean {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return allowedDomains.some((d) => normalizeOrigin(d) === normalized);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

/** Exact IPv4/IPv6 match or IPv4 CIDR (e.g. 203.0.113.0/24). */
export function ipMatches(ip: string, rule: string): boolean {
  const r = rule.trim();
  if (!r) return false;
  if (!r.includes("/")) return ip.toLowerCase() === r.toLowerCase();
  const [base, bitsRaw] = r.split("/");
  const bits = Number(bitsRaw);
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return ((ipInt & mask) >>> 0) === ((baseInt & mask) >>> 0);
}

export function isIpAllowedForPartner(ip: string | null, allowedIps: string[]): boolean {
  if (allowedIps.length === 0) return true;
  if (!ip) return false;
  return allowedIps.some((rule) => ipMatches(ip, rule));
}

export function isAppAllowedForPartner(appId: string | null, allowedAppIds: string[]): boolean {
  if (!appId || allowedAppIds.length === 0) return true;
  return allowedAppIds.includes(appId.trim());
}

const IP_SHAPE = /^[0-9a-fA-F:.]{2,45}$/;

/**
 * Client IP as seen by Vercel's edge. `x-vercel-forwarded-for` / `x-real-ip` are set
 * by the platform; `x-forwarded-for` is only used as a last resort.
 */
export function getPartnerClientIp(headers: Headers): string | null {
  for (const name of ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"]) {
    const raw = headers.get(name);
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim() ?? "";
    if (IP_SHAPE.test(first)) return first;
  }
  return null;
}

const KEY_QUERY_PARAMS = ["api_key", "apikey", "key", "x-api-key", "token", "access_token"];

/** Keys must never travel in URLs (they end up in logs, proxies and browser history). */
export function hasKeyInQuery(params: URLSearchParams): boolean {
  for (const name of params.keys()) {
    if (KEY_QUERY_PARAMS.includes(name.toLowerCase())) return true;
  }
  return false;
}
