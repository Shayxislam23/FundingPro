import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference, FunctionReturnType } from "convex/server";
import { api, internal } from "../convex/_generated/api";

type AdminConvexClient = ConvexHttpClient & {
  setAdminAuth: (deployKey: string) => void;
};

let adminClient: AdminConvexClient | null = null;

function getUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return url;
}

/** Admin client for internal Convex functions (webhooks, audit). Requires CONVEX_DEPLOY_KEY. */
export function getConvexAdmin(): AdminConvexClient {
  if (!adminClient) {
    adminClient = new ConvexHttpClient(getUrl()) as AdminConvexClient;
    const deployKey = process.env.CONVEX_DEPLOY_KEY;
    if (deployKey) {
      adminClient.setAdminAuth(deployKey);
    }
  }
  return adminClient;
}

export function getConvexClient(authToken: string): ConvexHttpClient {
  const client = new ConvexHttpClient(getUrl());
  client.setAuth(authToken);
  return client;
}

/** Public read-only Convex queries (grant catalog, plans, etc.). */
export async function convexPublicQuery<Ref extends FunctionReference<"query">>(
  ref: Ref,
  args: Ref["_args"]
): Promise<FunctionReturnType<Ref>> {
  const client = new ConvexHttpClient(getUrl());
  return (await client.query(ref, args as never)) as FunctionReturnType<Ref>;
}

/** Authenticated Convex query — requires a Clerk/Convex JWT. */
export async function convexQuery<Ref extends FunctionReference<"query">>(
  ref: Ref,
  args: Ref["_args"],
  authToken: string
): Promise<FunctionReturnType<Ref>> {
  if (!authToken) {
    throw new Error("Authentication required for Convex query");
  }
  const client = getConvexClient(authToken);
  return (await client.query(ref, args as never)) as FunctionReturnType<Ref>;
}

/** Authenticated Convex mutation — requires a Clerk/Convex JWT. */
export async function convexMutation<Ref extends FunctionReference<"mutation">>(
  ref: Ref,
  args: Ref["_args"],
  authToken: string
): Promise<FunctionReturnType<Ref>> {
  if (!authToken) {
    throw new Error("Authentication required for Convex mutation");
  }
  const client = getConvexClient(authToken);
  return (await client.mutation(ref, args as never)) as FunctionReturnType<Ref>;
}

/** Internal Convex query — server/webhook only (admin deploy key). */
export async function convexInternalQuery<Ref extends FunctionReference<"query", "internal">>(
  ref: Ref,
  args: Ref["_args"]
): Promise<FunctionReturnType<Ref>> {
  const client = getConvexAdmin();
  return (await client.query(ref as unknown as FunctionReference<"query">, args as never)) as FunctionReturnType<Ref>;
}

/** Internal Convex mutation — server/webhook only (admin deploy key). */
export async function convexInternalMutation<
  Ref extends FunctionReference<"mutation", "internal">,
>(ref: Ref, args: Ref["_args"]): Promise<FunctionReturnType<Ref>> {
  const client = getConvexAdmin();
  return (await client.mutation(ref as unknown as FunctionReference<"mutation">, args as never)) as FunctionReturnType<Ref>;
}

/** System Convex action — server/webhook only (CONVEX_SYSTEM_SECRET). */
export async function convexSystemAction<Ref extends FunctionReference<"action">>(
  ref: Ref,
  args: Omit<Ref["_args"], "systemSecret">
): Promise<FunctionReturnType<Ref>> {
  const secret = process.env.CONVEX_SYSTEM_SECRET;
  if (!secret) {
    throw new Error("CONVEX_SYSTEM_SECRET is not set");
  }
  const client = new ConvexHttpClient(getUrl());
  return (await client.action(ref, { ...args, systemSecret: secret } as Ref["_args"])) as FunctionReturnType<Ref>;
}

export { api, internal };
