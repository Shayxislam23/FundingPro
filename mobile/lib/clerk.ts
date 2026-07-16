import type { TokenCache } from "@clerk/expo";
import { getClerkInstance } from "@clerk/expo";
import { chunkedSecureStoreAdapter } from "./secure-store-adapter";

export const tokenCache: TokenCache = {
  async getToken(key) {
    return chunkedSecureStoreAdapter.getItem(key);
  },
  async saveToken(key, value) {
    await chunkedSecureStoreAdapter.setItem(key, value);
  },
  async clearToken(key) {
    await chunkedSecureStoreAdapter.removeItem(key);
  },
};

export function getClerkPublishableKey(): string {
  return process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
}

/** Convex JWT for REST API Bearer auth (matches web client-auth.ts). */
export async function getAccessToken(): Promise<string | null> {
  try {
    const clerk = getClerkInstance();
    if (!clerk.session) return null;
    return clerk.session.getToken({ template: "convex" });
  } catch {
    return null;
  }
}
