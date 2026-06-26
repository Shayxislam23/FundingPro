export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";

export const POST = withActiveUser(async (_req, authUser) => {
  const internal = await ensureInternalUser(
    {
      email: authUser.email,
      emailVerified: true,
      provider: "clerk",
    },
    authUser.accessToken
  );

  await writeAuditLog({
    userId: internal.id,
    action: "auth_login",
    entityType: "user",
    entityId: internal.id,
    metadata: { method: "email_otp", isNew: internal.isNew },
  });

  return apiSuccess({ userId: internal.id, isNew: internal.isNew });
});
