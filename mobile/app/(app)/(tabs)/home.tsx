import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatDeadlineDisplay } from "@fundingpro/shared";
import { OnboardingChecklist } from "../../../components/onboarding/OnboardingChecklist";
import { ReconsentBanner } from "../../../components/legal/ReconsentBanner";
import { Card } from "../../../components/ui/Card";
import { LoadingState, ErrorState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { getStatusLabel, getStatusStyle } from "../../../lib/application-status";
import { queryKeys } from "../../../lib/query-keys";

const TERMINAL_STATUSES = new Set(["won", "lost", "closed"]);

function formatLimit(used: number | undefined, max: number | null | undefined): string {
  const count = used ?? 0;
  if (max === null || max === undefined) return `${count} · без лимита`;
  return `${count}/${max}`;
}

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
};

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card className="flex-1 min-w-[46%] mb-3 p-3">
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{title}</Text>
      <Text className="text-2xl font-black text-funding-black mt-1">{value}</Text>
      <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text>
    </Card>
  );
}

type QuickActionProps = {
  label: string;
  href: string;
};

function QuickAction({ label, href }: QuickActionProps) {
  return (
    <Link href={href as never} asChild>
      <Pressable className="flex-row items-center p-3 rounded-xl bg-white border border-gray-100 mb-2 active:opacity-80">
        <Text className="text-sm font-medium text-funding-black flex-1">{label}</Text>
        <Text className="text-gray-400 text-sm">→</Text>
      </Pressable>
    </Link>
  );
}

export default function DashboardHome() {
  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: () => api.me() });
  const onboardingQuery = useQuery({ queryKey: queryKeys.onboarding, queryFn: () => api.onboardingStatus() });
  const grantsQuery = useQuery({
    queryKey: queryKeys.grants({ home: true }),
    queryFn: () => api.grants({ limit: 4 }),
  });
  const applicationsQuery = useQuery({
    queryKey: queryKeys.applications({ home: true }),
    queryFn: () => api.applications({ limit: 3 }),
  });
  const planUsageQuery = useQuery({ queryKey: queryKeys.planUsage, queryFn: () => api.planUsage() });

  const org = meQuery.data?.organization;
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

  const applications = applicationsQuery.data?.applications ?? [];
  const activeApplications = applications.filter((app) => !TERMINAL_STATUSES.has(app.status.toLowerCase()));
  const totalGrants = grantsQuery.data?.total ?? 0;
  const savedGrantsCount = meQuery.data?.savedGrantIds?.length ?? 0;

  const refreshing =
    meQuery.isRefetching ||
    grantsQuery.isRefetching ||
    applicationsQuery.isRefetching ||
    onboardingQuery.isRefetching;

  const refetchAll = () => {
    void meQuery.refetch();
    void grantsQuery.refetch();
    void applicationsQuery.refetch();
    void onboardingQuery.refetch();
    void planUsageQuery.refetch();
    if (org) void matchQuery.refetch();
  };

  if (meQuery.isLoading) return <LoadingState />;

  const orgName = org?.name ?? null;
  const onboarding = onboardingQuery.data;

  return (
    <SafeAreaView className="flex-1 bg-funding-light">
      <ScrollView
        className="px-4 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} />}
      >
        <View className="flex-row items-start justify-between mb-1">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-black text-funding-black">
              {orgName ? `Добро пожаловать, ${orgName}` : "Главная"}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {totalGrants} грантов в базе
              {onboarding && !onboarding.isComplete
                ? ` · ${onboarding.completedCount}/${onboarding.totalSteps} шагов онбординга`
                : savedGrantsCount > 0
                  ? ` · ${savedGrantsCount} сохранённых`
                  : ""}
            </Text>
            {meQuery.data?.email && !orgName && (
              <Text className="text-sm text-gray-400 mt-0.5">{meQuery.data.email}</Text>
            )}
          </View>
          <Link href="/(app)/(tabs)/ai-writer" asChild>
            <Pressable className="bg-funding-green px-3 py-2 rounded-xl active:opacity-80">
              <Text className="text-white text-xs font-semibold">AI</Text>
            </Pressable>
          </Link>
        </View>

        {planUsageQuery.data?.planName && (
          <Link href="/(app)/subscription" asChild>
            <Pressable className="mt-3 active:opacity-80">
              <Card className="p-3">
                <Text className="font-semibold text-funding-black text-sm">
                  {planUsageQuery.data.planName}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Проверки:{" "}
                  {formatLimit(
                    planUsageQuery.data.used?.eligibilityChecks,
                    planUsageQuery.data.limits?.eligibilityChecks
                  )}{" "}
                  · AI:{" "}
                  {formatLimit(planUsageQuery.data.used?.aiProposals, planUsageQuery.data.limits?.aiProposals)}
                </Text>
              </Card>
            </Pressable>
          </Link>
        )}

        <ReconsentBanner />

        {!org && (
          <Link href="/(app)/profile" asChild>
            <Pressable className="mt-3 active:opacity-80">
              <Card className="bg-amber-50 border-amber-200">
                <Text className="font-semibold text-funding-black">Заполните профиль организации</Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Это нужно для проверки соответствия и подбора грантов.
                </Text>
              </Card>
            </Pressable>
          </Link>
        )}

        {onboarding && !onboarding.isComplete && (
          <OnboardingChecklist
            steps={onboarding.steps}
            completedCount={onboarding.completedCount}
            totalSteps={onboarding.totalSteps}
          />
        )}

        <View className="flex-row flex-wrap justify-between mt-4">
          <StatCard
            title="Грантов в базе"
            value={String(totalGrants)}
            subtitle="актуальная база"
          />
          <StatCard
            title="Мои заявки"
            value={String(applicationsQuery.data?.total ?? applications.length)}
            subtitle={
              applications.length > 0
                ? `${activeApplications.length} активных`
                : "нет заявок"
            }
          />
          <StatCard title="AI-инструменты" value="3" subtitle="доступно" />
          <StatCard title="Сохранено" value={String(savedGrantsCount)} subtitle="грантов" />
        </View>

        {org && matchQuery.data?.matches && matchQuery.data.matches.length > 0 && (
          <View className="mt-2 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-funding-black">Рекомендованные гранты</Text>
              <Link href="/(app)/(tabs)/ai-writer" asChild>
                <Pressable>
                  <Text className="text-sm font-semibold text-funding-green">Все →</Text>
                </Pressable>
              </Link>
            </View>
            {matchQuery.data.matches.slice(0, 2).map((match) => (
              <Link key={match.grantId} href={`/(app)/grants/${match.grantId}` as never} asChild>
                <Pressable className="mb-2 active:opacity-80">
                  <Card className="p-3">
                    <Text className="font-semibold text-funding-black">
                      {match.title ?? match.grantId}
                    </Text>
                    {match.reason && (
                      <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                        {match.reason}
                      </Text>
                    )}
                  </Card>
                </Pressable>
              </Link>
            ))}
          </View>
        )}

        <View className="flex-row items-center justify-between mt-2 mb-3">
          <Text className="text-lg font-bold text-funding-black">Последние гранты</Text>
          <Link href="/(app)/(tabs)/grants" asChild>
            <Pressable>
              <Text className="text-sm font-semibold text-funding-green">Все →</Text>
            </Pressable>
          </Link>
        </View>
        {grantsQuery.isError && <ErrorState message={grantsQuery.error.message} />}
        {grantsQuery.data?.grants.map((grant) => (
          <Link key={grant.id} href={`/(app)/grants/${grant.id}` as never} asChild>
            <Pressable className="mb-3 active:opacity-80">
              <Card>
                <Text className="font-semibold text-funding-black">{grant.title_ru ?? grant.title}</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Дедлайн: {formatDeadlineDisplay(grant.deadline)}
                </Text>
              </Card>
            </Pressable>
          </Link>
        ))}

        <View className="mt-4 mb-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-funding-black">Мои заявки</Text>
            <Link href="/(app)/tracker" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-funding-green">Все →</Text>
              </Pressable>
            </Link>
          </View>
          {applicationsQuery.isError && <ErrorState message={applicationsQuery.error.message} />}
          {applications.length === 0 ? (
            <Card className="items-center py-5">
              <Text className="text-xs text-gray-400 mb-2">Нет активных заявок</Text>
              <Link href="/(app)/(tabs)/grants" asChild>
                <Pressable>
                  <Text className="text-xs font-semibold text-funding-green">Найти грант →</Text>
                </Pressable>
              </Link>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              {applications.map((app, index) => {
                const style = getStatusStyle(app.status);
                const grantTitle =
                  (app.grant as { title_ru?: string | null; title?: string } | undefined)?.title_ru ??
                  (app.grant as { title?: string } | undefined)?.title ??
                  "—";
                const updatedAt =
                  (app as { updated_at?: string }).updated_at ??
                  (app as { updatedAt?: string }).updatedAt;
                return (
                  <Link key={app.id} href={`/(app)/tracker/${app.id}` as never} asChild>
                    <Pressable
                      className="flex-row items-center justify-between px-4 py-3 active:opacity-80"
                      style={{
                        borderBottomWidth: index < applications.length - 1 ? 1 : 0,
                        borderBottomColor: "#f3f4f6",
                      }}
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-xs font-medium text-funding-black" numberOfLines={1}>
                          {grantTitle}
                        </Text>
                        {updatedAt && (
                          <Text className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(updatedAt).toLocaleDateString("ru-RU")}
                          </Text>
                        )}
                      </View>
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: style.bg }}
                      >
                        <Text className="text-[10px] font-semibold" style={{ color: style.color }}>
                          {getStatusLabel(app.status)}
                        </Text>
                      </View>
                    </Pressable>
                  </Link>
                );
              })}
            </Card>
          )}
        </View>

        <Text className="text-lg font-bold text-funding-black mb-3">Быстрые действия</Text>
        <QuickAction label="Найти гранты" href="/(app)/(tabs)/grants" />
        <QuickAction label="Проверить соответствие" href="/(app)/(tabs)/eligibility" />
        <QuickAction label="Профиль организации" href="/(app)/profile" />
        <QuickAction label="Создать AI-предложение" href="/(app)/(tabs)/ai-writer" />

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
