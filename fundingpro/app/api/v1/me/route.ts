export const dynamic = "force-dynamic";
import { apiSuccess, apiError } from "@/lib/api";
import { withActiveUser } from "@/lib/api-route";
import { writeAuditLog, isAdminUser } from "@/lib/auth-helpers";
import { getUserPlatformRole } from "@/lib/db/user-roles";
import { ensureInternalUser } from "@/lib/db/users";
import { getUserOrganizationDetails } from "@/lib/db/organizations";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getPaymentIntegrationStatus } from "@/lib/payments";
import { getUserSubscription } from "@/lib/db/users";
import { listSavedGrantIds } from "@/lib/db/saved-grants";

export const GET = withActiveUser(async (_req, authUser) => {
  if (isLocalDatabaseEnabled()) {
    const internalUser = await ensureInternalUser({
      supabaseId: authUser.supabaseId,
      email: authUser.email,
      emailVerified: true,
      provider: "local_dev",
    });

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
        getUserOrganizationDetails(internalUser.id, authUser.accessToken),
        getUserSubscription(internalUser.id),
        listSavedGrantIds(internalUser.id, authUser.accessToken).catch(() => [] as string[]),
        getUserPlatformRole(internalUser.id),
        isAdminUser(internalUser.id, internalUser.email),
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
  }

  const supabase = createSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.admin.getUserById(authUser.supabaseId);
  if (error || !user) return apiError("User not found", 404, "NOT_FOUND");

  const internalUser = await ensureInternalUser({
    supabaseId: user.id,
    email: user.email ?? null,
    emailVerified: !!user.email_confirmed_at,
    provider: "supabase_email",
  });

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
      getUserOrganizationDetails(internalUser.id, authUser.accessToken),
      getUserSubscription(internalUser.id),
      listSavedGrantIds(internalUser.id, authUser.accessToken).catch(() => [] as string[]),
      getUserPlatformRole(internalUser.id),
      isAdminUser(internalUser.id, internalUser.email),
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
