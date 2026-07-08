import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Screen } from "../../components/ui/Screen";
import { LoadingState } from "../../components/ui/States";
import { ClaySurface } from "../../components/clay/ClaySurface";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

const DELETE_SUBJECT = "Запрос на удаление аккаунта";
const DELETE_MESSAGE =
  "Прошу удалить мой аккаунт FundingPro и связанные персональные данные в соответствии с политикой конфиденциальности.";

export default function ProfileScreen() {
  const orgQuery = useQuery({
    queryKey: queryKeys.organization,
    queryFn: () => api.organization(),
  });

  const [name, setName] = useState("");
  const [country, setCountry] = useState("Uzbekistan");
  const [sector, setSector] = useState("");
  const [description, setDescription] = useState("");

  const org = orgQuery.data?.organization;

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setCountry(org.country ?? "Uzbekistan");
    setSector(org.sector ?? "");
    setDescription(org.description ?? "");
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateOrganization({
        name,
        type: "INDIVIDUAL",
        country,
        sector,
        description,
      }),
    onSuccess: () => orgQuery.refetch(),
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async () => {
      try {
        return await api.requestAccountDeletion();
      } catch (primaryError) {
        try {
          await api.createSupportTicket(DELETE_SUBJECT, DELETE_MESSAGE);
          return { fallback: true as const };
        } catch {
          throw primaryError;
        }
      }
    },
    onSuccess: (result) => {
      if ("fallback" in result && result.fallback) {
        Alert.alert(
          "Запрос отправлен",
          "API недоступен — мы получили обращение в поддержку. Удаление будет обработано в течение 30 дней."
        );
        return;
      }
      Alert.alert(
        "Запрос принят",
        "Аккаунт помечен на удаление. Данные будут удалены в течение 30 дней. Вы получите подтверждение на email."
      );
    },
    onError: () => {
      Alert.alert(
        "Не удалось отправить запрос",
        "Напишите нам на support@fundingpro.uz или создайте обращение в разделе «Поддержка»."
      );
    },
  });

  if (orgQuery.isLoading) return <LoadingState />;

  const requestAccountDeletion = () => {
    Alert.alert(
      "Удалить аккаунт?",
      "Ваш профиль, заявки и документы будут удалены после проверки. Это действие необратимо.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Запросить удаление",
          style: "destructive",
          onPress: () => deleteRequestMutation.mutate(),
        },
      ]
    );
  };

  return (
    <Screen title="Личный профиль" showBack>
      <ScrollView className="p-4">
        <Card>
          <Text className="text-xs text-gray-400 uppercase">Профиль</Text>
          <Input
            className="mt-2"
            placeholder="Ваше имя"
            value={name}
            onChangeText={setName}
          />
          <Input
            className="mt-3"
            placeholder="Страна"
            value={country}
            onChangeText={setCountry}
          />
          <Input
            className="mt-3"
            placeholder="Сектор"
            value={sector}
            onChangeText={setSector}
          />
          <Text className="text-xs text-gray-400 uppercase mt-4">Описание</Text>
          <ClaySurface variant="inset" radius="input" className="mt-2 overflow-hidden">
            <TextInput
              className="px-4 py-3 text-funding-black bg-transparent min-h-[88px]"
              placeholder="Кратко опишите ваш опыт, интересы и цели"
              placeholderTextColor="#6B7F70"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </ClaySurface>
          <Button
            title="Сохранить"
            className="mt-4"
            loading={updateMutation.isPending}
            onPress={() => updateMutation.mutate()}
          />
        </Card>
        {org?.verified && (
          <Text className="text-funding-green text-sm mt-3">✓ Профиль подтверждён</Text>
        )}

        <Card className="mt-6">
          <Text className="text-xs text-gray-400 uppercase">Аккаунт</Text>
          <Text className="text-sm text-gray-600 mt-2 leading-relaxed">
            Вы можете запросить удаление аккаунта и персональных данных. Обработка занимает до 30 дней.
          </Text>
          <Button
            title="Запросить удаление аккаунта"
            variant="danger"
            className="mt-4"
            loading={deleteRequestMutation.isPending}
            onPress={requestAccountDeletion}
          />
          <Text
            className="text-funding-green text-sm mt-3 underline"
            onPress={() => Linking.openURL("https://www.fundingpro.uz/legal/privacy")}
          >
            Политика конфиденциальности
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
