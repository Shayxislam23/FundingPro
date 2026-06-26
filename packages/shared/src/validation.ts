export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}

export function sanitizeLikePattern(value: string, maxLength = 120): string {
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/[\\%_]/g, (match) => `\\${match}`)
    .replace(/[\r\n]/g, " ");
}

export function sanitizeStorageFileName(fileName: string, maxLength = 160): string {
  const normalized = fileName.normalize("NFKC").split(/[\\/]/).pop() ?? "document";
  const safe = normalized.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, maxLength);
  return safe && safe !== "." && safe !== ".." ? safe : "document";
}
