import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { formatDeadlineDisplay, formatGrantAmount } from "@fundingpro/shared";
import { Screen } from "../../../components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { getStatusLabel, getStatusStyle } from "../../../lib/application-status";
import { queryKeys } from "../../../lib/query-keys";

export default function TrackerScreen() {
  const appsQuery = useQuery({
    queryKey: queryKeys.applications(),
    queryFn: () => api.applications({ limit: 50 }),
  });

  if (appsQuery.isLoading) return <LoadingState />;
  if (appsQuery.isError) {
    return <ErrorState message={appsQuery.error.message} onRetry={() => appsQuery.refetch()} />;
  }

  return (
    <Screen title="Мои заявки" showBack>
      <FlashList
        data={appsQuery.data?.applications ?? []}
        refreshControl={
          <RefreshControl refreshing={appsQuery.isRefetching} onRefresh={() => appsQuery.refetch()} />
        }
        ListEmptyComponent={<EmptyState message="Заявок пока нет" />}
        renderItem={({ item }) => {
          const grant = item.grant as
            | {
                id?: string;
                title_ru?: string | null;
                title?: string;
                deadline?: string | null;
                amount_min?: number | null;
                amount_max?: number | null;
                donor?: { name_ru?: string | null; name?: string | null };
              }
            | undefined;
          const statusStyle = getStatusStyle(item.status);

          return (
            <Link href={`/(app)/tracker/${item.id}` as never} asChild>
              <Pressable className="mx-4 mb-3 rounded-2xl border border-gray-200 bg-white p-4">
                <Text className="font-semibold text-funding-black">
                  {grant?.title_ru ?? grant?.title ?? item.grantId}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {grant?.donor?.name_ru ?? grant?.donor?.name ?? "—"}
                </Text>
                <View className="flex-row flex-wrap gap-2 mt-2">
                  {formatGrantAmount(grant?.amount_min, grant?.amount_max) ? (
                    <Text className="text-xs text-gray-500">
                      {formatGrantAmount(grant?.amount_min, grant?.amount_max)}
                    </Text>
                  ) : null}
                  {grant?.deadline ? (
                    <Text className="text-xs text-gray-500">
                      {formatGrantAmount(grant?.amount_min, grant?.amount_max) ? "· " : ""}
                      {formatDeadlineDisplay(grant.deadline)}
                    </Text>
                  ) : null}
                </View>
                <View className="mt-3 self-start rounded-full px-2.5 py-1" style={{ backgroundColor: statusStyle.bg }}>
                  <Text className="text-[11px] font-semibold" style={{ color: statusStyle.color }}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </Pressable>
            </Link>
          );
        }}
      />
    </Screen>
  );
}
