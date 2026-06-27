import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { applyApiRateLimit } from "@/lib/api-rate-limit";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
]);

const isAuthRoute = createRouteMatcher(["/auth(.*)"]);

const isRateLimitedApiRoute = createRouteMatcher([
  "/api/v1/ai/(.*)",
  "/api/v1/auth/(.*)",
  "/api/v1/lead-magnet",
  "/api/v1/payments/payme",
  "/api/v1/payments/click/(.*)",
  "/api/v1/payments/uzum/(.*)",
  "/api/v1/payments/status",
  "/api/v1/payments/webhook",
]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

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
    "/dashboard",
    "/admin",
    "/auth",
    "/api/v1/ai/:path*",
    "/api/v1/auth/:path*",
    "/api/v1/payments/payme",
    "/api/v1/payments/click/:path*",
    "/api/v1/payments/uzum/:path*",
    "/api/v1/lead-magnet",
    "/api/v1/payments/status",
    "/api/v1/payments/webhook",
  ],
};
