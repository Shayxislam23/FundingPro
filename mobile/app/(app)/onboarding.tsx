import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { t } from "../../lib/i18n";
import { Pressable, ScrollView, Text, View } from "react-native";
import { getNextOnboardingStep, ONBOARDING_STEPS } from "../../components/onboarding/steps";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

export default function OnboardingWizard() {
  const onboardingQuery = useQuery({
    queryKey: queryKeys.onboarding,
    queryFn: () => api.onboardingStatus(),
  });

  if (onboardingQuery.isLoading) return <LoadingState />;
  if (onboardingQuery.isError) return <ErrorState message={onboardingQuery.error.message} />;

  const status = onboardingQuery.data;
  if (!status) return <LoadingState />;

  if (status.isComplete) {
    return (
      <Screen title="Мой путь" showBack>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-black text-funding-black text-center">Готово!</Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            Вы выполнили все шаги. Можно переходить к поиску грантов и заявкам.
          </Text>
          <Button title="На главную" className="mt-6 w-full" onPress={() => router.replace("/(app)/(tabs)/home")} />
        </View>
      </Screen>
    );
  }

  const nextStep = getNextOnboardingStep(status.steps);
  const currentIndex = nextStep ? ONBOARDING_STEPS.findIndex((step) => step.id === nextStep.id) : 0;
  const percent = Math.round((status.completedCount / status.totalSteps) * 100);

  return (
    <Screen title="Мой путь" showBack>
      <ScrollView className="flex-1 px-4 py-4">
        <Text className="text-sm text-gray-500">
          Шаг {currentIndex + 1} из {status.totalSteps}
        </Text>
        <Text className="text-2xl font-black text-funding-black mt-1">{nextStep?.label}</Text>
        <Text className="text-sm text-gray-600 mt-2">{nextStep?.description}</Text>

        <View className="mt-4 h-2 rounded-full bg-gray-200 overflow-hidden">
          <View className="h-full bg-funding-green rounded-full" style={{ width: `${percent}%` }} />
        </View>
        <Text className="text-xs text-gray-500 mt-2">{status.completedCount}/{status.totalSteps} выполнено · {percent}%</Text>

        {nextStep ? (
          <Button
            title={t.goToStep}
            className="mt-6"
            onPress={() => router.push(nextStep.href as never)}
          />
        ) : null}

        <Text className="text-sm font-semibold text-funding-black mt-8 mb-3">Все шаги</Text>
        <View className="gap-2">
          {ONBOARDING_STEPS.map((step, index) => {
            const done = status.steps[step.id];
            const isCurrent = nextStep?.id === step.id;
            return (
              <Link key={step.id} href={step.href as never} asChild>
                <Pressable>
                  <Card
                    className={`${isCurrent ? "border-funding-green/40 bg-green-50" : ""} ${done ? "opacity-70" : ""}`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`h-7 w-7 rounded-full items-center justify-center ${
                          done ? "bg-funding-green" : isCurrent ? "bg-funding-green/15" : "bg-gray-100"
                        }`}
                      >
                        <Text className={`text-xs font-bold ${done || isCurrent ? "text-funding-green" : "text-gray-500"}`}>
                          {done ? "✓" : index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className={`text-sm ${done ? "text-gray-500 line-through" : "text-funding-black font-medium"}`}>
                          {step.label}
                        </Text>
                        {!done ? <Text className="text-xs text-gray-500 mt-0.5">{step.description}</Text> : null}
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <Button
          title="Обновить прогресс"
          variant="ghost"
          className="mt-4"
          loading={onboardingQuery.isRefetching}
          onPress={() => void onboardingQuery.refetch()}
        />
      </ScrollView>
    </Screen>
  );
}
