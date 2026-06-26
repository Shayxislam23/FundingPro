import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { DemoBanner } from "../../components/design/DemoBanner";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { withPlansFallback } from "../../lib/public-fallback";
import { queryKeys } from "../../lib/query-keys";

function formatPrice(usd: number, uzs: number, rate: number): string {
  if (usd === 0) return "Бесплатно";
  return `$${usd} · ~${Math.round(uzs || usd * rate).toLocaleString("ru-RU")} сум`;
}

export default function PricingScreen() {
  const plansQuery = useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => api.plans(),
  });

  if (plansQuery.isLoading && !plansQuery.data) {
    return <LoadingState />;
  }

  if (plansQuery.isError && !plansQuery.data) {
    return <ErrorState message={plansQuery.error.message} onRetry={() => plansQuery.refetch()} />;
  }

  const plansResult = withPlansFallback(plansQuery.data);
  const plans = plansResult.plans;
  const rate = plansResult.usdUzsRate ?? 12500;
  const fromFallback = plansResult.fromFallback;

  return (
    <Screen title="Тарифы" showBack largeTitle>
      <ScrollView
        className="px-5 pt-4"
        refreshControl={
          <RefreshControl refreshing={plansQuery.isRefetching} onRefresh={() => plansQuery.refetch()} />
        }
      >
        <Text className="text-sm text-gray-500 mb-4">
          Выберите план после регистрации. Полный доступ — в приложении.
        </Text>

        {fromFallback ? <DemoBanner className="mb-4" /> : null}

        {plans.length === 0 ? (
          <EmptyState
            icon="card-outline"
            title="Не удалось загрузить тарифы"
            description="Проверьте подключение и потяните вниз для обновления."
            action={
              <Button title="Повторить" variant="secondary" onPress={() => plansQuery.refetch()} />
            }
          />
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              className={`mb-4 shadow-card ${
                plan.highlighted
                  ? "border-2 border-funding-green bg-funding-light-green/40"
                  : "border border-gray-100"
              }`}
            >
              {plan.highlighted && (
                <Text className="text-overline font-bold text-funding-green uppercase mb-2">
                  Популярный
                </Text>
              )}
              <Text className="text-headline text-funding-black">{plan.nameRu ?? plan.name}</Text>
              <Text className="text-2xl font-black text-funding-green mt-2">
                {formatPrice(plan.priceUsd, plan.priceUzs, rate)}
              </Text>
              <View className="mt-4 gap-2.5">
                {plan.features.slice(0, 5).map((feature) => (
                  <View key={feature} className="flex-row items-start gap-2">
                    <Ionicons name="checkmark-circle" size={18} color="#008A2E" />
                    <Text className="text-sm text-gray-600 flex-1 leading-5">{feature}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))
        )}

        <Link href="/(auth)/login" asChild>
          <Button title="Войти для оформления" className="mt-4 mb-8" haptic />
        </Link>
      </ScrollView>
    </Screen>
  );
}
