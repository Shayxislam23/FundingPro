import { useClerk } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  isValidAuthCallbackUrl,
  parseSubscriptionReturnUrl,
} from "./callback-validation";

/** Handle Clerk auth + payment return deep links (custom scheme and App Links). */
export function useAuthDeepLink() {
  const clerk = useClerk();
  const router = useRouter();

  useEffect(() => {
    async function handleUrl(url: string) {
      const paymentReturn = parseSubscriptionReturnUrl(url);
      if (paymentReturn) {
        router.replace({
          pathname: "/(app)/subscription/return",
          params: { paymentId: paymentReturn.paymentId },
        });
        return;
      }

      if (!isValidAuthCallbackUrl(url)) return;

      try {
        if ("handleRedirectCallback" in clerk && typeof clerk.handleRedirectCallback === "function") {
          await clerk.handleRedirectCallback({ redirectUrl: url });
        }
      } catch {
        // Clerk may already have processed the session from token cache.
      }

      if (clerk.session) {
        router.replace("/(app)/(tabs)/home");
        return;
      }

      if (url.includes("reset") || url.includes("recovery")) {
        router.replace("/(auth)/reset-password");
        return;
      }

      router.replace("/(auth)/callback");
    }

    Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    const sub = Linking.addEventListener("url", ({ url }) => void handleUrl(url));
    return () => sub.remove();
  }, [clerk, router]);
}
