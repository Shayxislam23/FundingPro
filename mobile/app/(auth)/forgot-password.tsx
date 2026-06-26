import { useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: { message?: string }[] }).errors;
    if (errors?.[0]?.message) return errors[0].message;
  }
  if (err instanceof Error) return err.message;
  return "Не удалось отправить код";
}

export default function ForgotPasswordScreen() {
  const { isLoaded, signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendReset() {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      const resetFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === "reset_password_email_code"
      );
      if (!resetFactor || !("emailAddressId" in resetFactor)) {
        throw new Error("Сброс пароля не настроен в Clerk");
      }
      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: resetFactor.emailAddressId,
      });
      setSent(true);
      router.push("/(auth)/reset-password");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-funding-light px-5">
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-black text-funding-black">Сброс пароля</Text>
        {sent ? (
          <Text className="mt-4 text-gray-600">Проверьте email — код для сброса отправлен.</Text>
        ) : (
          <>
            <Input
              className="mt-6"
              placeholder="email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button title="Отправить код" className="mt-4" onPress={sendReset} loading={loading} />
          </>
        )}
        {error && <Text className="mt-4 text-sm text-red-600">{error}</Text>}
        <Button title="Назад" variant="ghost" className="mt-6" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
