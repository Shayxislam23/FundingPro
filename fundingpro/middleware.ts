import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { applyApiRateLimit } from "@/lib/api-rate-limit";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { safePostAuthPath } from "@/lib/auth/paths";

/** Hosts that serve the Partner API: https://api.fundingpro.uz/v1/* → /api/partner/v1/* */
const PARTNER_API_HOSTS = (process.env.PARTNER_API_HOSTS ?? "api.fundingpro.uz,sandbox-api.fundingpro.uz")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function isPartnerApiHost(host: string | null): boolean {
  if (!host) return false;
  return PARTNER_API_HOSTS.includes(host.split(":")[0].toLowerCase());
}

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
]);

const isAuthRoute = createRouteMatcher(["/auth(.*)", "/sign-in(.*)", "/sign-up(.*)"]);

const isRateLimitedApiRoute = createRouteMatcher([
  "/api/v1/ai/(.*)",
  "/api/v1/auth/(.*)",
  "/api/v1/lead-magnet",
  "/api/v1/service-requests",
  "/api/v1/lab/(.*)",
  "/api/v1/onboarding/lab-profile",
  "/api/v1/onboarding/tasks",
  "/api/v1/payments/payme",
  "/api/v1/payments/click/(.*)",
  "/api/v1/payments/uzum/(.*)",
  "/api/v1/payments/status",
  "/api/v1/payments/webhook",
  "/api/v1/grants",
  "/api/v1/grants/(.*)",
  "/api/v1/donors",
]);

function isProtectedPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/admin" || pathname.startsWith("/admin/");
}

function isRateLimitedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/v1/ai/") ||
    pathname.startsWith("/api/v1/auth/") ||
    pathname === "/api/v1/lead-magnet" ||
    pathname.startsWith("/api/v1/lab/") ||
    pathname === "/api/v1/onboarding/lab-profile" ||
    pathname === "/api/v1/onboarding/tasks" ||
    pathname === "/api/v1/payments/payme" ||
    pathname.startsWith("/api/v1/payments/click/") ||
    pathname.startsWith("/api/v1/payments/uzum/") ||
    pathname === "/api/v1/payments/status" ||
    pathname === "/api/v1/payments/webhook"
  );
}

/** Dev-friendly path when Clerk keys are still placeholders — avoids middleware 500. */
async function unconfiguredMiddleware(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (isRateLimitedPath(pathname)) {
    const limited = await applyApiRateLimit(request as Parameters<typeof applyApiRateLimit>[0]);
    if (limited) return limited;
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    const loginUrl = new URL("/sign-in", url.origin);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

const configuredMiddleware = clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  if (isPartnerApiHost(request.headers.get("host"))) {
    if (pathname === "/v1" || pathname.startsWith("/v1/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/api/partner${pathname}`;
      return NextResponse.rewrite(url);
    }
    if (pathname.startsWith("/api/partner/v1/")) return NextResponse.next();
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Not found. Partner API lives under /v1" } },
      { status: 404 }
    );
  }

  if (isRateLimitedApiRoute(request)) {
    const limited = await applyApiRateLimit(request);
    if (limited) return limited;
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const { userId, sessionClaims } = await auth();

  if (isProtectedRoute(request) && !userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/sign-in";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && userId) {
    const email = (sessionClaims?.email as string | undefined) ?? null;
    const { canAccessAdminMiddleware } = await import("@/lib/auth/admin-access-edge");
    if (!(await canAccessAdminMiddleware(userId, email))) {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = "/dashboard";
      dashUrl.search = "";
      return NextResponse.redirect(dashUrl);
    }
  }

  if (isAuthRoute(request) && userId) {
    const requested =
      request.nextUrl.searchParams.get("next") ??
      request.nextUrl.searchParams.get("redirect");
    const dest = safePostAuthPath(requested) ?? "/dashboard";
    return NextResponse.redirect(new URL(dest, request.nextUrl.origin));
  }

  return NextResponse.next();
});

export default isClerkConfigured() ? configuredMiddleware : unconfiguredMiddleware;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/dashboard",
    "/admin",
    "/auth",
    "/sign-in",
    "/sign-up",
    "/api/v1/ai/:path*",
    "/api/v1/auth/:path*",
    "/api/v1/payments/payme",
    "/api/v1/payments/click/:path*",
    "/api/v1/payments/uzum/:path*",
    "/api/v1/lead-magnet",
    "/api/v1/service-requests",
    "/api/v1/lab/:path*",
    "/api/v1/onboarding/lab-profile",
    "/api/v1/onboarding/tasks",
    "/api/v1/payments/status",
    "/api/v1/payments/webhook",
    "/api/v1/grants",
    "/api/v1/grants/:path*",
    "/api/v1/donors",
    "/v1/:path*",
    "/v1",
  ],
};
