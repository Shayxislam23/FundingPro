"use client";

import { useClerk } from "@clerk/nextjs";
import { isClerkPublishableConfigured } from "@/lib/auth/clerk-config";

type SignOut = () => Promise<void>;

function useClerkSignOut(): SignOut {
  const { signOut } = useClerk();
  return async () => {
    await signOut();
  };
}

/** Without Clerk keys there is no <ClerkProvider>, so useClerk() would throw. */
function useNoClerkSignOut(): SignOut {
  return async () => {};
}

/**
 * Sign-out that works whether or not Clerk is configured.
 * The choice is made once at module load, so the hook order never changes between renders.
 */
export const useSafeSignOut: () => SignOut = isClerkPublishableConfigured()
  ? useClerkSignOut
  : useNoClerkSignOut;
