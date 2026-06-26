import { Redirect, useLocalSearchParams } from "expo-router";

/** Deep link entry: fundingpro://subscription/return?paymentId=... */
export default function SubscriptionReturnDeepLink() {
  const params = useLocalSearchParams<{ paymentId?: string }>();
  if (!params.paymentId) {
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
