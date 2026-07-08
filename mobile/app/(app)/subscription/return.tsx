import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../../components/ui/Button";
import { api } from "../../../lib/api/client";
import { t } from "../../../lib/i18n";
import { safeNotificationSuccess } from "../../../lib/haptics";

type ReturnPhase = "loading" | "success" | "pending" | "error";

const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 2000;

function describePaymentResult(activated: boolean, status: string): { phase: ReturnPhase; message: string } {
  if (activated) {
    return { phase: "success", message: t.paymentSuccess };
  }
  const normalized = status.toLowerCase();
  if (normalized === "paid" || normalized === "completed" || normalized === "success") {
    return { phase: "success", message: t.paymentSuccess };
  }
  if (normalized === "failed" || normalized === "cancelled" || normalized === "canceled") {
    return {
      phase: "error",
      message: "Платёж не завершён. Попробуйте снова или обратитесь в поддержку.",
    };
  }
  return { phase: "pending", message: t.paymentPending };
}

export default function SubscriptionReturnScreen() {
  const params = useLocalSearchParams<{ paymentId?: string }>();
  const paymentId = params.paymentId ?? "";
  const [phase, setPhase] = useState<ReturnPhase>("loading");
  const [message, setMessage] = useState<string>(t.paymentChecking);
  const [attempt, setAttempt] = useState(0);
  const navigatedRef = useRef(false);

  const poll = useCallback(async () => {
    if (!paymentId) {
      setPhase("error");
      setMessage(t.paymentMissingId);
      return;
    }

    setPhase("loading");
    setMessage(t.paymentChecking);

    for (let i = 0; i < POLL_ATTEMPTS; i++) {
      setAttempt(i + 1);
      try {
        const result = await api.pollPaymentReturn(paymentId);
        const outcome = describePaymentResult(result.activated, result.status);
        setPhase(outcome.phase);
        setMessage(outcome.message);

        if (outcome.phase === "success") {
          await safeNotificationSuccess();
          return;
        }
        if (outcome.phase === "error") {
          return;
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : t.paymentCheckFailed;
        if (i === POLL_ATTEMPTS - 1) {
          setPhase("error");
          setMessage(errMsg);
          return;
        }
      }

      if (i < POLL_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
      }
    }

    setPhase("pending");
    setMessage(t.paymentPending);
  }, [paymentId]);

  useEffect(() => {
    void poll();
  }, [poll]);

  useEffect(() => {
    if (phase !== "success" || navigatedRef.current) return;
    const timer = setTimeout(() => {
      navigatedRef.current = true;
      router.replace("/(app)/(tabs)/home");
    }, 2500);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <SafeAreaView className="flex-1 bg-funding-light items-center justify-center p-6">
      {phase === "loading" && (
        <View className="items-center">
          <ActivityIndicator color="#008A2E" size="large" />
          <Text className="text-sm text-gray-600 mt-4 text-center">{message}</Text>
          {attempt > 0 ? (
            <Text className="text-xs text-gray-400 mt-2">
              Попытка {attempt} из {POLL_ATTEMPTS}
            </Text>
          ) : null}
        </View>
      )}

      {phase === "success" && (
        <View className="items-center">
          <Text className="text-2xl mb-2">✓</Text>
          <Text className="text-lg font-bold text-funding-black text-center">{message}</Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">Переход на главную…</Text>
          <Button
            title={t.goHome}
            className="mt-6 w-full"
            onPress={() => router.replace("/(app)/(tabs)/home")}
          />
        </View>
      )}

      {phase === "pending" && (
        <View className="items-center">
          <ActivityIndicator color="#D97706" size="large" />
          <Text className="text-sm text-gray-600 mt-4 text-center">{message}</Text>
          <Button title={t.paymentRetry} className="mt-6 w-full" onPress={() => void poll()} />
          <Button
            title={t.paymentToSubscription}
            variant="ghost"
            className="mt-2"
            onPress={() => router.replace("/(app)/subscription")}
          />
        </View>
      )}

      {phase === "error" && (
        <View className="items-center">
          <Text className="text-2xl mb-2 text-red-500">✕</Text>
          <Text className="text-sm text-red-600 text-center">{message}</Text>
          {paymentId ? (
            <Button title={t.paymentRetry} className="mt-6 w-full" onPress={() => void poll()} />
          ) : null}
          <Button
            title={t.paymentToSubscription}
            variant="secondary"
            className="mt-3"
            onPress={() => router.replace("/(app)/subscription")}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
