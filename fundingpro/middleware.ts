import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { applyApiRateLimit } from "@/lib/api-rate-limit";

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

const isAuthRoute = createRouteMatcher(["/auth(.*)", "/sign-up(.*)"]);

const isRateLimitedApiRoute = createRouteMatcher([
  "/api/v1/ai/(.*)",
  "/api/v1/auth/(.*)",
  "/api/v1/lead-magnet",
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

export default clerkMiddleware(async (auth, request) => {
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
    loginUrl.pathname = "/auth";
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
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/sign-up/:path*",
    "/dashboard",
    "/admin",
    "/auth",
    "/sign-up",
    "/api/v1/ai/:path*",
    "/api/v1/auth/:path*",
    "/api/v1/payments/payme",
    "/api/v1/payments/click/:path*",
    "/api/v1/payments/uzum/:path*",
    "/api/v1/lead-magnet",
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
