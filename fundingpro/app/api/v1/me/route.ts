export const dynamic = "force-dynamic";
import { apiSuccess } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog, isAdminUser } from "@/lib/auth-helpers";
import { getUserPlatformRole } from "@/lib/db/user-roles";
import { ensureInternalUser } from "@/lib/db/users";
import { getUserOrganizationDetails } from "@/lib/db/organizations";
import { getPaymentIntegrationStatus } from "@/lib/payments";
import { getUserSubscription } from "@/lib/db/users";
import { listSavedGrantIds } from "@/lib/db/saved-grants";

export const GET = withActiveUser(async (_req, authUser) => {
  const internalUser = await ensureInternalUser(
    {
      email: authUser.email,
      emailVerified: true,
      provider: "clerk",
    },
    authUser.accessToken
  );

  if (internalUser.isNew) {
    await writeAuditLog({
      userId: internalUser.id,
      action: "user_first_login",
      entityType: "user",
      entityId: internalUser.id,
    });
  }

  const [organization, subscription, savedGrantIds, platformRole, isAdmin] =
    await Promise.all([
      getUserOrganizationDetails(authUser.accessToken),
      getUserSubscription(authUser.accessToken),
      listSavedGrantIds(authUser.accessToken).catch(() => [] as string[]),
      getUserPlatformRole(authUser.accessToken),
      isAdminUser(authUser.accessToken, internalUser.email),
    ]);

  return apiSuccess({
    id: internalUser.id,
    email: internalUser.email,
    emailVerified: internalUser.emailVerified,
    isActive: internalUser.isActive,
    createdAt: internalUser.createdAt,
    platformRole,
    isAdmin,
    organization,
    subscription,
    savedGrantIds,
    paymentIntegrationStatus: getPaymentIntegrationStatus(),
    paymentPendingIntegration: true,
  });
});
