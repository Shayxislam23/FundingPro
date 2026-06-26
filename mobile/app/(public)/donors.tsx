import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

export default function DonorsScreen() {
  const donorsQuery = useQuery({
    queryKey: queryKeys.donors,
    queryFn: () => api.donors(),
  });

  if (donorsQuery.isLoading) {
    return <LoadingState />;
  }

  if (donorsQuery.isError) {
    return (
      <ErrorState message={donorsQuery.error.message} onRetry={() => donorsQuery.refetch()} />
    );
  }

  const donors = donorsQuery.data?.donors ?? [];

  return (
    <Screen title="Доноры" showBack>
      <ScrollView
        className="p-4 gap-3"
        refreshControl={
          <RefreshControl refreshing={donorsQuery.isRefetching} onRefresh={() => donorsQuery.refetch()} />
        }
      >
        {donors.length === 0 ? (
          <EmptyState message="Доноры не найдены" />
        ) : (
          donors.map((d) => (
            <Card key={d.id}>
              <Text className="font-bold text-funding-black">{d.name_ru ?? d.name}</Text>
              {d.name_ru && d.name !== d.name_ru && (
                <Text className="text-xs text-gray-400 mt-0.5">{d.name}</Text>
              )}
              {d.description ? (
                <Text className="text-sm text-gray-600 mt-1">{d.description}</Text>
              ) : d.country ? (
                <Text className="text-sm text-gray-600 mt-1">{d.country}</Text>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
