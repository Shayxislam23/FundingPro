import { ClerkLoaded, ClerkProvider, useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { getClerkPublishableKey, tokenCache } from "../clerk";
import { registerAndSyncPushToken } from "../notifications";

type AuthSession = { userId: string };

type AuthContextValue = {
  session: AuthSession | null;
  user: ReturnType<typeof useUser>["user"];
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthContextBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut: clerkSignOut } = useClerkAuth();
  const { user } = useUser();

  const signOut = useCallback(async () => {
    await clerkSignOut();
  }, [clerkSignOut]);

  const refreshSession = useCallback(async () => {
    // Clerk keeps session in sync reactively; no manual refresh needed.
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void registerAndSyncPushToken();
  }, [isLoaded, isSignedIn]);

  const value = useMemo(
    () => ({
      session: isSignedIn && user ? { userId: user.id } : null,
      user: user ?? null,
      isLoading: !isLoaded,
      signOut,
      refreshSession,
    }),
    [isSignedIn, user, isLoaded, signOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = getClerkPublishableKey();

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthContextBridge>{children}</AuthContextBridge>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useIsAuthenticated() {
  const { session, isLoading } = useAuth();
  return { isAuthenticated: !!session, isLoading };
}
