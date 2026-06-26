import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Screen } from "../../components/ui/Screen";
import { LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

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

  const org = orgQuery.data?.organization;

  if (orgQuery.isLoading) return <LoadingState />;

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
      </ScrollView>
    </Screen>
  );
}
