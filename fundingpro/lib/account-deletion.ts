import { apiSuccess, apiError } from "@/lib/api";
import type { AuthUser } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/auth-helpers";
import { requestAccountDeletion } from "@/lib/db/users";
import { NextResponse } from "next/server";

export async function handleAccountDeletionRequest(
  authUser: AuthUser
): Promise<NextResponse> {
  try {
    const result = await requestAccountDeletion(authUser.accessToken);

    await writeAuditLog({
      userId: authUser.userId,
      action: "account_deletion_requested",
      entityType: "user",
      entityId: authUser.userId,
      metadata: {
        requestedAt: result.requestedAt,
        clerkUserId: authUser.clerkUserId,
      },
    });

    return apiSuccess({
      ...result,
      message:
        "Account marked for deletion. Clerk identity and remaining data are purged automatically within 30 days per privacy policy.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to request account deletion";
    if (message.includes("already requested")) {
      return apiError("Account deletion already requested", 409, "DELETION_ALREADY_REQUESTED");
    }
    throw err;
  }
}
