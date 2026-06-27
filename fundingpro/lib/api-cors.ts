import { NextRequest, NextResponse } from "next/server";

const CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_HEADERS = "Authorization, Content-Type, X-Request-Id";

export function parseAllowedOrigins(env = process.env.CORS_ALLOWED_ORIGINS): string[] {
  if (!env?.trim()) return [];
  return env
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(
  origin: string | null,
  allowed: string[] = parseAllowedOrigins()
): boolean {
  if (!origin) return false;
  if (allowed.length === 0) return false;
  if (allowed.includes("*")) return true;
  return allowed.includes(origin);
}

function corsHeaderValues(origin: string, allowed: string[]): Record<string, string> {
  const allowOrigin = allowed.includes("*") ? "*" : origin;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": CORS_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function handleCorsPreflight(req: NextRequest): NextResponse | null {
  if (req.method !== "OPTIONS") return null;

  const origin = req.headers.get("origin");
  const allowed = parseAllowedOrigins();
  if (!origin || allowed.length === 0 || !isOriginAllowed(origin, allowed)) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaderValues(origin, allowed),
  });
}

export function applyCorsToResponse(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  const allowed = parseAllowedOrigins();
  if (!origin || !isOriginAllowed(origin, allowed)) return res;

  for (const [name, value] of Object.entries(corsHeaderValues(origin, allowed))) {
    res.headers.set(name, value);
  }
  return res;
}
