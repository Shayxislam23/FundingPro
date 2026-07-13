import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Screen } from "../../../components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/States";
import { SearchBar } from "../../../components/design/SearchBar";
import { api } from "../../../lib/api/client";
import { t } from "../../../lib/i18n";
import { queryKeys } from "../../../lib/query-keys";

export default function EligibilityTab() {
  const [grantId, setGrantId] = useState("");
  const [search, setSearch] = useState("");

  const grantsQuery = useQuery({
    queryKey: queryKeys.grants({ eligibility: true }),
    queryFn: () => api.grants({ limit: 30 }),
  });

  const filteredGrants = useMemo(() => {
    const grants = grantsQuery.data?.grants ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return grants;
    return grants.filter((g) => {
      const title = (g.title_ru ?? g.title ?? "").toLowerCase();
      return title.includes(q) || g.id.toLowerCase().includes(q);
    });
  }, [grantsQuery.data?.grants, search]);

  const checkMutation = useMutation({
    mutationFn: (id: string) => api.checkEligibility(id),
  });

  if (grantsQuery.isLoading) return <LoadingState message={t.loading} />;
  if (grantsQuery.isError) {
    return (
      <ErrorState message={grantsQuery.error.message} onRetry={() => grantsQuery.refetch()} />
    );
  }

  return (
    <Screen title={t.eligibilityTitle}>
      <ScrollView className="p-4">
        <Text className="text-sm text-gray-600 mb-4">{t.eligibilityHint}</Text>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t.eligibilitySearch}
          className="mb-3"
        />

        <Input
          placeholder="ID гранта (необязательно)"
          value={grantId}
          onChangeText={setGrantId}
        />
        <Button
          title={t.eligibilityCheck}
          className="mt-3"
          loading={checkMutation.isPending}
          onPress={() => {
            const id = grantId.trim() || filteredGrants[0]?.id;
            if (id) checkMutation.mutate(id);
          }}
        />

        {filteredGrants.length === 0 ? (
          <EmptyState message={t.noData} />
        ) : (
          filteredGrants.slice(0, 12).map((g) => (
            <Card key={g.id} className="mt-3">
              <Text className="font-medium text-funding-black">{g.title_ru ?? g.title}</Text>
              <Text className="text-xs text-gray-400 mt-1">{g.id}</Text>
              <Button
                title={t.eligibilityCheck}
                variant="secondary"
                className="mt-2"
                loading={checkMutation.isPending && checkMutation.variables === g.id}
                onPress={() => checkMutation.mutate(g.id)}
              />
            </Card>
          ))
        )}

        {checkMutation.data && (
          <Card className="mt-4">
            <Text
              className={`font-bold ${
                checkMutation.data.eligible ? "text-funding-green" : "text-red-600"
              }`}
            >
              {checkMutation.data.eligible ? t.eligibilityEligible : t.eligibilityNotEligible}
            </Text>
            {checkMutation.data.reasons?.map((r) => (
              <Text key={r} className="text-sm text-gray-600 mt-1">
                • {r}
              </Text>
            ))}
          </Card>
        )}
        {checkMutation.isError && (
          <Text className="text-red-600 mt-4">{checkMutation.error.message}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
