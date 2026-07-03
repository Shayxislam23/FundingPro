import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { LabJourney } from "@fundingpro/api-types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Screen } from "../../components/ui/Screen";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { LAB_INTERESTS, LAB_STATE_LABELS, LAB_STEPS } from "../../components/lab/labSteps";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

const CERT_LABELS: Record<string, string> = {
  profile: "Заполненный профиль",
  cv: "CV загружено",
  motivation: "Мотивационное письмо",
  linkedin: "Профиль LinkedIn",
  opportunities: "10 выбранных возможностей",
  application: "1 реальная заявка",
  attendance: "Посещаемость ≥70% (отмечает ментор)",
};

export default function LabJourneyScreen() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    city: "",
    telegram: "",
    educationStatus: "",
    linkedinUrl: "",
    interests: [] as string[],
  });

  const journeyQuery = useQuery({
    queryKey: queryKeys.labJourney,
    queryFn: () => api.labJourney(),
  });

  useEffect(() => {
    const profile = journeyQuery.data?.profile;
    if (!profile) return;
    setForm({
      fullName: profile.fullName ?? "",
      age: profile.age != null ? String(profile.age) : "",
      city: profile.city ?? "",
      telegram: profile.telegram ?? "",
      educationStatus: profile.educationStatus ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      interests: profile.interests,
    });
  }, [journeyQuery.data?.profile]);

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.updateLabProfile>[0]) => api.updateLabProfile(payload),
    onSuccess: (data: LabJourney) => {
      queryClient.setQueryData(queryKeys.labJourney, data);
    },
  });

  if (journeyQuery.isLoading) return <LoadingState />;
  if (journeyQuery.isError || !journeyQuery.data) {
    return <ErrorState message={journeyQuery.error?.message ?? "Не удалось загрузить журнал"} />;
  }

  const journey = journeyQuery.data;
  const stepsById = new Map(journey.steps.map((s) => [s.id, s]));
  const nextMeta = LAB_STEPS.find((s) => s.id === journey.nextStepId);

  const toggleInterest = (id: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(id) ? f.interests.filter((i) => i !== id) : [...f.interests, id],
    }));

  const saveProfile = () =>
    updateMutation.mutate({
      fullName: form.fullName,
      age: form.age ? Number(form.age) : undefined,
      city: form.city,
      telegram: form.telegram,
      educationStatus: form.educationStatus,
      linkedinUrl: form.linkedinUrl,
      interests: form.interests,
    });

  return (
    <Screen title="Opportunities Lab" showBack scrollable>
      <View className="mt-4">
        <Text className="text-sm text-gray-500">Мой путь участника</Text>
        <Text className="text-xs text-gray-400 mt-1">
          Платформа шаг за шагом ведёт вас от регистрации до первой реальной заявки.
        </Text>
      </View>

      {/* Progress */}
      <Card className="mt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-funding-black">Общий прогресс</Text>
          <Text className="text-sm font-bold text-funding-green">{journey.progressPercent}%</Text>
        </View>
        <View className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <View className="h-full rounded-full bg-funding-green" style={{ width: `${journey.progressPercent}%` }} />
        </View>
      </Card>

      {/* Next action */}
      {nextMeta ? (
        <Card className="mt-4 border-funding-green/30 bg-green-50">
          <Text className="text-[10px] font-semibold uppercase tracking-wide text-funding-green mb-1">
            Следующее действие
          </Text>
          <Text className="text-base font-bold text-funding-black">{nextMeta.label}</Text>
          <Text className="text-sm text-gray-600 mt-1">{nextMeta.description}</Text>
          <Text className="text-xs text-funding-green mt-1 italic">{nextMeta.hint}</Text>
        </Card>
      ) : null}

      {/* Checklist */}
      <Card className="mt-4">
        <Text className="text-sm font-semibold text-funding-black mb-3">Чеклист программы</Text>
        <View className="gap-2">
          {LAB_STEPS.map((meta, index) => {
            const step = stepsById.get(meta.id);
            const state = step?.state ?? "not_started";
            return (
              <View
                key={meta.id}
                className={`flex-row items-start gap-3 rounded-xl border p-3 ${
                  step?.done ? "bg-gray-50 border-gray-100 opacity-80" : "bg-white border-gray-200"
                }`}
              >
                <View className="flex-1">
                  <Text className="text-sm font-medium text-funding-black">
                    {index + 1}. {meta.label}
                  </Text>
                  <Text className="text-xs text-gray-400 italic">{meta.hint}</Text>
                </View>
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor:
                      state === "needs_revision" ? "#FEF3C7" : step?.done ? "#D9F7DD" : "#F3F4F6",
                  }}
                >
                  <Text
                    className="text-[10px] font-semibold"
                    style={{
                      color: state === "needs_revision" ? "#B45309" : step?.done ? "#008A2E" : "#6B7280",
                    }}
                  >
                    {LAB_STATE_LABELS[state]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        <Text className="text-xs text-gray-400 mt-3">
          Сохранено возможностей: {journey.savedGrantsCount}/{journey.opportunitiesTarget}
        </Text>
      </Card>

      {/* Certificate */}
      <Card className="mt-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-sm font-semibold text-funding-black">Прогресс сертификата</Text>
          {journey.certificate.eligible ? (
            <View className="rounded-full bg-green-50 px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-funding-green">Вы готовы!</Text>
            </View>
          ) : null}
        </View>
        <View className="gap-1.5 mt-1">
          {journey.certificate.requirements.map((r) => (
            <Text key={r.id} className={`text-sm ${r.done ? "text-gray-400" : "text-funding-black"}`}>
              {r.done ? "✓" : "○"} {CERT_LABELS[r.id] ?? r.id}
            </Text>
          ))}
        </View>
      </Card>

      {/* Profile form */}
      <Card className="mt-4">
        <Text className="text-sm font-semibold text-funding-black mb-3">Профиль участника</Text>
        <View className="gap-3">
          <Input placeholder="ФИО" value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} />
          <Input
            placeholder="Возраст"
            keyboardType="number-pad"
            value={form.age}
            onChangeText={(v) => setForm({ ...form, age: v })}
          />
          <Input placeholder="Город / район" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
          <Input
            placeholder="Telegram (@username)"
            value={form.telegram}
            onChangeText={(v) => setForm({ ...form, telegram: v })}
          />
          <Input
            placeholder="Статус обучения"
            value={form.educationStatus}
            onChangeText={(v) => setForm({ ...form, educationStatus: v })}
          />
          <Input
            placeholder="Ссылка LinkedIn"
            value={form.linkedinUrl}
            onChangeText={(v) => setForm({ ...form, linkedinUrl: v })}
          />
        </View>

        <Text className="text-sm text-gray-500 mt-4 mb-2">Интересы</Text>
        <View className="flex-row flex-wrap gap-2">
          {LAB_INTERESTS.map((interest) => {
            const active = form.interests.includes(interest.id);
            return (
              <Pressable
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                className={`rounded-full px-3 py-1.5 border ${
                  active ? "border-funding-green/40 bg-green-50" : "border-gray-200 bg-white"
                }`}
              >
                <Text className={`text-xs font-medium ${active ? "text-funding-green" : "text-gray-500"}`}>
                  {interest.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          title="Сохранить профиль"
          className="mt-4"
          loading={updateMutation.isPending}
          onPress={saveProfile}
        />
      </Card>

      {/* Self-report actions */}
      <Card className="mt-4 mb-4">
        <Text className="text-sm font-semibold text-funding-black mb-3">Отметки о выполнении</Text>

        <Text className="text-sm text-funding-black">CV</Text>
        <Text className="text-xs text-gray-400 mb-2">
          Загрузите CV в «Документы» или отметьте статус.
        </Text>
        <View className="flex-row gap-2 mb-4">
          <Button
            title="CV готово"
            variant="secondary"
            className="flex-1"
            onPress={() => updateMutation.mutate({ cvStatus: "uploaded" })}
          />
          <Button
            title="Нужна помощь"
            variant="ghost"
            className="flex-1"
            onPress={() => updateMutation.mutate({ cvStatus: "help_requested" })}
          />
        </View>

        <Text className="text-sm text-funding-black">Мотивационное письмо</Text>
        <Text className="text-xs text-gray-400 mb-2">
          Черновик поможет составить AI-помощник в разделе «AI».
        </Text>
        <Button
          title="Письмо готово"
          variant="secondary"
          className="mb-4"
          disabled={stepsById.get("motivation")?.done}
          onPress={() => updateMutation.mutate({ motivationLetterStatus: "submitted" })}
        />

        <Text className="text-sm text-funding-black">Подтверждение заявки</Text>
        <Text className="text-xs text-gray-400 mb-2">
          Загрузите пруф в «Документы» и отметьте подачу.
        </Text>
        <Button
          title="Заявка подана"
          variant="secondary"
          disabled={stepsById.get("proof")?.done}
          onPress={() => updateMutation.mutate({ applicationProofStatus: "submitted" })}
        />

        <Button
          title="Открыть каталог грантов"
          variant="ghost"
          className="mt-6"
          onPress={() => router.push("/(app)/(tabs)/grants")}
        />
      </Card>
    </Screen>
  );
}
