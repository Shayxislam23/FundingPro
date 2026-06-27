import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import type { GrantListItem } from "@fundingpro/api-types";
import { DemoBanner } from "../../../components/design/DemoBanner";
import { GrantCard } from "../../../components/design/GrantCard";
import { SearchBar } from "../../../components/design/SearchBar";
import { GrantListSkeleton } from "../../../components/design/Skeleton";
import { ClaySurface } from "../../../components/clay/ClaySurface";
import { Button } from "../../../components/ui/Button";
import { Screen } from "../../../components/ui/Screen";
import { EmptyState, ErrorState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { loadGrantsCache, saveGrantsCache } from "../../../lib/offline/grants-cache";
import { withGrantsFallback } from "../../../lib/public-fallback";
import { queryKeys } from "../../../lib/query-keys";

export default function PublicGrantsScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [uzOnly, setUzOnly] = useState(true);
  const [cacheReady, setCacheReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void loadGrantsCache().then((cached) => {
      if (cached) {
        queryClient.setQueryData(queryKeys.grants({ public: true }), cached);
      }
      setCacheReady(true);
    });
  }, [queryClient]);

  const grantsQuery = useQuery({
    queryKey: queryKeys.grants({ public: true, search: debouncedSearch || undefined }),
    queryFn: async () => {
      const data = await api.grants({
        limit: 50,
        search: debouncedSearch || undefined,
        country: uzOnly ? "Uzbekistan" : undefined,
      });
      await saveGrantsCache(data);
      return data;
    },
    enabled: cacheReady,
    placeholderData: (previous) => previous,
  });

  const grantsResult = withGrantsFallback(grantsQuery.data);
  const fromFallback = grantsResult.fromFallback;

  const grants = useMemo(() => {
    const items = grantsResult.grants;
    if (!debouncedSearch) return items;
    const q = debouncedSearch.toLowerCase();
    return items.filter(
      (g) =>
        (g.title_ru ?? g.title).toLowerCase().includes(q) ||
        (g.donor.name_ru ?? g.donor.name).toLowerCase().includes(q)
    );
  }, [grantsResult.grants, debouncedSearch]);

  if (!cacheReady || (grantsQuery.isLoading && !grantsQuery.data)) {
    return (
      <Screen title="Публичные гранты" largeTitle>
        <View className="px-5 pt-3">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Поиск грантов…" />
        </View>
        <GrantListSkeleton />
      </Screen>
    );
  }

  if (grantsQuery.isError && !grantsQuery.data) {
    return <ErrorState message={grantsQuery.error.message} onRetry={() => grantsQuery.refetch()} />;
  }

  const listHeader = (
    <View className="px-5 pb-3 pt-1">
      {fromFallback ? <DemoBanner className="mb-3" /> : null}
      <SearchBar value={search} onChangeText={setSearch} placeholder="Поиск грантов…" />
      <Pressable onPress={() => setUzOnly((v) => !v)}>
        <ClaySurface
          variant={uzOnly ? "pressed" : "raised"}
          style={uzOnly ? { backgroundColor: "#008A2E", borderColor: "#008A2E" } : undefined}
          radius="pill"
          className="mt-3 self-start px-3 py-1.5"
        >
          <Text className={`text-xs font-medium ${uzOnly ? "text-white" : "text-gray-600"}`}>
            🇺🇿 Узбекистан
          </Text>
        </ClaySurface>
      </Pressable>
    </View>
  );

  return (
    <Screen title="Публичные гранты" largeTitle>
      <FlashList<GrantListItem>
        data={grants}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl refreshing={grantsQuery.isRefetching} onRefresh={() => grantsQuery.refetch()} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Каталог обновляется"
            description="Пока нет грантов по выбранным фильтрам. Потяните вниз для обновления или войдите для полного каталога."
            action={
              <View className="gap-3 w-full max-w-xs">
                <Button title="Обновить" variant="secondary" onPress={() => grantsQuery.refetch()} />
                <Link href="/(auth)/login" asChild>
                  <Button title="Войти" haptic />
                </Link>
              </View>
            }
          />
        }
        renderItem={({ item }) => (
          <View className="mx-5 mb-3">
            <Link href={`/(public)/grants/${item.id}` as never} asChild>
              <GrantCard grant={item} />
            </Link>
          </View>
        )}
      />
    </Screen>
  );
}
