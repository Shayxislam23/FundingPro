/**
 * Parses and normalizes AI output for the admin "grant extract" tool.
 * The AI proposes a draft; the admin reviews every field before saving,
 * so normalization favors dropping suspicious values over failing.
 */

export type ExtractedGrantDraft = {
  title: string;
  titleRu: string | null;
  description: string | null;
  descriptionRu: string | null;
  donorName: string | null;
  sectors: string[];
  countryScope: string[];
  applicantTypes: string[];
  amountMin: number | null;
  amountMax: number | null;
  currency: string;
  deadline: string | null;
  sourceUrl: string | null;
  requirements: string[];
};

export type ExtractionResult =
  | { ok: true; draft: ExtractedGrantDraft }
  | { ok: false; error: string };

const APPLICANT_TYPES = new Set(["NGO", "Business", "Government", "Academic", "Individual"]);

function cleanString(value: unknown, maxLength = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanStringArray(value: unknown, maxItems = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item, 500))
    .filter((item): item is string => item !== null)
    .slice(0, maxItems);
}

function cleanAmount(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value.replace(/[\s,]/g, "")) : value;
  if (typeof num !== "number" || !Number.isFinite(num) || num < 0) return null;
  return num;
}

function cleanDeadline(value: unknown): string | null {
  const raw = cleanString(value, 40);
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function cleanUrl(value: unknown): string | null {
  const raw = cleanString(value, 500);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function stripCodeFences(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

export function parseExtractedGrant(content: string): ExtractionResult {
  let raw: unknown;
  try {
    raw = JSON.parse(stripCodeFences(content));
  } catch {
    return { ok: false, error: "invalid_json" };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "not_an_object" };
  }

  const data = raw as Record<string, unknown>;
  const title = cleanString(data.title, 300);
  if (!title) {
    return { ok: false, error: "missing_title" };
  }

  const currencyRaw = cleanString(data.currency, 10);
  const currency =
    currencyRaw && /^[A-Za-z]{3}$/.test(currencyRaw) ? currencyRaw.toUpperCase() : "USD";

  const amountMin = cleanAmount(data.amountMin);
  const amountMax = cleanAmount(data.amountMax);

  return {
    ok: true,
    draft: {
      title,
      titleRu: cleanString(data.titleRu, 300),
      description: cleanString(data.description),
      descriptionRu: cleanString(data.descriptionRu),
      donorName: cleanString(data.donorName, 200),
      sectors: cleanStringArray(data.sectors).map((s) => s.toLowerCase()),
      countryScope: cleanStringArray(data.countryScope),
      applicantTypes: cleanStringArray(data.applicantTypes).filter((t) =>
        APPLICANT_TYPES.has(t)
      ),
      amountMin,
      amountMax: amountMax !== null && amountMin !== null && amountMax < amountMin ? null : amountMax,
      currency,
      deadline: cleanDeadline(data.deadline),
      sourceUrl: cleanUrl(data.sourceUrl),
      requirements: cleanStringArray(data.requirements, 15),
    },
  };
}
