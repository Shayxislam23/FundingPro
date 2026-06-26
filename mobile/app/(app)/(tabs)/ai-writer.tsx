import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { formatDeadlineDisplay } from "@fundingpro/shared";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Screen } from "../../../components/ui/Screen";
import { api } from "../../../lib/api/client";
import { queryKeys } from "../../../lib/query-keys";

const SECTION_LABELS: Record<string, string> = {
  summary: "Резюме проекта",
  problem: "Постановка проблемы",
  goal: "Цель и задачи",
  activities: "Деятельность и план",
};

function formatLimit(used: number | undefined, max: number | null | undefined): string {
  const count = used ?? 0;
  if (max === null || max === undefined) return `${count} · без лимита`;
  return `${count}/${max}`;
}

function isAiLimitReached(used: number | undefined, max: number | null | undefined): boolean {
  if (max === null || max === undefined) return false;
  return (used ?? 0) >= max;
}

export default function AiWriterTab() {
  const params = useLocalSearchParams<{ grantId?: string }>();
  const [selectedGrantId, setSelectedGrantId] = useState("");
  const [summary, setSummary] = useState("");
  const [limitError, setLimitError] = useState("");
  const [generated, setGenerated] = useState<{
    proposalId: string;
    sections?: Record<string, string>;
    isMockAi?: boolean;
    saved?: boolean;
  } | null>(null);
  const [activeSection, setActiveSection] = useState("summary");

  const usageQuery = useQuery({ queryKey: queryKeys.planUsage, queryFn: () => api.planUsage() });
  const orgQuery = useQuery({ queryKey: queryKeys.organization, queryFn: () => api.organization() });
  const grantsQuery = useQuery({
    queryKey: queryKeys.grants({ aiWriter: true }),
    queryFn: () => api.grants({ limit: 30 }),
  });
  const historyQuery = useQuery({
    queryKey: queryKeys.aiProposals,
    queryFn: () => api.aiProposals(),
  });

  const org = orgQuery.data?.organization;
  const matchQuery = useQuery({
    queryKey: queryKeys.matchGrants(org?.id),
    queryFn: () =>
      api.matchGrants({
        type: org!.type,
        sector: org!.sector ?? undefined,
        country: org!.country ?? undefined,
        description: org!.description ?? undefined,
      }),
    enabled: !!org,
  });

  useEffect(() => {
    if (typeof params.grantId === "string" && params.grantId) {
      setSelectedGrantId(params.grantId);
    }
  }, [params.grantId]);

  const aiLimitReached = useMemo(
    () => isAiLimitReached(usageQuery.data?.used?.aiProposals, usageQuery.data?.limits?.aiProposals),
    [usageQuery.data]
  );

  const generateMutation = useMutation({
    mutationFn: () =>
      api.generateProposal({
        grantId: selectedGrantId || undefined,
        projectIdea: summary.trim(),
      }),
    onSuccess: (data) => {
      setLimitError("");
      setGenerated(data);
      const firstSection = Object.keys(data.sections ?? {})[0] ?? "summary";
      setActiveSection(firstSection);
      void historyQuery.refetch();
      void usageQuery.refetch();
    },
    onError: (error: Error) => {
      if (error.message.includes("PLAN_LIMIT")) {
        setLimitError(error.message.replace(/^PLAN_LIMIT[^:]*:\s*/, ""));
      }
    },
  });

  const grants = grantsQuery.data?.grants ?? [];
  const selectedGrant = grants.find((g) => g.id === selectedGrantId);
  const sectionKeys = Object.keys(generated?.sections ?? {});
  const sectionContent = generated?.sections?.[activeSection] ?? "";

  return (
    <Screen title="AI Предложение">
      <ScrollView className="p-4">
        <Link href="/(app)/ai/disclosure" className="text-funding-green text-sm mb-4">
          Раскрытие об использовании AI →
        </Link>

        {usageQuery.data?.planName && (
          <Card className="mb-4">
            <Text className="text-xs text-gray-400">Тариф</Text>
            <Text className="font-bold text-funding-black">{usageQuery.data.planName}</Text>
            <Text className="text-sm text-gray-600 mt-1">
              AI-предложения:{" "}
              {formatLimit(usageQuery.data.used?.aiProposals, usageQuery.data.limits?.aiProposals)}
            </Text>
            {aiLimitReached && (
              <Link href="/(app)/subscription" className="text-funding-green font-semibold text-sm mt-2">
                Обновить тариф →
              </Link>
            )}
          </Card>
        )}

        {limitError ? (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <Text className="text-amber-900 text-sm">{limitError}</Text>
            <Link href="/(app)/subscription" className="text-funding-green font-semibold text-sm mt-2">
              Обновить тариф →
            </Link>
          </Card>
        ) : null}

        <Text className="text-lg font-bold mb-2">Рекомендованные гранты</Text>
        {!org ? (
          <Card className="mb-4">
            <Text className="text-sm text-gray-600">
              Заполните профиль организации для персональных рекомендаций.
            </Text>
            <Link href="/(app)/profile" className="text-funding-green font-semibold text-sm mt-2">
              Перейти в профиль →
            </Link>
          </Card>
        ) : matchQuery.isLoading ? (
          <Text className="text-sm text-gray-500 mb-4">Подбираем гранты…</Text>
        ) : matchQuery.isError ? (
          <Text className="text-sm text-red-600 mb-4">{matchQuery.error.message}</Text>
        ) : matchQuery.data?.matches.length ? (
          matchQuery.data.matches.slice(0, 5).map((match) => (
            <Pressable
              key={match.grantId}
              onPress={() => setSelectedGrantId(match.grantId)}
              className="mb-2"
            >
              <Card
                className={
                  selectedGrantId === match.grantId ? "border-funding-green bg-green-50" : undefined
                }
              >
                <Text className="font-medium text-funding-black">{match.title ?? match.grantId}</Text>
                {match.score !== undefined && (
                  <Text className="text-xs text-funding-green mt-1">Совпадение: {match.score}%</Text>
                )}
                {match.reason ? (
                  <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                    {match.reason}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          ))
        ) : (
          <Text className="text-sm text-gray-500 mb-4">Рекомендации пока недоступны</Text>
        )}

        <Text className="text-lg font-bold mt-4 mb-2">Выберите грант</Text>
        {selectedGrant ? (
          <Card className="mb-3 border-funding-green bg-green-50">
            <Text className="font-semibold text-funding-black">
              {selectedGrant.title_ru ?? selectedGrant.title}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Дедлайн: {formatDeadlineDisplay(selectedGrant.deadline)}
            </Text>
            <Button
              title="Сбросить выбор"
              variant="ghost"
              className="mt-2 self-start"
              onPress={() => setSelectedGrantId("")}
            />
          </Card>
        ) : null}

        {grants.slice(0, 8).map((grant) => (
          <Pressable key={grant.id} onPress={() => setSelectedGrantId(grant.id)} className="mb-2">
            <Card className={selectedGrantId === grant.id ? "border-funding-green bg-green-50" : undefined}>
              <Text className="font-medium text-funding-black">{grant.title_ru ?? grant.title}</Text>
              <Text className="text-xs text-gray-500 mt-1">
                Дедлайн: {formatDeadlineDisplay(grant.deadline)}
              </Text>
            </Card>
          </Pressable>
        ))}

        <Input
          className="mt-4"
          placeholder="Краткое описание проекта"
          value={summary}
          onChangeText={setSummary}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Button
          title="Сгенерировать"
          className="mt-3"
          loading={generateMutation.isPending}
          disabled={!summary.trim() || aiLimitReached}
          onPress={() => {
            setLimitError("");
            setGenerated(null);
            generateMutation.mutate();
          }}
        />

        {generateMutation.isError && !limitError && (
          <Text className="text-red-600 mt-3">{generateMutation.error.message}</Text>
        )}

        {generated ? (
          <Card className="mt-6">
            <Text className="font-bold text-funding-black">Черновик готов</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {generated.saved ? "Сохранено" : "Черновик"} · {generated.proposalId.slice(0, 8)}…
              {generated.isMockAi ? " · DEMO" : ""}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
              {sectionKeys.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setActiveSection(key)}
                  className={`mr-2 rounded-lg px-3 py-2 border ${
                    activeSection === key ? "border-funding-green bg-green-50" : "border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      activeSection === key ? "text-funding-green" : "text-gray-600"
                    }`}
                  >
                    {SECTION_LABELS[key] ?? key}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text className="text-sm text-gray-700 mt-3">{sectionContent}</Text>
          </Card>
        ) : null}

        <Text className="text-lg font-bold mt-6 mb-2">История</Text>
        {historyQuery.data?.proposals?.map((p) => (
          <Card key={p.id} className="mb-2">
            <Text className="font-medium">{p.title ?? p.id}</Text>
            <Text className="text-xs text-gray-500">{p.status}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
