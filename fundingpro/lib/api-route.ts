import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { applyCorsToResponse, handleCorsPreflight } from "@/lib/api-cors";
import {
  requireActiveUser,
  requireAdmin,
  type AuthUser,
} from "@/lib/auth-helpers";

type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};

type ActiveUserHandler = (
  req: NextRequest,
  user: AuthUser,
  ctx: RouteContext
) => Promise<NextResponse> | NextResponse;

type AdminHandler = ActiveUserHandler;

type PublicHandler = (
  req: NextRequest,
  ctx: RouteContext
) => Promise<NextResponse> | NextResponse;

function handleRouteError(err: unknown): NextResponse {
  if (err instanceof NextResponse) return err;
  if (
    err &&
    typeof err === "object" &&
    "status" in err &&
    typeof (err as NextResponse).json === "function"
  ) {
    return err as NextResponse;
  }
  console.error("API route error:", err);
  return apiError("Internal error", 500, "INTERNAL_ERROR");
}

export async function getRouteParam(
  ctx: RouteContext,
  key: string
): Promise<string | undefined> {
  const params = await ctx.params;
  const value = params[key];
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function withCors(
  handler: (req: NextRequest, ctx: RouteContext) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    const preflight = handleCorsPreflight(req);
    if (preflight) return preflight;

    const response = await handler(req, ctx);
    return applyCorsToResponse(req, response);
  };
}

export function withActiveUser(handler: ActiveUserHandler) {
  return withCors(async (req, ctx) => {
    try {
      const user = await requireActiveUser(req);
      return await handler(req, user, ctx);
    } catch (err) {
      return handleRouteError(err);
    }
  });
}

export function withAdmin(handler: AdminHandler) {
  return withCors(async (req, ctx) => {
    try {
      const user = await requireAdmin(req);
      return await handler(req, user, ctx);
    } catch (err) {
      return handleRouteError(err);
    }
  });
}

export function withPublic(handler: PublicHandler) {
  return withCors(async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return handleRouteError(err);
    }
  });
}

/** Public route wrapper for legacy or provider-specific payment webhooks. */
export function withPaymentWebhook(handler: PublicHandler) {
  return withPublic(handler);
}
