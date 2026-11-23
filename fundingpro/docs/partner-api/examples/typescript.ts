/**
 * Minimal server-side client for the FundingPro Partner API (Node 18+ / Deno / Bun).
 * Keep FUNDINGPRO_API_KEY on your server. Never ship it to a browser or mobile app.
 */
import { randomUUID } from "node:crypto";

const BASE = process.env.FUNDINGPRO_API_BASE ?? "https://sandbox-api.fundingpro.uz/v1";
const KEY = process.env.FUNDINGPRO_API_KEY ?? "";
const PARTNER_ID = process.env.FUNDINGPRO_PARTNER_ID ?? "jizzakh_business_platform";

export class FundingProError extends Error {
  constructor(public status: number, public code: string, message: string, public requestId?: string) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "X-API-Key": KEY, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (res.ok) return (await res.json()) as T;

  const body = (await res.json().catch(() => ({}))) as { error?: { code: string; message: string; request_id?: string } };
  const retryable = res.status === 429 || res.status === 503;
  if (retryable && attempt < 3) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? 0);
    const waitMs = retryAfter > 0 && retryAfter < 120 ? retryAfter * 1000 : 500 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, waitMs));
    return call<T>(path, init, attempt + 1);
  }
  throw new FundingProError(res.status, body.error?.code ?? "HTTP_ERROR", body.error?.message ?? res.statusText, body.error?.request_id);
}

export type Grant = {
  id: string;
  slug: string;
  title: string;
  title_uz: string | null;
  title_ru: string | null;
  summary: string | null;
  donor: { name: string; type: string | null; country: string | null };
  deadline_at: string | null;
  official_url: string | null;
  last_verified_at: string | null;
  referral_url: string;
  flags: Record<string, boolean>;
  // …see openapi.yaml for all fields
};

type Page<T> = { data: T[]; pagination: { page: number; limit: number; total: number; has_more: boolean } };

// --- tiny in-memory cache honouring the agreed windows (15 min lists, 1 h details) ---
const cache = new Map<string, { until: number; value: unknown }>();
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value as T;
  const value = await load();
  cache.set(key, { until: Date.now() + ttlMs, value });
  return value;
}

export function listGrants(params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  return cached(`list:${qs}`, 15 * 60_000, () => call<Page<Grant>>(`/grants?${qs}`));
}

export async function getGrant(id: string) {
  try {
    return await cached(`grant:${id}`, 60 * 60_000, () => call<{ data: Grant }>(`/grants/${encodeURIComponent(id)}`));
  } catch (err) {
    if (err instanceof FundingProError && err.code === "GRANT_NOT_FOUND") {
      cache.delete(`grant:${id}`); // closed / removed: drop it from your UI
      return null;
    }
    throw err;
  }
}

export function sendLead(input: {
  grantId: string;
  fullName: string;
  phone?: string;
  email?: string;
  organizationName?: string;
  applicantType?: string;
  region?: string;
  message?: string;
  preferredLanguage?: "uz" | "ru" | "en";
  consentGiven: boolean;
  externalUserId?: string;
}) {
  if (!input.consentGiven) throw new Error("User consent is required before sending a lead");
  return call<{ success: boolean; lead_id: string; duplicate: boolean; status: string }>("/leads", {
    method: "POST",
    headers: { "Idempotency-Key": randomUUID() },
    body: JSON.stringify({
      partner_id: PARTNER_ID,
      grant_id: input.grantId,
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      organization_name: input.organizationName,
      applicant_type: input.applicantType,
      region: input.region,
      message: input.message,
      preferred_language: input.preferredLanguage,
      consent_to_contact: true,
      consent_text_version: process.env.FUNDINGPRO_CONSENT_TEXT_VERSION ?? "v1.0",
      utm_source: "jizzakh_platform",
      utm_medium: "web",
      external_user_id: input.externalUserId,
    }),
  });
}

export function trackEvents(
  events: Array<{ event_type: string; grant_id?: string; session_id?: string; external_user_id?: string }>
) {
  return call<{ accepted: number; rejected: number }>("/events", {
    method: "POST",
    body: JSON.stringify({ events: events.slice(0, 50) }),
  });
}

// Example:
// const page = await listGrants({ applicant_type: "business", region: "Jizzakh", limit: 20 });
// const lead = await sendLead({ grantId: page.data[0].id, fullName: "Ali Valiyev", phone: "+998901234567", consentGiven: true });
