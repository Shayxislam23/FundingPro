export function formatGrantAmount(
  min: number | null | undefined,
  max: number | null | undefined
): string | undefined {
  if (min == null && max == null) return undefined;
  if (max != null && min != null && min !== max) {
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  }
  if (max != null) return `до $${max.toLocaleString()}`;
  if (min != null) return `от $${min.toLocaleString()}`;
  return undefined;
}

export function formatDeadlineDate(deadline: string | null | undefined): string | undefined {
  if (!deadline) return undefined;
  const date = parseDeadlineDate(deadline);
  if (!date) return undefined;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

/** Parse YYYY-MM-DD or ISO timestamp as local calendar date. */
export function parseDeadlineDate(deadline: string | null | undefined): Date | null {
  if (!deadline) return null;
  const dateOnly = deadline.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (match) {
    const [, y, m, d] = match;
    const local = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const parsed = new Date(deadline);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function todayDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** True when deadline calendar day is before today (local timezone). */
export function isDeadlineExpired(deadline: string | null | undefined): boolean {
  const date = parseDeadlineDate(deadline);
  if (!date) return false;
  return date.getTime() < todayDateOnly().getTime();
}

export function formatDeadlineDisplay(deadline: string | null | undefined): string {
  if (!deadline) return "—";
  return (
    formatDeadlineDate(deadline) ??
    new Date(deadline).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  );
}

export function daysUntilDeadline(deadline: string | null | undefined): number | null {
  const date = parseDeadlineDate(deadline);
  if (!date) return null;
  const diff = date.getTime() - todayDateOnly().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export type DeadlineUrgency = "urgent" | "soon" | "normal";

export function getDeadlineUrgency(deadline: string | null | undefined): DeadlineUrgency | null {
  const days = daysUntilDeadline(deadline);
  if (days == null) return null;
  if (days < 0) return null;
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "normal";
}
