import type { OnboardingStepId } from "@fundingpro/api-types";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Card } from "../ui/Card";
import { getNextOnboardingStep, ONBOARDING_STEPS } from "./steps";

type OnboardingChecklistProps = {
  steps: Record<OnboardingStepId, boolean>;
  completedCount: number;
  totalSteps: number;
};

function StepIcon({ done }: { done: boolean }) {
  return (
    <View
      className={`h-5 w-5 rounded-full border items-center justify-center ${
        done ? "bg-funding-green border-funding-green" : "border-clay-inset"
      }`}
    >
      {done ? <Text className="text-white text-xs font-bold">✓</Text> : null}
    </View>
  );
}

export function OnboardingChecklist({ steps, completedCount, totalSteps }: OnboardingChecklistProps) {
  if (completedCount >= totalSteps) return null;

  const nextStep = getNextOnboardingStep(steps);
  const percent = Math.round((completedCount / totalSteps) * 100);

  return (
    <Card className="mt-4 border-funding-green/30 bg-green-50">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="font-semibold text-funding-black">Первые шаги в FundingPro</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {completedCount}/{totalSteps} выполнено
            {nextStep ? ` · далее: ${nextStep.label.toLowerCase()}` : ""}
          </Text>
        </View>
        <View className="rounded-full border border-funding-green/20 bg-clay-surface px-2.5 py-1">
          <Text className="text-xs font-bold text-funding-green">{percent}%</Text>
        </View>
      </View>

      <View className="gap-2">
        {ONBOARDING_STEPS.map((step) => {
          const done = steps[step.id];
          return (
            <Link key={step.id} href={step.href as never} asChild>
              <Pressable
                className={`flex-row items-center gap-3 rounded-xl border p-3 ${
                  done ? "border-clay-inset/60 bg-clay-surface/60 opacity-70" : "border-funding-green/30 bg-clay-surface"
                }`}
              >
                <StepIcon done={done} />
                <Text
                  className={`flex-1 text-sm ${done ? "text-gray-500 line-through" : "text-funding-black font-medium"}`}
                >
                  {step.label}
                </Text>
                {!done ? <Text className="text-gray-400 text-sm">›</Text> : null}
              </Pressable>
            </Link>
          );
        })}
      </View>

      <Link href="/(app)/onboarding" asChild>
        <Pressable className="mt-3">
          <Text className="text-funding-green font-semibold text-sm text-center">Пройти по шагам →</Text>
        </Pressable>
      </Link>
    </Card>
  );
}
