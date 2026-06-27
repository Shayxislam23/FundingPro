import { Redirect, useLocalSearchParams } from "expo-router";
import { isPlausiblePaymentId } from "../../lib/auth/callback-validation";

/** Deep link entry: fundingpro:// or https://www.fundingpro.uz/mobile/subscription/return?paymentId=... */
export default function SubscriptionReturnDeepLink() {
  const params = useLocalSearchParams<{ paymentId?: string }>();
  const paymentId = params.paymentId ?? "";
  if (!isPlausiblePaymentId(paymentId)) {
    return <Redirect href="/(app)/subscription" />;
  }
  return (
    <Redirect
      href={{
        pathname: "/(app)/subscription/return",
        params: { paymentId: params.paymentId },
      }}
    />
  );
}
