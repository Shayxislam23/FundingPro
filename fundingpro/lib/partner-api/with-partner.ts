import { NextResponse, type NextRequest } from "next/server";
import { hashPartnerApiKey, isWellFormedPartnerKey, partnerKeyEnvironment, sha256Hex } from "../../convex/lib/partnerKeys";
import {
  getPartnerClientIp,
  hasKeyInQuery,
  isAppAllowedForPartner,
  isIpAllowedForPartner,
  isOriginAllowedForPartner,
  normalizeOrigin,
} from "./access";
import { PartnerApiError, isPartnerApiError, partnerErrorResponse } from "./errors";
import type { PartnerErrorCode } from "../../convex/lib/partnerApi";

export type PartnerEnvironment = "production" | "sandbox";

export type AuthorizedPartner = {
  id: string;
  partnerCode: string;
  name: string;
  environment: PartnerEnvironment;
  allowedDomains: string[];
  allowedIps: string[];
  allowedAppIds: string[];
  brandingRequired: boolean;
};

export type BeginRequestResult =
  | {
      ok: true;
      partner: AuthorizedPartner;
      rateLimit: { limit: number; remaining: number; resetAt: number };
      monthly: { limit: number; used: number };
    }
  | {
      ok: false;
      code: PartnerErrorCode;
      message: string;
      partnerId: string | null;
      retryAfterSec: number | null;
      rateLimit: { limit: number; remaining: number; resetAt: number } | null;
    };

export type RequestLogEntry = {
  partnerId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  requestId: string;
  ipHash?: string;
  responseTimeMs: number;
  errorCode?: string;
};

export type PartnerDeps = {
  environment: () => PartnerEnvironment;
  beginRequest: (keyHash: string, environment: PartnerEnvironment) => Promise<BeginRequestResult>;
  logRequest: (entry: RequestLogEntry) => Promise<void>;
  /** Runs work after the response is sent (Next.js `after`). */
  defer: (task: () => Promise<void>) => void;
  now?: () => number;
};

export type PartnerRequestContext = {
  requestId: string;
  partner: AuthorizedPartner;
  clientIp: string | null;
};

type RouteContext = { params: Promise<Record<string, string | string[]>> };

export type PartnerHandler = (
  req: NextRequest,
  pctx: PartnerRequestContext,
  routeCtx: RouteContext
) => Promise<NextResponse> | NextResponse;

export function newRequestId(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return `req_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

const CORS_ALLOW_HEADERS = "X-API-Key, Content-Type, Idempotency-Key, X-Request-Id, X-App-Id";
const CORS_EXPOSE_HEADERS =
  "X-Request-Id, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After";

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": CORS_ALLOW_HEADERS,
    "Access-Control-Expose-Headers": CORS_EXPOSE_HEADERS,
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

/** Preflight cannot carry the key, so it is answered from the global partner-origin list. */
export function partnerPreflight(req: NextRequest): NextResponse {
  const origin = req.headers.get("origin");
  const allowed = (process.env.PARTNER_API_CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => normalizeOrigin(s.trim()))
    .filter(Boolean) as string[];
  const normalized = origin ? normalizeOrigin(origin) : null;
  if (!normalized || !allowed.includes(normalized)) return new NextResponse(null, { status: 204 });
  return new NextResponse(null, { status: 204, headers: corsHeaders(normalized) });
}

function rateHeaders(rl: { limit: number; remaining: number; resetAt: number } | null): Record<string, string> {
  if (!rl) return {};
  return {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
  };
}

/**
 * Wraps a partner route: request id → key auth (hash lookup) → quota → origin/IP/app
 * restrictions → handler → headers → request journal (deferred, no PII).
 */
export function createWithPartner(deps: PartnerDeps) {
  return function withPartner(endpoint: string, handler: PartnerHandler) {
    return async (req: NextRequest, routeCtx: RouteContext): Promise<NextResponse> => {
      const now = deps.now ?? Date.now;
      const started = now();
      const requestId = newRequestId();
      const clientIp = getPartnerClientIp(req.headers);
      let partnerId: string | null = null;
      let rate: { limit: number; remaining: number; resetAt: number } | null = null;

      const finish = (res: NextResponse, errorCode?: string): NextResponse => {
        res.headers.set("X-Request-Id", requestId);
        for (const [k, v] of Object.entries(rateHeaders(rate))) res.headers.set(k, v);
        if (partnerId) {
          const entry: RequestLogEntry = {
            partnerId,
            endpoint,
            method: req.method,
            statusCode: res.status,
            requestId,
            responseTimeMs: Math.max(0, now() - started),
            errorCode,
          };
          deps.defer(async () => {
            try {
              if (clientIp) entry.ipHash = (await sha256Hex(`ip:${clientIp}`)).slice(0, 32);
              await deps.logRequest(entry);
            } catch (err) {
              console.error("[partner-api] request log failed", { requestId, err: String(err) });
            }
          });
        }
        return res;
      };
      const fail = (code: PartnerErrorCode, message: string, status?: number, headers?: Record<string, string>) =>
        finish(partnerErrorResponse(code, message, requestId, status, headers), code);

      const url = new URL(req.url);
      if (hasKeyInQuery(url.searchParams)) {
        return fail("INVALID_REQUEST", "Send the API key in the X-API-Key header, never in the URL");
      }

      const apiKey = req.headers.get("x-api-key")?.trim() ?? "";
      if (!apiKey || !isWellFormedPartnerKey(apiKey)) {
        return fail("INVALID_API_KEY", "Missing or invalid API key");
      }
      const env = deps.environment();
      if (partnerKeyEnvironment(apiKey) !== env) {
        return fail(
          "INVALID_API_KEY",
          env === "production" ? "Sandbox keys do not work in production" : "Production keys do not work in sandbox"
        );
      }

      let auth: BeginRequestResult;
      try {
        auth = await deps.beginRequest(await hashPartnerApiKey(apiKey), env);
      } catch (err) {
        console.error("[partner-api] auth backend error", { requestId, err: String(err) });
        return fail("INTERNAL_ERROR", "Temporary error, please retry", 503, { "Retry-After": "5" });
      }

      if (!auth.ok) {
        partnerId = auth.partnerId;
        rate = auth.rateLimit;
        const extra: Record<string, string> = auth.retryAfterSec ? { "Retry-After": String(auth.retryAfterSec) } : {};
        return fail(auth.code, auth.message, undefined, extra);
      }

      partnerId = auth.partner.id;
      rate = auth.rateLimit;
      const origin = req.headers.get("origin");
      if (!isOriginAllowedForPartner(origin, auth.partner.allowedDomains)) {
        return fail("FORBIDDEN_ORIGIN", "Origin is not allowed for this API key");
      }
      if (!isIpAllowedForPartner(clientIp, auth.partner.allowedIps)) {
        return fail("FORBIDDEN_ORIGIN", "IP address is not allowed for this API key");
      }
      if (!isAppAllowedForPartner(req.headers.get("x-app-id"), auth.partner.allowedAppIds)) {
        return fail("FORBIDDEN_ORIGIN", "Application is not allowed for this API key");
      }

      let res: NextResponse;
      let errorCode: string | undefined;
      try {
        res = await handler(req, { requestId, partner: auth.partner, clientIp }, routeCtx);
      } catch (err) {
        if (isPartnerApiError(err)) {
          res = partnerErrorResponse(err.code, err.message, requestId, err.status, err.headers);
          errorCode = err.code;
        } else {
          console.error("[partner-api] handler error", { requestId, endpoint, err: String(err) });
          res = partnerErrorResponse("INTERNAL_ERROR", "Internal error", requestId);
          errorCode = "INTERNAL_ERROR";
        }
      }

      const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
      if (normalizedOrigin) {
        for (const [k, v] of Object.entries(corsHeaders(normalizedOrigin))) res.headers.set(k, v);
      }
      if (auth.partner.brandingRequired) {
        res.headers.set("X-FundingPro-Attribution", "Grant data powered by FundingPro");
      }
      return finish(res, errorCode);
    };
  };
}

export async function readJsonBody(req: NextRequest, maxBytes = 16_384): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) {
    throw new PartnerApiError("INVALID_REQUEST", "Content-Type must be application/json", 415);
  }
  const text = await req.text();
  if (text.length > maxBytes) throw new PartnerApiError("INVALID_REQUEST", "Request body too large", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new PartnerApiError("INVALID_REQUEST", "Body must be valid JSON");
  }
}
