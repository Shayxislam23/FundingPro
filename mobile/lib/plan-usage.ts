/** Shared plan limit helpers for mobile screens */
export function formatPlanLimit(used: number | undefined, max: number | null | undefined): string {
  const count = used ?? 0;
  if (max === null || max === undefined) return `${count} · без лимита`;
  return `${count}/${max}`;
}

export function isPlanLimitReached(used: number | undefined, max: number | null | undefined): boolean {
  if (max === null || max === undefined) return false;
  return (used ?? 0) >= max;
}
