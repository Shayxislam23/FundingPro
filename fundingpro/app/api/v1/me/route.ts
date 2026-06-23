export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireActiveUserOrResponse, writeAuditLog } from "@/lib/auth-helpers";
import { ensureInternalUser } from "@/lib/db/users";
import { getUserOrganizationDetails } from "@/lib/db/organizations";
import { isLocalDatabaseEnabled } from "@/lib/pg-pool";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { getPaymentIntegrationStatus } from "@/lib/payments";
import { getUserSubscription } from "@/lib/db/users";
import { listSavedGrantIds } from "@/lib/db/saved-grants";

// GET /api/v1/me
export async function GET(req: NextRequest) {
  const authUser = await requireActiveUserOrResponse(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
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

      const [organization, subscription, savedGrantIds] = await Promise.all([
        getUserOrganizationDetails(internalUser.id),
        getUserSubscription(internalUser.id),
        listSavedGrantIds(internalUser.id).catch(() => [] as string[]),
      ]);

      return apiSuccess({
        id: internalUser.id,
        email: internalUser.email,
        emailVerified: internalUser.emailVerified,
        isActive: internalUser.isActive,
        createdAt: internalUser.createdAt,
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

    const [organization, subscription, savedGrantIds] = await Promise.all([
      getUserOrganizationDetails(internalUser.id),
      getUserSubscription(internalUser.id),
      listSavedGrantIds(internalUser.id).catch(() => [] as string[]),
    ]);

    return apiSuccess({
      id: internalUser.id,
      email: internalUser.email,
      emailVerified: internalUser.emailVerified,
      isActive: internalUser.isActive,
      createdAt: internalUser.createdAt,
      organization,
      subscription,
      savedGrantIds,
      paymentIntegrationStatus: getPaymentIntegrationStatus(),
      paymentPendingIntegration: true,
    });
  } catch (err) {
    console.error("GET /me error:", err);
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
