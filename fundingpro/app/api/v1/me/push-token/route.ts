export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { ensureInternalUser } from "@/lib/db/users";
import { registerPushToken, type PushPlatform } from "@/lib/db/push-tokens";

const ALLOWED_PLATFORMS = new Set<PushPlatform>(["ios", "android"]);

function isPushPlatform(value: unknown): value is PushPlatform {
  return typeof value === "string" && ALLOWED_PLATFORMS.has(value as PushPlatform);
}

export const POST = withActiveUser(async (req, authUser) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400, "INVALID_JSON");
  }

  if (!body || typeof body !== "object") {
    return apiError("Request body must be an object", 400, "INVALID_BODY");
  }

  const { token, platform } = body as { token?: unknown; platform?: unknown };

  if (typeof token !== "string" || !token.trim()) {
    return apiError("token is required", 400, "MISSING_TOKEN");
  }
  if (token.length > 512) {
    return apiError("token is too long (max 512)", 400, "TOKEN_TOO_LONG");
  }
  if (!isPushPlatform(platform)) {
    return apiError("platform must be ios or android", 400, "INVALID_PLATFORM");
  }

  await ensureInternalUser(
    {
      email: authUser.email,
      provider: "clerk",
    },
    authUser.accessToken
  );

  const result = await registerPushToken(
    {
      token: token.trim(),
      platform,
    },
    authUser.accessToken
  );

  return apiSuccess(result, 201);
});
