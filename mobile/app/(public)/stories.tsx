import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

export default function StoriesScreen() {
  const storiesQuery = useQuery({
    queryKey: queryKeys.stories,
    queryFn: () => api.stories(),
  });

  if (storiesQuery.isLoading) {
    return <LoadingState />;
  }

  if (storiesQuery.isError) {
    return (
      <ErrorState message={storiesQuery.error.message} onRetry={() => storiesQuery.refetch()} />
    );
  }

  const stories = storiesQuery.data?.stories ?? [];

  return (
    <Screen title="Истории успеха" showBack>
      <ScrollView
        className="p-4 gap-3"
        refreshControl={
          <RefreshControl refreshing={storiesQuery.isRefetching} onRefresh={() => storiesQuery.refetch()} />
        }
      >
        {stories.length === 0 ? (
          <EmptyState message="Истории пока не опубликованы" />
        ) : (
          stories.map((s) => (
            <Card key={s.id}>
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="font-bold text-funding-black">{s.org}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {s.sector} · {s.city}
                  </Text>
                </View>
                {s.status === "pilot" && (
                  <Text className="text-[10px] uppercase font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                    Пилот
                  </Text>
                )}
              </View>
              <Text className="text-sm text-gray-600 mt-2">{s.summary}</Text>
              <Text className="text-xs font-medium text-funding-green mt-3">{s.outcome}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
