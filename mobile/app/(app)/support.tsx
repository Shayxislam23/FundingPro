import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Screen } from "../../components/ui/Screen";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

export default function SupportScreen() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const ticketsQuery = useQuery({
    queryKey: queryKeys.supportTickets,
    queryFn: () => api.supportTickets(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createSupportTicket(subject.trim(), message.trim()),
    onSuccess: () => {
      setSubject("");
      setMessage("");
      ticketsQuery.refetch();
    },
  });

  if (ticketsQuery.isLoading) return <LoadingState />;

  return (
    <Screen title="Поддержка" showBack>
      <ScrollView className="p-4">
        <Input placeholder="Тема" value={subject} onChangeText={setSubject} />
        <Input
          className="mt-3"
          placeholder="Сообщение"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Button
          title="Создать обращение"
          className="mt-3"
          loading={createMutation.isPending}
          onPress={() => createMutation.mutate()}
        />

        <Text className="text-lg font-bold mt-6 mb-2">Мои обращения</Text>
        {(ticketsQuery.data?.tickets ?? []).length === 0 && <EmptyState />}
        {ticketsQuery.data?.tickets.map((t) => (
          <Card key={t.id} className="mb-2">
            <Text className="font-medium">{t.subject}</Text>
            <Text className="text-xs text-gray-500">{t.status}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
