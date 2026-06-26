import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export type InternalUser = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  isNew: boolean;
};

type EnsureUserParams = {
  email: string | null;
  emailVerified?: boolean;
  provider?: string;
};

export async function ensureInternalUser(
  params: EnsureUserParams,
  authToken: string
): Promise<InternalUser> {
  return convexMutation(
    api.users.ensureInternal,
    {
      email: params.email,
      emailVerified: params.emailVerified,
      provider: params.provider ?? "clerk",
    },
    authToken
  );
}

export async function getUserOrganization(authToken: string) {
  const { getUserOrganizationDetails } = await import("@/lib/db/organizations");
  return getUserOrganizationDetails(authToken);
}

export async function getUserSubscription(accessToken: string) {
  return convexQuery(api.users.getSubscription, {}, accessToken);
}
