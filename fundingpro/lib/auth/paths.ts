/** Canonical web sign-in path (custom UI). */
export const SIGN_IN_PATH = "/sign-in";

export const SIGN_UP_PATH = "/sign-up";

export function signInUrl(redirectTo?: string): string {
  if (!redirectTo) return SIGN_IN_PATH;
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(redirectTo)}`;
}
