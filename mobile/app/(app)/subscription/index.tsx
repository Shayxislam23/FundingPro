import { useMutation, useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { PaymentProviderId, Plan } from "@fundingpro/api-types";
import { PaymentConsentCheckbox } from "../../../components/legal/ReconsentBanner";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Screen } from "../../../components/ui/Screen";
import { LoadingState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { queryKeys } from "../../../lib/query-keys";

const PROVIDER_LABELS: Record<PaymentProviderId, string> = {
  uzum: "Uzum Bank",
  payme: "Payme",
  click: "Click",
};

export default function SubscriptionScreen() {
  const [acceptPayment, setAcceptPayment] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderId>("uzum");

  const plansQuery = useQuery({ queryKey: queryKeys.plans, queryFn: () => api.plans() });
  const usageQuery = useQuery({ queryKey: queryKeys.planUsage, queryFn: () => api.planUsage() });
  const payConfigQuery = useQuery({ queryKey: queryKeys.paymentStatus, queryFn: () => api.paymentStatus() });

  const enabledProviders =
    payConfigQuery.data?.providers?.filter((p) => p.enabled && p.configured) ?? [];

  const requestMutation = useMutation({
    mutationFn: ({ planId, planName }: { planId: string; planName: string }) =>
      api.subscriptionRequest(planId, planName),
  });

  const payMutation = useMutation({
    mutationFn: async ({
      planId,
      provider,
      method,
    }: {
      planId: string;
      provider: PaymentProviderId;
      method: "app" | "checkout";
    }) => {
      if (!acceptPayment) throw new Error("Примите оферту и политику возвратов");
      const intent = await api.createPaymentIntent(planId, true, provider);

      if (provider === "uzum" && method === "app" && intent.uzumAppUrl) {
        await Linking.openURL(intent.uzumAppUrl);
        return;
      }
      if (provider === "payme" && intent.paymeCheckoutUrl) {
        await WebBrowser.openBrowserAsync(intent.paymeCheckoutUrl);
        return;
      }
      if (provider === "click" && intent.clickPayUrl) {
        await Linking.openURL(intent.clickPayUrl);
        return;
      }
      if (provider === "uzum" && method === "checkout") {
        const checkout = await api.startCheckout(intent.paymentId, "uzum");
        await WebBrowser.openBrowserAsync(checkout.redirectUrl);
        return;
      }
      throw new Error("Способ оплаты недоступен для выбранного провайдера");
    },
    onError: (e: Error) => setPayError(e.message),
  });

  if (plansQuery.isLoading) return <LoadingState />;

  const paymentsOn = payConfigQuery.data?.paymentsEnabled ?? false;
  const plans = plansQuery.data?.plans ?? [];
  const activeProvider =
    enabledProviders.find((p) => p.id === selectedProvider)?.id ??
    enabledProviders[0]?.id ??
    selectedProvider;

  return (
    <Screen title="Подписка" showBack>
      <ScrollView className="p-4">
        {usageQuery.data?.planName && (
          <Card className="mb-4">
            <Text className="text-xs text-gray-400">Текущий тариф</Text>
            <Text className="text-lg font-bold text-funding-black">{usageQuery.data.planName}</Text>
          </Card>
        )}

        {!paymentsOn && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <Text className="text-amber-800 text-sm">
              {payConfigQuery.data?.message ?? "Онлайн-оплата временно недоступна"}
            </Text>
          </Card>
        )}

        {paymentsOn && enabledProviders.length > 0 && (
          <View className="flex-row gap-2 mb-4">
            {enabledProviders.map((p) => (
              <Button
                key={p.id}
                title={PROVIDER_LABELS[p.id]}
                variant={activeProvider === p.id ? "primary" : "secondary"}
                className="flex-1"
                onPress={() => setSelectedProvider(p.id)}
              />
            ))}
          </View>
        )}

        <PaymentConsentCheckbox checked={acceptPayment} onChange={setAcceptPayment} />
        {payError && <Text className="text-red-600 text-sm mt-2">{payError}</Text>}

        {plans.map((plan: Plan) => (
          <Card key={plan.id} className={`mb-3 ${plan.highlighted ? "border-funding-green" : ""}`}>
            <Text className="font-bold text-funding-black">{plan.nameRu}</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {plan.priceUzs.toLocaleString("ru-RU")} сум / ${plan.priceUsd}
            </Text>
            {paymentsOn ? (
              <View className="flex-row gap-2 mt-3">
                {activeProvider === "uzum" && (
                  <>
                    <Button
                      title="Uzum App"
                      variant="secondary"
                      className="flex-1"
                      loading={payMutation.isPending}
                      onPress={() =>
                        payMutation.mutate({ planId: plan.id, provider: "uzum", method: "app" })
                      }
                    />
                    <Button
                      title="Карта"
                      className="flex-1"
                      loading={payMutation.isPending}
                      onPress={() =>
                        payMutation.mutate({ planId: plan.id, provider: "uzum", method: "checkout" })
                      }
                    />
                  </>
                )}
                {activeProvider === "payme" && (
                  <Button
                    title="Payme"
                    className="flex-1"
                    loading={payMutation.isPending}
                    onPress={() =>
                      payMutation.mutate({ planId: plan.id, provider: "payme", method: "checkout" })
                    }
                  />
                )}
                {activeProvider === "click" && (
                  <Button
                    title="Click"
                    className="flex-1"
                    loading={payMutation.isPending}
                    onPress={() =>
                      payMutation.mutate({ planId: plan.id, provider: "click", method: "app" })
                    }
                  />
                )}
              </View>
            ) : (
              <Button
                title="Запросить подключение"
                variant="secondary"
                className="mt-3"
                loading={requestMutation.isPending}
                onPress={() => requestMutation.mutate({ planId: plan.id, planName: plan.nameRu })}
              />
            )}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
