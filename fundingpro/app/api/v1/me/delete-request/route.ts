export const dynamic = "force-dynamic";
import { withActiveUser } from "@/lib/api-route";
import { handleAccountDeletionRequest } from "@/lib/account-deletion";

export const POST = withActiveUser(async (_req, authUser) => handleAccountDeletionRequest(authUser));

export const DELETE = withActiveUser(async (_req, authUser) => handleAccountDeletionRequest(authUser));
