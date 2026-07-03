import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Card } from "../ui/Card";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";
import { LAB_STEPS } from "./labSteps";

/** Compact Opportunities Lab progress card for the home tab — mirrors the web dashboard summary card. */
export function LabJourneySummaryCard() {
  const journeyQuery = useQuery({
    queryKey: queryKeys.labJourney,
    queryFn: () => api.labJourney(),
  });

  if (!journeyQuery.data) return null;
  const journey = journeyQuery.data;
  const nextMeta = LAB_STEPS.find((s) => s.id === journey.nextStepId);

  return (
    <Link href="/(app)/lab" asChild>
      <Pressable>
        <Card className="mt-4 border-funding-green/20">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-xl bg-funding-light-green items-center justify-center">
                <Ionicons name="school-outline" size={18} color="#008A2E" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-funding-black">Opportunities Lab</Text>
                <Text className="text-xs text-gray-500" numberOfLines={1}>
                  {nextMeta ? `Далее: ${nextMeta.label.toLowerCase()}` : "Все шаги выполнены"}
                </Text>
              </View>
            </View>
            <Text className="text-sm font-bold text-funding-green">{journey.progressPercent}%</Text>
          </View>
          <View className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-3">
            <View className="h-full rounded-full bg-funding-green" style={{ width: `${journey.progressPercent}%` }} />
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
