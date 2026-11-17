/**
 * Partner API — pure helpers shared by Convex functions and Next.js routes.
 *
 * SECURITY: every object returned to a partner is built field-by-field here
 * (whitelist). Never spread a grant/donor/lead document into a partner response.
 */
import type { Doc } from "../_generated/dataModel";

export const PARTNER_GRANT_ID_PREFIX = "grant_";
export const PARTNER_LEAD_ID_PREFIX = "lead_";

export const PARTNER_MAX_PAGE_SIZE = 50;
export const PARTNER_MAX_PAGE_DEPTH = 20;
export const PARTNER_LIST_SCAN_BUDGET = 2000;
export const PARTNER_SEARCH_SCAN_BUDGET = 256;
export const LEAD_DEDUPE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const DEADLINE_SOON_MS = 14 * 24 * 60 * 60 * 1000;

export const PARTNER_EVENT_TYPES = [
  "grant_view",
  "grant_click",
  "consultation_click",
  "lead_started",
  "lead_submitted",
  "official_source_click",
] as const;
export type PartnerEventType = (typeof PARTNER_EVENT_TYPES)[number];

export const PARTNER_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "paid",
  "rejected",
  "closed",
  "duplicate",
] as const;
export type PartnerLeadStatus = (typeof PARTNER_LEAD_STATUSES)[number];

export const PARTNER_ERROR_CODES = [
  "INVALID_API_KEY",
  "EXPIRED_API_KEY",
  "PARTNER_SUSPENDED",
  "FORBIDDEN_ORIGIN",
  "RATE_LIMIT_EXCEEDED",
  "INVALID_REQUEST",
  "CONSENT_REQUIRED",
  "GRANT_NOT_FOUND",
  "DUPLICATE_LEAD",
  "IDEMPOTENCY_CONFLICT",
  "INTERNAL_ERROR",
] as const;
export type PartnerErrorCode = (typeof PARTNER_ERROR_CODES)[number];

/** Public applicant-type vocabulary → values used in the grants table. */
const APPLICANT_TYPE_ALIASES: Record<string, string[]> = {
  business: ["business", "sme", "company", "private sector", "msme"],
  ngo: ["ngo", "nno", "nonprofit", "non-profit", "cso", "civil society"],
  startup: ["startup", "start-up", "startups"],
  individual: ["individual", "individuals", "youth", "student", "researcher"],
  government: ["government", "public sector", "municipality"],
  academic: ["academic", "university", "research institution"],
};

export const PUBLIC_APPLICANT_TYPES = Object.keys(APPLICANT_TYPE_ALIASES);

export function normalizeApplicantType(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  for (const [publicType, aliases] of Object.entries(APPLICANT_TYPE_ALIASES)) {
    if (publicType === value || aliases.includes(value)) return publicType;
  }
  return null;
}

export function publicApplicantTypes(values: string[]): string[] {
  const out = new Set<string>();
  for (const v of values) {
    const n = normalizeApplicantType(v);
    if (n) out.add(n);
  }
  return [...out];
}

export function toPublicGrantId(id: string): string {
  return `${PARTNER_GRANT_ID_PREFIX}${id}`;
}

/** Accepts `grant_<convexId>` (or a bare id) and returns the raw id candidate. */
export function fromPublicGrantId(publicId: string): string | null {
  const trimmed = publicId.trim();
  if (!trimmed || trimmed.length > 80) return null;
  const raw = trimmed.startsWith(PARTNER_GRANT_ID_PREFIX)
    ? trimmed.slice(PARTNER_GRANT_ID_PREFIX.length)
    : trimmed;
  return /^[a-z0-9]{16,64}$/i.test(raw) ? raw : null;
}

export function toPublicLeadId(id: string): string {
  return `${PARTNER_LEAD_ID_PREFIX}${id}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildGrantSearchText(
  grant: Pick<
    Doc<"grants">,
    | "title"
    | "titleRu"
    | "titleUz"
    | "summary"
    | "summaryRu"
    | "summaryUz"
    | "description"
    | "descriptionRu"
    | "sectors"
    | "tags"
    | "countryScope"
    | "applicantTypes"
    | "eligibleRegions"
  >,
  donor: Pick<Doc<"donors">, "name" | "nameRu" | "shortName"> | null
): string {
  const parts = [
    grant.title,
    grant.titleRu,
    grant.titleUz,
    grant.summary,
    grant.summaryRu,
    grant.summaryUz,
    grant.description?.slice(0, 2000),
    grant.descriptionRu?.slice(0, 2000),
    donor?.name,
    donor?.nameRu,
    donor?.shortName,
    ...(grant.sectors ?? []).map((s) => s.replace(/_/g, " ")),
    ...(grant.tags ?? []),
    ...(grant.countryScope ?? []),
    ...(grant.applicantTypes ?? []),
    ...publicApplicantTypes(grant.applicantTypes ?? []),
    ...(grant.eligibleRegions ?? []),
  ];
  return parts.filter(Boolean).join(" \n").slice(0, 8000);
}

function shortSummary(text: string | undefined | null, max = 280): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

const OPEN_STATUSES = new Set(["open", "active", "upcoming"]);

export function publicGrantStatus(grant: Pick<Doc<"grants">, "status" | "deadline" | "openDate">, now: number):
  | "open"
  | "upcoming"
  | "closed" {
  if (grant.deadline !== undefined && grant.deadline < now) return "closed";
  if (grant.status === "upcoming") return "upcoming";
  if (grant.openDate !== undefined && grant.openDate > now) return "upcoming";
  return OPEN_STATUSES.has(grant.status) ? "open" : "closed";
}

/** Grants a partner is allowed to see at all. */
export function isGrantPartnerVisible(grant: Doc<"grants">, now: number): boolean {
  if (grant.partnerVisible !== true) return false;
  if (!grant.isActive) return false;
  if (grant.verificationStatus === "invalid") return false;
  if (!OPEN_STATUSES.has(grant.status)) return false;
  if (grant.deadline !== undefined && grant.deadline < now) return false;
  return true;
}

function iso(ms: number | undefined | null): string | null {
  return typeof ms === "number" && Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

export type PartnerDonor = { name: string; type: string | null; country: string | null };

export type PartnerGrantFlags = {
  for_business: boolean;
  for_ngo: boolean;
  for_startup: boolean;
  available_in_uzbekistan: boolean;
  cofinancing_required: boolean;
  deadline_soon: boolean;
};

export type PartnerGrant = {
  id: string;
  slug: string;
  title: string;
  title_uz: string | null;
  title_ru: string | null;
  summary: string | null;
  summary_uz: string | null;
  summary_ru: string | null;
  donor: PartnerDonor;
  applicant_types: string[];
  sectors: string[];
  eligible_countries: string[];
  eligible_regions: string[];
  funding: {
    minimum: number | null;
    maximum: number | null;
    currency: string;
    cofinancing_required: boolean;
    cofinancing_percentage: number | null;
  };
  funding_type: string | null;
  deadline_at: string | null;
  timezone: "UTC";
  status: "open" | "upcoming" | "closed";
  official_url: string | null;
  application_language: string[];
  tags: string[];
  published_at: string | null;
  last_verified_at: string | null;
  fundingpro_consultation_available: boolean;
  referral_url: string;
  flags: PartnerGrantFlags;
};

export type PartnerGrantDetail = PartnerGrant & {
  description: string | null;
  description_ru: string | null;
  description_uz: string | null;
  disclaimer: string;
};

/** The exact set of keys a partner may receive for a grant (used by tests). */
export const PARTNER_GRANT_KEYS = [
  "id",
  "slug",
  "title",
  "title_uz",
  "title_ru",
  "summary",
  "summary_uz",
  "summary_ru",
  "donor",
  "applicant_types",
  "sectors",
  "eligible_countries",
  "eligible_regions",
  "funding",
  "funding_type",
  "deadline_at",
  "timezone",
  "status",
  "official_url",
  "application_language",
  "tags",
  "published_at",
  "last_verified_at",
  "fundingpro_consultation_available",
  "referral_url",
  "flags",
] as const;

export const PARTNER_GRANT_DETAIL_EXTRA_KEYS = [
  "description",
  "description_ru",
  "description_uz",
  "disclaimer",
] as const;

export const PARTNER_DISCLAIMER =
  "Always verify eligibility and deadlines with the official announcement. Grant data powered by FundingPro.";

export function buildReferralUrl(
  baseUrl: string,
  publicGrantId: string,
  partnerCode: string
): string {
  const base = baseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({ grant_id: publicGrantId, partner_id: partnerCode });
  return `${base}/apply?${params.toString()}`;
}

function grantSlug(grant: Doc<"grants">): string {
  return grant.slug ?? (slugify(grant.title) || grant._id);
}

export function toPartnerGrant(
  grant: Doc<"grants">,
  donor: Doc<"donors"> | null,
  opts: { now: number; partnerCode: string; referralBaseUrl: string }
): PartnerGrant {
  const id = toPublicGrantId(grant._id);
  const applicantTypes = publicApplicantTypes(grant.applicantTypes ?? []);
  const countries = grant.countryScope ?? [];
  const regions = grant.eligibleRegions ?? [];
  const cofinancingRequired = grant.cofinancingRequired === true;
  return {
    id,
    slug: grantSlug(grant),
    title: grant.title,
    title_uz: grant.titleUz ?? null,
    title_ru: grant.titleRu ?? null,
    summary: grant.summary ?? shortSummary(grant.description),
    summary_uz: grant.summaryUz ?? shortSummary(grant.descriptionUz),
    summary_ru: grant.summaryRu ?? shortSummary(grant.descriptionRu),
    donor: {
      name: donor?.name ?? "",
      type: donor?.type ?? null,
      country: donor?.country ?? null,
    },
    applicant_types: applicantTypes,
    sectors: [...(grant.sectors ?? [])],
    eligible_countries: [...countries],
    eligible_regions: [...regions],
    funding: {
      minimum: grant.amountMin ?? null,
      maximum: grant.amountMax ?? null,
      currency: grant.currency,
      cofinancing_required: cofinancingRequired,
      cofinancing_percentage: grant.cofinancingPercentage ?? null,
    },
    funding_type: grant.fundingType ?? null,
    deadline_at: iso(grant.deadline),
    timezone: "UTC",
    status: publicGrantStatus(grant, opts.now),
    official_url: grant.sourceUrl ?? null,
    application_language: [...(grant.applicationLanguages ?? [])],
    tags: [...(grant.tags ?? [])],
    published_at: iso(grant.publishedAt ?? grant.createdAt),
    last_verified_at: iso(grant.lastVerifiedAt),
    fundingpro_consultation_available: grant.consultationAvailable ?? true,
    referral_url: buildReferralUrl(opts.referralBaseUrl, id, opts.partnerCode),
    flags: {
      for_business: applicantTypes.includes("business"),
      for_ngo: applicantTypes.includes("ngo"),
      for_startup: applicantTypes.includes("startup"),
      available_in_uzbekistan: countries.some((c) => /uzbekistan|узбекистан|o['‘’`]?zbekiston|^uz$/i.test(c)),
      cofinancing_required: cofinancingRequired,
      deadline_soon:
        grant.deadline !== undefined &&
        grant.deadline >= opts.now &&
        grant.deadline - opts.now <= DEADLINE_SOON_MS,
    },
  };
}

export function toPartnerGrantDetail(
  grant: Doc<"grants">,
  donor: Doc<"donors"> | null,
  opts: { now: number; partnerCode: string; referralBaseUrl: string }
): PartnerGrantDetail {
  return {
    ...toPartnerGrant(grant, donor, opts),
    description: grant.description ?? null,
    description_ru: grant.descriptionRu ?? null,
    description_uz: grant.descriptionUz ?? null,
    disclaimer: PARTNER_DISCLAIMER,
  };
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export type PartnerGrantFilters = {
  sector?: string;
  applicantType?: string;
  country?: string;
  region?: string;
  fundingType?: string;
  deadlineFrom?: number;
  deadlineTo?: number;
  status?: "open" | "upcoming";
  language?: string;
};

function includesCi(values: string[] | undefined, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  return (values ?? []).some((v) => v.trim().toLowerCase() === n);
}

export function matchesPartnerFilters(
  grant: Doc<"grants">,
  f: PartnerGrantFilters,
  now: number
): boolean {
  if (f.sector && !includesCi(grant.sectors, f.sector)) return false;
  if (f.applicantType) {
    const want = normalizeApplicantType(f.applicantType);
    if (!want || !publicApplicantTypes(grant.applicantTypes ?? []).includes(want)) return false;
  }
  if (f.country && !includesCi(grant.countryScope, f.country)) return false;
  if (f.region) {
    const regions = grant.eligibleRegions ?? [];
    const ok =
      includesCi(regions, f.region) ||
      regions.some((r) => /^all( uzbekistan)?$|^весь узбекистан$|^butun o/i.test(r.trim()));
    if (!ok) return false;
  }
  if (f.fundingType && (grant.fundingType ?? "").toLowerCase() !== f.fundingType.toLowerCase()) {
    return false;
  }
  if (f.deadlineFrom !== undefined && (grant.deadline === undefined || grant.deadline < f.deadlineFrom)) {
    return false;
  }
  if (f.deadlineTo !== undefined && (grant.deadline === undefined || grant.deadline > f.deadlineTo)) {
    return false;
  }
  if (f.status && publicGrantStatus(grant, now) !== f.status) return false;
  if (f.language && !includesCi(grant.applicationLanguages, f.language)) return false;
  return true;
}

export type PartnerGrantSort = "deadline_asc" | "deadline_desc" | "published_desc" | "amount_desc";

export function sortPartnerGrants(grants: Doc<"grants">[], sort: PartnerGrantSort): Doc<"grants">[] {
  const far = Number.MAX_SAFE_INTEGER;
  const copy = [...grants];
  switch (sort) {
    case "deadline_desc":
      return copy.sort((a, b) => (b.deadline ?? 0) - (a.deadline ?? 0));
    case "published_desc":
      return copy.sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
    case "amount_desc":
      return copy.sort((a, b) => (b.amountMax ?? 0) - (a.amountMax ?? 0));
    case "deadline_asc":
    default:
      return copy.sort((a, b) => (a.deadline ?? far) - (b.deadline ?? far));
  }
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

/** Normalizes to E.164. Uzbek local numbers (9 digits) get +998. Returns null if implausible. */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  let d = digits.startsWith("+") ? digits.slice(1) : digits;
  if (d.startsWith("00")) d = d.slice(2);
  if (/^\d{9}$/.test(d)) d = `998${d}`;
  if (!/^\d{10,15}$/.test(d)) return null;
  return `+${d}`;
}

export function normalizeEmail(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const e = raw.trim().toLowerCase();
  if (e.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** Masks personal data for logs and notifications: "+99890*****67", "a***@example.com", "A*** V***". */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  if (phone.length <= 6) return "***";
  return `${phone.slice(0, 6)}${"*".repeat(Math.max(0, phone.length - 8))}${phone.slice(-2)}`;
}

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
}

export function maskName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1)}***`)
    .join(" ");
}

export function yearMonth(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(period: string): { start: number; end: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { start: Date.UTC(year, month - 1, 1), end: Date.UTC(year, month, 1) };
}

/** Commission is only ever computed from money actually received. Rounded to whole currency units. */
export function computeCommission(paymentAmount: number, percentage: number): number {
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) return 0;
  if (!Number.isFinite(percentage) || percentage <= 0) return 0;
  return Math.round((paymentAmount * percentage) / 100);
}
