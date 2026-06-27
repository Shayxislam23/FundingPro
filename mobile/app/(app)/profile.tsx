import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Linking, ScrollView, Text } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Screen } from "../../components/ui/Screen";
import { LoadingState } from "../../components/ui/States";
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
  const [sector, setSector] = useState("");

  const updateMutation = useMutation({
    mutationFn: () => api.updateOrganization({ name, sector }),
    onSuccess: () => orgQuery.refetch(),
  });

  const deleteRequestMutation = useMutation({
    mutationFn: () => api.createSupportTicket(DELETE_SUBJECT, DELETE_MESSAGE),
    onSuccess: () => {
      Alert.alert(
        "Запрос отправлен",
        "Мы обработаем удаление аккаунта в течение 30 дней. Вы получите подтверждение на email."
      );
    },
    onError: () => {
      Alert.alert(
        "Не удалось отправить запрос",
        "Напишите нам на support@fundingpro.uz или создайте обращение в разделе «Поддержка»."
      );
    },
  });

  const org = orgQuery.data?.organization;

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
    <Screen title="Профиль организации" showBack>
      <ScrollView className="p-4">
        <Card>
          <Text className="text-xs text-gray-400 uppercase">Организация</Text>
          <Input
            className="mt-2"
            placeholder="Название"
            defaultValue={org?.name ?? ""}
            onChangeText={setName}
          />
          <Input
            className="mt-3"
            placeholder="Сектор"
            defaultValue={org?.sector ?? ""}
            onChangeText={setSector}
          />
          <Button
            title="Сохранить"
            className="mt-4"
            loading={updateMutation.isPending}
            onPress={() => updateMutation.mutate()}
          />
        </Card>
        {org?.verified && (
          <Text className="text-funding-green text-sm mt-3">✓ Организация верифицирована</Text>
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
