"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#428238",
          borderRadius: "0.75rem",
        },
        elements: {
          formButtonPrimary:
            "bg-[#428238] hover:bg-[#4f9a45] text-sm normal-case",
        },
      }}
    >
      <ConvexProviderWithClerk
        client={convex}
        // Clerk v5 vs convex/react-clerk type mismatch — runtime compatible
        useAuth={useAuth as unknown as Parameters<typeof ConvexProviderWithClerk>[0]["useAuth"]}
      >
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
