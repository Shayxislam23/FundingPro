import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../../components/ui/Button";
import { api } from "../../../lib/api/client";

export default function SubscriptionReturnScreen() {
  const params = useLocalSearchParams<{ paymentId?: string }>();
  const paymentId = params.paymentId ?? "";
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await api.pollPaymentReturn(paymentId);
        if (!cancelled) setStatus(result.status);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  return (
    <SafeAreaView className="flex-1 bg-funding-light items-center justify-center p-6">
      {!paymentId && <Text className="text-red-600">paymentId не указан</Text>}
      {!status && !error && <ActivityIndicator color="#008A2E" size="large" />}
      {status && (
        <View className="items-center">
          <Text className="text-xl font-bold text-funding-black">Статус: {status}</Text>
          <Button title="К подписке" className="mt-6" onPress={() => router.replace("/(app)/subscription")} />
        </View>
      )}
      {error && <Text className="text-red-600">{error}</Text>}
    </SafeAreaView>
  );
}
