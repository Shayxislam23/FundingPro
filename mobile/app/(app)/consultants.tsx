import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Screen } from "../../components/ui/Screen";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

export default function ConsultantsScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const consultantsQuery = useQuery({
    queryKey: queryKeys.consultants,
    queryFn: () => api.consultants(),
  });

  const ordersQuery = useQuery({
    queryKey: queryKeys.consultantOrders,
    queryFn: () => api.consultantOrders(),
  });

  const orderMutation = useMutation({
    mutationFn: () => api.createConsultantOrder(selectedId!, message),
    onSuccess: () => {
      setMessage("");
      setSelectedId(null);
      ordersQuery.refetch();
    },
  });

  if (consultantsQuery.isLoading) return <LoadingState />;
  if (consultantsQuery.isError) {
    return <ErrorState message={consultantsQuery.error.message} />;
  }

  return (
    <Screen title="Консультанты" showBack>
      <ScrollView className="p-4">
        {consultantsQuery.data?.consultants.map((c) => (
          <Card key={c.id} className="mb-3">
            <Text className="font-bold text-funding-black">{c.name}</Text>
            {c.title && <Text className="text-sm text-gray-500">{c.title}</Text>}
            <Button title="Заказать" variant="secondary" className="mt-2" onPress={() => setSelectedId(c.id)} />
          </Card>
        ))}

        {selectedId && (
          <Card className="mt-4">
            <Text className="font-semibold mb-2">Сообщение консультанту</Text>
            <Input value={message} onChangeText={setMessage} multiline placeholder="Опишите задачу" />
            <Button
              title="Отправить заказ"
              className="mt-3"
              loading={orderMutation.isPending}
              onPress={() => orderMutation.mutate()}
            />
          </Card>
        )}

        <Text className="text-lg font-bold mt-6 mb-2">Мои заказы</Text>
        {ordersQuery.data?.orders.map((o, i) => (
          <Card key={String(o.id ?? i)} className="mb-2">
            <Text className="text-sm">Статус: {String(o.status ?? "—")}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
