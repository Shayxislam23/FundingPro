import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text } from "react-native";
import { formatDeadlineDisplay } from "@fundingpro/shared";
import { Screen } from "../../../components/ui/Screen";
import { LoadingState, ErrorState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { queryKeys } from "../../../lib/query-keys";

export default function PublicGrantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const grantQuery = useQuery({
    queryKey: queryKeys.grant(id),
    queryFn: () => api.grant(id),
    enabled: !!id,
  });

  if (grantQuery.isLoading) return <LoadingState />;
  if (grantQuery.isError || !grantQuery.data) {
    return <ErrorState message={grantQuery.error?.message ?? "Не найдено"} />;
  }

  const grant = grantQuery.data;

  return (
    <Screen title="Грант" showBack>
      <ScrollView className="p-4">
        <Text className="text-xl font-bold text-funding-black">{grant.title_ru ?? grant.title}</Text>
        <Text className="text-sm text-gray-500 mt-2">Дедлайн: {formatDeadlineDisplay(grant.deadline)}</Text>
        {grant.description ? <Text className="text-base text-gray-700 mt-4">{grant.description}</Text> : null}
      </ScrollView>
    </Screen>
  );
}
