/** Canonical web sign-in path (custom UI). */
export const SIGN_IN_PATH = "/sign-in";

export const SIGN_UP_PATH = "/sign-up";

const AUTH_PATH_PREFIXES = ["/sign-in", "/sign-up", "/auth"];

const SAFE_ORIGIN = "https://safe.invalid";

/**
 * Allow only same-origin relative paths (open-redirect safe).
 * Returns null when the value is missing or unsafe.
 *
 * Rejects protocol-relative smuggling such as `/%0a//evil.example` which
 * becomes `/\n//evil` after query decoding and resolves off-site via `new URL`.
 */
export function safePostAuthPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let path = raw.trim();
  if (!path) return null;

  // Decode percent-encoding so %0a / %09 / %2f smuggling is visible to checks below.
  for (let i = 0; i < 2; i++) {
    if (!/%[0-9a-fA-F]{2}/.test(path)) break;
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    } catch {
      return null;
    }
  }

  // ASCII controls (CR/LF/TAB/…) enable "/\n//host" → https://host/
  if (/[\u0000-\u001f\u007f]/.test(path)) {
    return null;
  }

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)
  ) {
    return null;
  }

  // Belt-and-suspenders: refuse anything the URL parser would resolve off-origin.
  try {
    const resolved = new URL(path, SAFE_ORIGIN);
    if (resolved.origin !== SAFE_ORIGIN) return null;
    if (resolved.username || resolved.password) return null;
    path = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
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
