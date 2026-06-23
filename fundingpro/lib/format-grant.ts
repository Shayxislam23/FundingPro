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
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export function daysUntilDeadline(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
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
