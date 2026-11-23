import { z } from "zod";
import {
  PARTNER_EVENT_TYPES,
  PARTNER_MAX_PAGE_DEPTH,
  PARTNER_MAX_PAGE_SIZE,
  normalizeEmail,
  normalizePhone,
  type PartnerGrantFilters,
  type PartnerGrantSort,
} from "../../convex/lib/partnerApi";

/** Short identifiers / codes: no control characters, bounded length. */
const token = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .regex(/^[\p{L}\p{N} _.,:;'’‘`()&/+@#-]+$/u, "contains unsupported characters");

const freeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // strip ASCII control chars except newline/tab
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""));

const isoDate = z
  .string()
  .trim()
  .max(40)
  .refine((s) => !Number.isNaN(Date.parse(s)), "must be an ISO 8601 date");

const intParam = (def: number, max: number) =>
  z
    .string()
    .optional()
    .transform((s, ctx) => {
      if (s === undefined || s === "") return def;
      if (!/^\d{1,6}$/.test(s)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "must be a positive integer" });
        return z.NEVER;
      }
      return Math.min(Math.max(1, Number(s)), max);
    });

const filterShape = {
  sector: token(80).optional(),
  applicant_type: token(40).optional(),
  country: token(80).optional(),
  region: token(80).optional(),
  funding_type: token(40).optional(),
  deadline_from: isoDate.optional(),
  deadline_to: isoDate.optional(),
  status: z.enum(["open", "upcoming"]).optional(),
  language: token(40).optional(),
};

export const grantsListQuerySchema = z
  .object({
    page: intParam(1, PARTNER_MAX_PAGE_DEPTH),
    limit: intParam(20, PARTNER_MAX_PAGE_SIZE),
    search: freeText(200).optional(),
    sort: z.enum(["deadline_asc", "deadline_desc", "published_desc", "amount_desc"]).optional(),
    ...filterShape,
  })
  .strict();

export const grantsSearchQuerySchema = z
  .object({
    q: freeText(200).refine((s) => s.length >= 2, "q must be at least 2 characters"),
    page: intParam(1, PARTNER_MAX_PAGE_DEPTH),
    limit: intParam(20, PARTNER_MAX_PAGE_SIZE),
    ...filterShape,
  })
  .strict();

export type GrantsListQuery = z.infer<typeof grantsListQuerySchema>;
export type GrantsSearchQuery = z.infer<typeof grantsSearchQuerySchema>;

export function toFilters(q: Partial<GrantsListQuery>): PartnerGrantFilters {
  return {
    sector: q.sector,
    applicantType: q.applicant_type,
    country: q.country,
    region: q.region,
    fundingType: q.funding_type,
    deadlineFrom: q.deadline_from ? Date.parse(q.deadline_from) : undefined,
    deadlineTo: q.deadline_to ? Date.parse(q.deadline_to) : undefined,
    status: q.status,
    language: q.language,
  };
}

export function toSort(sort: string | undefined): PartnerGrantSort {
  return (sort as PartnerGrantSort | undefined) ?? "deadline_asc";
}

/** URLSearchParams → plain object; rejects repeated keys (parameter pollution). */
export function searchParamsToObject(params: URLSearchParams): Record<string, string> | { __duplicate: string } {
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    if (k in out) return { __duplicate: k };
    out[k] = v;
  }
  return out;
}

export const leadBodySchema = z
  .object({
    partner_id: token(64),
    grant_id: token(80),
    full_name: freeText(120).refine((s) => s.length >= 2, "full_name is required"),
    phone: z.string().trim().max(32).optional(),
    email: z.string().trim().max(254).optional(),
    organization_name: freeText(200).optional(),
    applicant_type: token(40).optional(),
    region: token(80).optional(),
    message: freeText(2000).optional(),
    preferred_language: z.enum(["uz", "ru", "en", "kaa"]).optional(),
    consent_to_contact: z.boolean(),
    consent_text_version: token(20),
    utm_source: token(100).optional(),
    utm_medium: token(100).optional(),
    utm_campaign: token(100).optional(),
    external_user_id: token(128).optional(),
  })
  .strict()
  .transform((b, ctx) => {
    const phone = b.phone ? normalizePhone(b.phone) : null;
    const email = b.email ? normalizeEmail(b.email) : null;
    if (b.phone && !phone) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "invalid phone" });
    if (b.email && !email) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "invalid email" });
    if (!b.phone && !b.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "phone or email is required" });
    }
    return { ...b, phone: phone ?? undefined, email: email ?? undefined };
  });

export type LeadBody = z.infer<typeof leadBodySchema>;

const eventSchema = z
  .object({
    event_type: z.enum(PARTNER_EVENT_TYPES),
    grant_id: token(80).optional(),
    external_user_id: token(128).optional(),
    session_id: token(128).optional(),
    utm_source: token(100).optional(),
    utm_medium: token(100).optional(),
    utm_campaign: token(100).optional(),
  })
  .strict();

export const eventsBodySchema = z.union([
  eventSchema,
  z.object({ events: z.array(eventSchema).min(1).max(50) }).strict(),
]);

export type PartnerEventInput = z.infer<typeof eventSchema>;

export function normalizeEvents(body: z.infer<typeof eventsBodySchema>): PartnerEventInput[] {
  return "events" in body ? body.events : [body];
}

export const idempotencyKeySchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, "must be a UUID");

/** Human-readable summary of zod issues — never echoes input values. */
export function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((i) => {
      const path = i.path.join(".") || "body";
      if (i.code === "unrecognized_keys") return `unknown field(s): ${i.keys.join(", ")}`;
      return `${path}: ${i.message}`;
    })
    .join("; ");
}
