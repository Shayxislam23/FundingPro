/**
 * Server-side analytics hook for API routes (no browser Plausible/PostHog).
 * Logs in all envs; wire to PostHog capture API later if needed.
 */

export function trackServerEvent(
  event: string,
  props?: Record<string, string | number | boolean | null | undefined>
): void {
  const payload = Object.fromEntries(
    Object.entries(props ?? {}).filter(([, v]) => v !== undefined && v !== null)
  );
  console.info("[analytics]", event, payload);
}
