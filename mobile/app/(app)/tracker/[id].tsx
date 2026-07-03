import { useLocalSearchParams, Link, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { formatDeadlineDisplay, formatGrantAmount } from "@fundingpro/shared";
import type { ApplicationStatus } from "../../../lib/application-status";
import {
  getStatusLabel,
  getStatusStyle,
  NEXT_STATUSES,
  normalizeApplicationStatus,
} from "../../../lib/application-status";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Screen } from "../../../components/ui/Screen";
import { ErrorState, LoadingState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { queryKeys } from "../../../lib/query-keys";

const SUCCESS_FEE_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  invoiced: "Выставлен счёт",
  paid: "Оплачено",
  waived: "Списано",
};

export default function TrackerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const appQuery = useQuery({
    queryKey: queryKeys.application(id),
    queryFn: () => api.getApplication(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (appQuery.data) {
      setNotes(appQuery.data.notes ?? "");
    }
  }, [appQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.application(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.applications() });
  };

  const statusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => api.updateApplication(id, { status }),
    onSuccess: invalidate,
  });

  const notesMutation = useMutation({
    mutationFn: () => api.updateApplication(id, { notes: notes.trim() || null }),
    onSuccess: invalidate,
  });

  if (appQuery.isLoading) return <LoadingState />;
  if (appQuery.isError || !appQuery.data) {
    return <ErrorState message={appQuery.error?.message ?? "Заявка не найдена"} />;
  }

  const app = appQuery.data;
  const grant = app.grant;
  const status = normalizeApplicationStatus(app.status);
  const statusStyle = getStatusStyle(status);
  const nextStatuses = NEXT_STATUSES[status] ?? [];

  return (
    <Screen title="Заявка" showBack>
      <ScrollView className="p-4">
        {grant ? (
          <Link href={`/(app)/grants/${grant.id}` as never}>
            <Text className="text-xl font-bold text-funding-green">
              {grant.title_ru ?? grant.title}
            </Text>
          </Link>
        ) : (
          <Text className="text-xl font-bold text-funding-black">Заявка</Text>
        )}

        {grant?.donor ? (
          <Text className="text-sm text-gray-500 mt-2">
            {grant.donor.name_ru ?? grant.donor.name ?? "—"}
          </Text>
        ) : null}

        <View className="flex-row flex-wrap gap-3 mt-3">
          {formatGrantAmount(grant?.amount_min, grant?.amount_max) ? (
            <Text className="text-sm text-gray-600">
              {formatGrantAmount(grant?.amount_min, grant?.amount_max)}
            </Text>
          ) : null}
          {grant?.deadline ? (
            <Text className="text-sm text-gray-600">
              Дедлайн: {formatDeadlineDisplay(grant.deadline)}
            </Text>
          ) : null}
        </View>

        <View className="mt-4 self-start rounded-full px-3 py-1.5" style={{ backgroundColor: statusStyle.bg }}>
          <Text className="text-xs font-semibold" style={{ color: statusStyle.color }}>
            {getStatusLabel(status)}
          </Text>
        </View>

        {app.success_fee ? (
          <View className="mt-4 rounded-xl border border-funding-green/20 bg-green-50 p-3">
            <Text className="text-sm font-semibold text-funding-black">Success fee</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {app.success_fee.feePercent}% от ${app.success_fee.wonAmountUsd.toLocaleString("en-US")} = $
              {app.success_fee.feeAmountUsd.toLocaleString("en-US")}
            </Text>
            <Text className="text-xs text-funding-green mt-1">
              Статус: {SUCCESS_FEE_STATUS_LABELS[app.success_fee.status] ?? app.success_fee.status}
            </Text>
          </View>
        ) : null}

        {nextStatuses.length > 0 ? (
          <View className="mt-4">
            <Text className="text-sm font-semibold text-funding-black mb-2">Следующий статус</Text>
            {nextStatuses.map((next) => (
              <Button
                key={next}
                title={`→ ${getStatusLabel(next)}`}
                variant="secondary"
                className="mb-2"
                loading={statusMutation.isPending && statusMutation.variables === next}
                onPress={() => statusMutation.mutate(next)}
              />
            ))}
          </View>
        ) : null}

        <Text className="text-sm font-semibold text-funding-black mt-6 mb-2">Заметки</Text>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Добавьте заметки по заявке"
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Button
          title="Сохранить заметки"
          className="mt-3"
          loading={notesMutation.isPending}
          onPress={() => notesMutation.mutate()}
        />

        <Button
          title="Документы"
          variant="ghost"
          className="mt-6"
          onPress={() => router.push("/(app)/documents")}
        />

        <Text className="text-xs text-gray-400 mt-6">
          Обновлено: {new Date(app.updated_at).toLocaleDateString("ru-RU")}
        </Text>
      </ScrollView>
    </Screen>
  );
}
