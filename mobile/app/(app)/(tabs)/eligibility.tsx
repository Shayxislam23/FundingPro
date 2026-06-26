import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Screen } from "../../../components/ui/Screen";
import { api } from "../../../lib/api/client";
import { queryKeys } from "../../../lib/query-keys";

export default function EligibilityTab() {
  const [grantId, setGrantId] = useState("");
  const grantsQuery = useQuery({
    queryKey: queryKeys.grants({ eligibility: true }),
    queryFn: () => api.grants({ limit: 20 }),
  });

  const checkMutation = useMutation({
    mutationFn: (id: string) => api.checkEligibility(id),
  });

  return (
    <Screen title="Проверка соответствия">
      <ScrollView className="p-4">
        <Text className="text-sm text-gray-600 mb-4">
          Выберите грант или введите ID для проверки соответствия требованиям.
        </Text>
        <Input placeholder="ID гранта" value={grantId} onChangeText={setGrantId} />
        <Button
          title="Проверить"
          className="mt-3"
          loading={checkMutation.isPending}
          onPress={() => grantId.trim() && checkMutation.mutate(grantId.trim())}
        />

        {grantsQuery.data?.grants.slice(0, 5).map((g) => (
          <Card key={g.id} className="mt-3">
            <Text className="font-medium text-funding-black">{g.title_ru ?? g.title}</Text>
            <Button
              title="Проверить этот"
              variant="secondary"
              className="mt-2"
              onPress={() => checkMutation.mutate(g.id)}
            />
          </Card>
        ))}

        {checkMutation.data && (
          <Card className="mt-4">
            <Text className={`font-bold ${checkMutation.data.eligible ? "text-funding-green" : "text-red-600"}`}>
              {checkMutation.data.eligible ? "Соответствует" : "Не соответствует"}
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
