import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlashListSized, FLASH_LIST_ITEM_SIZE } from "../../../components/ui/FlashListSized";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { isDeadlineExpired } from "@fundingpro/shared";
import type { GrantListItem } from "@fundingpro/api-types";
import { GrantCard } from "../../../components/design/GrantCard";
import { SearchBar } from "../../../components/design/SearchBar";
import { GrantListSkeleton } from "../../../components/design/Skeleton";
import { Card } from "../../../components/ui/Card";
import { Screen } from "../../../components/ui/Screen";
import { ErrorState } from "../../../components/ui/States";
import { Button } from "../../../components/ui/Button";
import { api } from "../../../lib/api/client";
import { t } from "../../../lib/i18n";
import { loadGrantsCache, saveGrantsCache } from "../../../lib/offline/grants-cache";
import { queryKeys } from "../../../lib/query-keys";

const PAGE_SIZE = 12;
const GRANT_ROW_HEIGHT = FLASH_LIST_ITEM_SIZE.grant;

const sectorFilters = [
  "Все",
  "Экология",
  "Образование",
  "Здравоохранение",
  "Климат",
  "Права человека",
  "Гражданское общество",
  "Экономика",
  "Исследования",
  "Биотехнологии",
  "Водные ресурсы",
] as const;

type SectorFilter = (typeof sectorFilters)[number];

const SECTOR_SLUGS: Record<SectorFilter, string | undefined> = {
  Все: undefined,
  Экология: "environment",
  Образование: "education",
  Здравоохранение: "healthcare",
  Климат: "climate",
  "Права человека": "human_rights",
  "Гражданское общество": "civil_society",
  Экономика: "economics",
  Исследования: "research",
  Биотехнологии: "biotechnology",
  "Водные ресурсы": "water_resources",
};

type ListMode = "active" | "all";

const countryFilters = [
  { label: "Узбекистан", value: "Uzbekistan" },
  { label: "Казахстан", value: "Kazakhstan" },
  { label: "Все страны", value: "" },
] as const;

type CountryFilter = (typeof countryFilters)[number]["label"];

export default function GrantsTab() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeSector, setActiveSector] = useState<SectorFilter>("Все");
  const [activeCountry, setActiveCountry] = useState<CountryFilter>("Узбекистан");
  const [listMode, setListMode] = useState<ListMode>("active");
  const [showExpired, setShowExpired] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [offlineFallback, setOfflineFallback] = useState(false);

  useEffect(() => {
    void loadGrantsCache().then((cached) => {
      if (cached) {
        queryClient.setQueryData(
          queryKeys.grants({
            tab: true,
            search: undefined,
            sector: SECTOR_SLUGS.Все,
            country: "Uzbekistan",
            activeOnly: true,
          }),
          { pages: [cached], pageParams: [1] }
        );
      }
      setCacheReady(true);
    });
  }, [queryClient]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const sectorSlug = SECTOR_SLUGS[activeSector];
  const countrySlug = countryFilters.find((item) => item.label === activeCountry)?.value;

  const grantsQuery = useInfiniteQuery({
    queryKey: queryKeys.grants({
      tab: true,
      search: debouncedSearch || undefined,
      sector: sectorSlug,
      country: countrySlug || undefined,
      activeOnly: listMode === "active" ? true : undefined,
    }),
    queryFn: async ({ pageParam }) => {
      const data = await api.grants({
        page: pageParam,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sector: sectorSlug,
        country: countrySlug || undefined,
        activeOnly: listMode === "active" ? true : undefined,
      });
      if (pageParam === 1) {
        await saveGrantsCache(data);
      }
      setOfflineFallback(false);
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
    enabled: cacheReady,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (grantsQuery.isError && grantsQuery.data) {
      setOfflineFallback(true);
    }
  }, [grantsQuery.isError, grantsQuery.data]);

  const grants = useMemo(
    () => grantsQuery.data?.pages.flatMap((page) => page.grants) ?? [],
    [grantsQuery.data?.pages]
  );

  const total = grantsQuery.data?.pages[0]?.total ?? 0;

  const filteredGrants = useMemo(() => {
    if (listMode === "active") return grants;
    return grants.filter((grant) => showExpired || !isDeadlineExpired(grant.deadline));
  }, [grants, listMode, showExpired]);

  const activeCount = useMemo(
    () => grants.filter((grant) => !isDeadlineExpired(grant.deadline)).length,
    [grants]
  );
  const expiredCount = grants.length - activeCount;

  if (!cacheReady || (grantsQuery.isLoading && !grantsQuery.data)) {
    return (
      <Screen title="Гранты">
        <View className="px-4 pt-3 pb-2 bg-clay-canvas border-b border-clay-inset/40">
          <SearchBar value={searchInput} onChangeText={setSearchInput} placeholder="Поиск…" />
        </View>
        <GrantListSkeleton count={6} />
      </Screen>
    );
  }

  if (grantsQuery.isError && !grantsQuery.data) {
    return (
      <ErrorState message={grantsQuery.error.message} onRetry={() => grantsQuery.refetch()} />
    );
  }

  const stickyHeader = (
    <View className="px-4 pb-3 pt-1 bg-clay-canvas border-b border-clay-inset/40">
      {offlineFallback ? (
        <Text className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-2">
          {t.offlineGrants}
        </Text>
      ) : null}
      <Card className="p-4 mb-0">
        <View className="flex-row gap-2 mb-4">
          {(["active", "all"] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => {
                setListMode(mode);
                if (mode === "active") setShowExpired(false);
              }}
              className={`px-4 py-2 rounded-xl border ${
                listMode === mode
                  ? "bg-funding-green border-funding-green"
                  : "bg-clay-surface border-clay-inset/60"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  listMode === mode ? "text-white" : "text-gray-600"
                }`}
              >
                {mode === "active" ? "Активные" : "Все гранты"}
              </Text>
            </Pressable>
          ))}
        </View>

        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Поиск по названию или донору..."
          className="mb-3"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {countryFilters.map((country) => (
              <Pressable
                key={country.label}
                onPress={() => setActiveCountry(country.label)}
                className={`px-3 py-1.5 rounded-full ${
                  activeCountry === country.label
                    ? "bg-funding-green"
                    : "bg-clay-surface border border-clay-inset/60"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    activeCountry === country.label ? "text-white" : "text-gray-600"
                  }`}
                >
                  {country.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {listMode === "all" ? (
          <Pressable
            onPress={() => setShowExpired((value) => !value)}
            className={`self-start px-3 py-2 rounded-xl border mb-3 ${
              showExpired ? "bg-amber-50 border-amber-200" : "bg-clay-surface border-clay-inset/60"
            }`}
          >
            <Text className={`text-xs font-medium ${showExpired ? "text-amber-700" : "text-gray-500"}`}>
              {showExpired ? "Все дедлайны" : `Скрыть истёкшие (${expiredCount})`}
            </Text>
          </Pressable>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {sectorFilters.map((sector) => (
              <Pressable
                key={sector}
                onPress={() => setActiveSector(sector)}
                className={`px-3 py-1.5 rounded-full ${
                  activeSector === sector
                    ? "bg-funding-green"
                    : "bg-clay-surface border border-clay-inset/60"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    activeSector === sector ? "text-white" : "text-gray-600"
                  }`}
                >
                  {sector}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </Card>

      <Text className="text-sm text-gray-500 mt-3 mb-1">
        {listMode === "active" ? (
          <>
            Активных: <Text className="font-semibold text-funding-black">{total}</Text>
          </>
        ) : (
          <>
            Показано: <Text className="font-semibold text-funding-black">{filteredGrants.length}</Text>{" "}
            из <Text className="font-semibold text-funding-black">{total}</Text>
            {!showExpired && expiredCount > 0 ? (
              <Text className="text-gray-400"> · {activeCount} с действующим дедлайном</Text>
            ) : null}
          </>
        )}
      </Text>
    </View>
  );

  const listFooter =
    grantsQuery.hasNextPage ? (
      <View className="px-4 py-4">
        <Button
          title={grantsQuery.isFetchingNextPage ? "Загрузка…" : "Загрузить ещё"}
          variant="secondary"
          loading={grantsQuery.isFetchingNextPage}
          onPress={() => grantsQuery.fetchNextPage()}
        />
      </View>
    ) : (
      <View className="h-4" />
    );

  return (
    <Screen title="Гранты">
      <FlashListSized<GrantListItem>
        data={filteredGrants}
        estimatedItemSize={GRANT_ROW_HEIGHT}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={stickyHeader}
        stickyHeaderIndices={[0]}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          grantsQuery.isFetching ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#008A2E" />
            </View>
          ) : (
            <View className="items-center justify-center px-6 py-16">
              <Text className="text-gray-500 text-sm font-medium mb-1 text-center">
                Грантов не найдено
              </Text>
              <Text className="text-gray-400 text-xs text-center max-w-sm">
                {listMode === "active"
                  ? "Сейчас нет открытых грантов по выбранным фильтрам."
                  : "Попробуйте изменить поиск или сектор."}
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={grantsQuery.isRefetching && !grantsQuery.isFetchingNextPage}
            onRefresh={() => grantsQuery.refetch()}
          />
        }
        renderItem={({ item }) => (
          <View className={`mx-4 mb-3 ${listMode === "all" && isDeadlineExpired(item.deadline) ? "opacity-60" : ""}`}>
            <Link href={`/(app)/grants/${item.id}` as never} asChild>
              <GrantCard grant={item} />
            </Link>
          </View>
        )}
      />
    </Screen>
  );
}
