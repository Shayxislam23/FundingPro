import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { DemoBanner } from "../../components/design/DemoBanner";
import { DonorAvatar } from "../../components/design/DonorAvatar";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { translateCountry } from "@fundingpro/shared";
import { api } from "../../lib/api/client";
import { withDonorsFallback } from "../../lib/public-fallback";
import { queryKeys } from "../../lib/query-keys";

export default function DonorsScreen() {
  const donorsQuery = useQuery({
    queryKey: queryKeys.donors,
    queryFn: () => api.donors(),
  });

  if (donorsQuery.isLoading && !donorsQuery.data) {
    return <LoadingState />;
  }

  if (donorsQuery.isError && !donorsQuery.data) {
    return (
      <ErrorState message={donorsQuery.error.message} onRetry={() => donorsQuery.refetch()} />
    );
  }

  const donorsResult = withDonorsFallback(donorsQuery.data);
  const donors = donorsResult.donors;
  const fromFallback = donorsResult.fromFallback;

  return (
    <Screen title="Доноры" showBack largeTitle>
      <ScrollView
        className="px-5 pt-4"
        refreshControl={
          <RefreshControl refreshing={donorsQuery.isRefetching} onRefresh={() => donorsQuery.refetch()} />
        }
      >
        {fromFallback ? <DemoBanner className="mb-4" /> : null}
        {donors.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Доноры скоро появятся"
            description="Мы добавляем международных и локальных доноров. Потяните вниз для обновления."
            action={
              <Text
                className="text-funding-green font-semibold"
                onPress={() => donorsQuery.refetch()}
              >
                Обновить
              </Text>
            }
          />
        ) : (
          donors.map((d) => {
            const displayName = d.name_ru ?? d.name;
            return (
              <Card key={d.id} className="mb-3 shadow-card">
                <View className="flex-row items-start gap-3">
                  <DonorAvatar name={d.name} nameRu={d.name_ru} />
                  <View className="flex-1">
                    <Text className="font-bold text-funding-black">{displayName}</Text>
                    {d.name_ru && d.name !== d.name_ru && (
                      <Text className="text-xs text-gray-400 mt-0.5">{d.name}</Text>
                    )}
                    {d.description ? (
                      <Text className="text-sm text-gray-600 mt-2 leading-5">{d.description}</Text>
                    ) : d.country ? (
                      <Text className="text-sm text-gray-600 mt-2">{translateCountry(d.country)}</Text>
                    ) : null}
                    {d.website ? (
                      <Pressable
                        onPress={() => void WebBrowser.openBrowserAsync(d.website!)}
                        className="flex-row items-center gap-1.5 mt-3 active:opacity-70"
                      >
                        <Ionicons name="open-outline" size={16} color="#008A2E" />
                        <Text className="text-sm text-funding-green font-medium">Открыть сайт</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
