import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { formatDeadlineDisplay } from "@fundingpro/shared";
import { Screen } from "../../../components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { queryKeys } from "../../../lib/query-keys";
import { loadGrantsCache, saveGrantsCache } from "../../../lib/offline/grants-cache";
import type { GrantListItem } from "@fundingpro/api-types";

export default function PublicGrantsScreen() {
  const grantsQuery = useQuery({
    queryKey: queryKeys.grants({ public: true }),
    queryFn: async () => {
      const data = await api.grants({ limit: 50 });
      await saveGrantsCache(data);
      return data;
    },
    placeholderData: () => undefined,
    initialData: undefined,
  });

  if (grantsQuery.isLoading && !grantsQuery.data) {
    void loadGrantsCache().then((cached: Awaited<ReturnType<typeof loadGrantsCache>>) => {
      if (cached && !grantsQuery.data) grantsQuery.refetch();
    });
    return <LoadingState />;
  }

  if (grantsQuery.isError) {
    return <ErrorState message={grantsQuery.error.message} onRetry={() => grantsQuery.refetch()} />;
  }

  const grants = grantsQuery.data?.grants ?? [];

  return (
    <Screen title="Публичные гранты">
      <FlashList<GrantListItem>
        data={grants}
        refreshControl={<RefreshControl refreshing={grantsQuery.isRefetching} onRefresh={() => grantsQuery.refetch()} />}
        ListEmptyComponent={<EmptyState message="Гранты не найдены" />}
        renderItem={({ item }) => (
          <Link href={`/(public)/grants/${item.id}` as never} asChild>
            <Pressable className="mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4">
              <Text className="font-semibold text-funding-black">{item.title_ru ?? item.title}</Text>
              <Text className="text-sm text-gray-500 mt-1">Дедлайн: {formatDeadlineDisplay(item.deadline)}</Text>
            </Pressable>
          </Link>
        )}
      />
    </Screen>
  );
}
