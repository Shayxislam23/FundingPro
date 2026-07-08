import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Badge } from "../../components/design/Badge";
import { ClaySurface } from "../../components/clay/ClaySurface";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { translateSector } from "@fundingpro/shared";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

export default function StoriesScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);

  const storiesQuery = useQuery({
    queryKey: queryKeys.stories,
    queryFn: () => api.stories(),
  });

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const s of storiesQuery.data?.stories ?? []) {
      if (s.sector) set.add(s.sector);
    }
    return Array.from(set).sort();
  }, [storiesQuery.data?.stories]);

  const stories = useMemo(() => {
    const all = storiesQuery.data?.stories ?? [];
    if (!sectorFilter) return all;
    return all.filter((s) => s.sector === sectorFilter);
  }, [storiesQuery.data?.stories, sectorFilter]);

  if (storiesQuery.isLoading && !storiesQuery.data) {
    return <LoadingState />;
  }

  if (storiesQuery.isError && !storiesQuery.data) {
    return (
      <ErrorState message={storiesQuery.error.message} onRetry={() => storiesQuery.refetch()} />
    );
  }

  return (
    <Screen title="Истории успеха" showBack largeTitle>
      <ScrollView
        className="px-5 pt-4"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={storiesQuery.isRefetching} onRefresh={() => storiesQuery.refetch()} />
        }
      >
        {sectors.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 -mx-1">
            <View className="flex-row gap-2 px-1">
              <Pressable onPress={() => setSectorFilter(null)}>
                <ClaySurface
                  variant={!sectorFilter ? "pressed" : "raised"}
                  style={
                    !sectorFilter ? { backgroundColor: "#008A2E", borderColor: "#008A2E" } : undefined
                  }
                  radius="pill"
                  className="px-3 py-1.5"
                >
                  <Text className={`text-xs font-medium ${!sectorFilter ? "text-white" : "text-gray-600"}`}>
                    Все
                  </Text>
                </ClaySurface>
              </Pressable>
              {sectors.map((sector) => (
                <Pressable key={sector} onPress={() => setSectorFilter(sector)}>
                  <ClaySurface
                    variant={sectorFilter === sector ? "pressed" : "raised"}
                    style={
                      sectorFilter === sector
                        ? { backgroundColor: "#008A2E", borderColor: "#008A2E" }
                        : undefined
                    }
                    radius="pill"
                    className="px-3 py-1.5"
                  >
                    <Text
                      className={`text-xs font-medium ${
                        sectorFilter === sector ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {translateSector(sector)}
                    </Text>
                  </ClaySurface>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}

        {stories.length === 0 ? (
          <EmptyState
            icon="newspaper-outline"
            title="Истории пока не опубликованы"
            description="Скоро здесь появятся кейсы людей, получивших финансирование."
          />
        ) : (
          stories.map((s) => {
            const expanded = expandedId === s.id;
            return (
              <Card key={s.id} className="mb-3 shadow-card">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-row items-start gap-3 flex-1">
                    <View className="w-10 h-10 rounded-full bg-funding-light-green items-center justify-center">
                      <Ionicons name="person" size={18} color="#008A2E" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-funding-black">{s.org}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">
                        {translateSector(s.sector)} · {s.city}
                      </Text>
                    </View>
                  </View>
                  {s.status === "pilot" ? <Badge label="Пилот" variant="pilot" /> : null}
                </View>
                <Text className="text-sm text-gray-600 mt-3 leading-5" numberOfLines={expanded ? undefined : 3}>
                  {s.summary}
                </Text>
                {expanded ? (
                  <Text className="text-xs font-medium text-funding-green mt-3">{s.outcome}</Text>
                ) : null}
                <Pressable
                  onPress={() => setExpandedId(expanded ? null : s.id)}
                  className="mt-3 active:opacity-70"
                >
                  <Text className="text-sm font-semibold text-funding-green">
                    {expanded ? "Свернуть" : "Читать кейс →"}
                  </Text>
                </Pressable>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
