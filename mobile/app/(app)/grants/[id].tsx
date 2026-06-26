import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, Text } from "react-native";
import { formatDeadlineDisplay } from "@fundingpro/shared";
import { Button } from "../../../components/ui/Button";
import { Screen } from "../../../components/ui/Screen";
import { LoadingState, ErrorState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { queryKeys } from "../../../lib/query-keys";

export default function GrantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: () => api.me() });
  const grantQuery = useQuery({
    queryKey: queryKeys.grant(id),
    queryFn: () => api.grant(id),
    enabled: !!id,
  });

  const saved = meQuery.data?.savedGrantIds?.includes(id) ?? false;

  const saveMutation = useMutation({
    mutationFn: () => (saved ? api.unsaveGrant(id) : api.saveGrant(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  });

  const applyMutation = useMutation({
    mutationFn: () => api.createApplication(id),
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
        {grant.donor && (
          <Text className="text-sm text-gray-600 mt-1">
            Донор: {grant.donor.name_ru ?? grant.donor.name}
          </Text>
        )}
        {grant.description ? <Text className="text-base text-gray-700 mt-4">{grant.description}</Text> : null}

        <Button
          title={saved ? "Убрать из сохранённых" : "Сохранить"}
          variant="secondary"
          className="mt-6"
          loading={saveMutation.isPending}
          onPress={() => saveMutation.mutate()}
        />
        <Button
          title="Добавить в трекер"
          className="mt-3"
          loading={applyMutation.isPending}
          onPress={() => applyMutation.mutate()}
        />
        {applyMutation.isSuccess && (
          <Text className="text-funding-green mt-2 text-sm">Заявка добавлена в трекер</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
