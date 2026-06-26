import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
]);

const isAuthRoute = createRouteMatcher(["/auth(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

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
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/:path*", "/dashboard", "/admin", "/auth"],
};
