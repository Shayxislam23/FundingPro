/** Canonical web sign-in path (custom UI). */
export const SIGN_IN_PATH = "/sign-in";

export const SIGN_UP_PATH = "/sign-up";

const AUTH_PATH_PREFIXES = ["/sign-in", "/sign-up", "/auth"];

/**
 * Allow only same-origin relative paths (open-redirect safe).
 * Returns null when the value is missing or unsafe.
 */
export function safePostAuthPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const path = raw.trim();

  // Relative paths only — never trust absolute URLs in ?next=
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)
  ) {
    return null;
  }

  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  if (AUTH_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return path;
}

export function signInUrl(redirectTo?: string): string {
  const safe = safePostAuthPath(redirectTo);
  if (!safe) return SIGN_IN_PATH;
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(safe)}`;
}

export function signUpUrl(redirectTo?: string): string {
  const safe = safePostAuthPath(redirectTo);
  if (!safe) return SIGN_UP_PATH;
  return `${SIGN_UP_PATH}?next=${encodeURIComponent(safe)}`;
}

/** Build sign-in/up link that keeps the current post-auth destination. */
export function authSwitchUrl(
  target: "sign-in" | "sign-up",
  redirectTo?: string | null
): string {
  return target === "sign-in" ? signInUrl(redirectTo ?? undefined) : signUpUrl(redirectTo ?? undefined);
}
