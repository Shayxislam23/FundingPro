import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  formatDeadlineDisplay,
  formatGrantAmount,
  getDeadlineUrgency,
  isDeadlineExpired,
  translateSector,
} from "@fundingpro/shared";
import type { GrantListItem } from "@fundingpro/api-types";
import { Screen } from "../../../components/ui/Screen";
import { ErrorState, LoadingState } from "../../../components/ui/States";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { api } from "../../../lib/api/client";
import { queryKeys } from "../../../lib/query-keys";
import { saveGrantsCache } from "../../../lib/offline/grants-cache";

const PAGE_SIZE = 12;

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

function getSector(sectors: string[]): string {
  if (!sectors.length) return "—";
  return translateSector(sectors[0] ?? "");
}

function GrantRow({ item, dimmed }: { item: GrantListItem; dimmed?: boolean }) {
  const expired = isDeadlineExpired(item.deadline);
  const urgency = getDeadlineUrgency(item.deadline);

  return (
    <Link href={`/(app)/grants/${item.id}` as never} asChild>
      <Pressable
        className={`mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 ${dimmed ? "opacity-60" : ""}`}
      >
        <View className="flex-row items-start justify-between gap-2">
          <Text className="font-semibold text-funding-black flex-1">{item.title_ru ?? item.title}</Text>
          {expired ? (
            <Text className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Дедлайн истёк
            </Text>
          ) : urgency === "soon" ? (
            <Text className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Скоро закрывается
            </Text>
          ) : null}
        </View>
        <Text className="text-sm text-gray-500 mt-1">
          {item.donor.name_ru ?? item.donor.name ?? "—"}
        </Text>
        <View className="flex-row flex-wrap gap-x-3 mt-2">
          <Text className="text-xs text-gray-500">
            Дедлайн: {formatDeadlineDisplay(item.deadline)}
          </Text>
          <Text className="text-xs text-gray-500">
            Сумма: {formatGrantAmount(item.amount_min, item.amount_max)}
          </Text>
        </View>
        <Text className="text-xs text-gray-400 mt-1">
          {getSector(item.sectors)}
          {item.country_scope.length > 0 ? ` · ${item.country_scope.join(", ")}` : ""}
        </Text>
      </Pressable>
    </Link>
  );
}

export default function GrantsTab() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeSector, setActiveSector] = useState<SectorFilter>("Все");
  const [listMode, setListMode] = useState<ListMode>("active");
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const sectorSlug = SECTOR_SLUGS[activeSector];

  const grantsQuery = useInfiniteQuery({
    queryKey: queryKeys.grants({
      tab: true,
      search: debouncedSearch || undefined,
      sector: sectorSlug,
      activeOnly: listMode === "active" ? true : undefined,
    }),
    queryFn: async ({ pageParam }) => {
      const data = await api.grants({
        page: pageParam,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sector: sectorSlug,
        activeOnly: listMode === "active" ? true : undefined,
      });
      if (pageParam === 1) {
        await saveGrantsCache(data);
      }
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined,
  });

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

  if (grantsQuery.isLoading && !grantsQuery.data) {
    return <LoadingState />;
  }

  if (grantsQuery.isError) {
    return (
      <ErrorState message={grantsQuery.error.message} onRetry={() => grantsQuery.refetch()} />
    );
  }

  const listHeader = (
    <View className="px-4 pb-3">
      <View className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
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
                  : "bg-funding-light border-gray-200"
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

        <View className="flex-row gap-2 mb-4">
          <Input
            className="flex-1 bg-funding-light border-gray-200"
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Поиск по названию или донору..."
            returnKeyType="search"
            autoCorrect={false}
          />
          {listMode === "all" ? (
            <Pressable
              onPress={() => setShowExpired((value) => !value)}
              className={`px-3 py-2.5 rounded-xl border ${
                showExpired ? "bg-amber-50 border-amber-200" : "bg-funding-light border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-medium ${showExpired ? "text-amber-700" : "text-gray-500"}`}
              >
                {showExpired ? "Все дедлайны" : `Скрыть истёкшие (${expiredCount})`}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
          <View className="flex-row gap-2">
            {sectorFilters.map((sector) => (
              <Pressable
                key={sector}
                onPress={() => setActiveSector(sector)}
                className={`px-3 py-1.5 rounded-full ${
                  activeSector === sector
                    ? "bg-funding-green"
                    : "bg-funding-light border border-gray-200"
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
      </View>

      <Text className="text-sm text-gray-500 mb-2">
        {listMode === "active" ? (
          <>
            Активных: <Text className="font-semibold text-funding-black">{total}</Text>
          </>
        ) : (
          <>
            Показано: <Text className="font-semibold text-funding-black">{filteredGrants.length}</Text>{" "}
            из <Text className="font-semibold text-funding-black">{total}</Text> грантов
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
      <FlashList
        data={filteredGrants}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
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
                  ? "Сейчас нет открытых грантов по выбранным фильтрам. Попробуйте другой сектор или переключитесь на «Все гранты»."
                  : "Попробуйте изменить поиск, сектор или включите показ истёкших дедлайнов."}
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
          <GrantRow
            item={item}
            dimmed={listMode === "all" && isDeadlineExpired(item.deadline)}
          />
        )}
      />
    </Screen>
  );
}
