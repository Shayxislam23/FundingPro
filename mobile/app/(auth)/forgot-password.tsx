import { useSignIn } from "@clerk/expo/legacy";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FundingProLogo } from "../../components/design/FundingProLogo";
import { GradientHero } from "../../components/design/GradientHero";
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
        throw new Error("Сброс пароля недоступен для этого аккаунта");
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
    <SafeAreaView className="flex-1 bg-funding-light">
      <GradientHero variant="strip" />
      <View className="flex-1 px-5 justify-center">
        <View className="items-center mb-6">
          <FundingProLogo size="lg" />
        </View>
        <Text className="text-2xl font-black text-funding-black text-center">Сброс пароля</Text>
        <Text className="mt-2 text-gray-600 text-center text-sm">
          Доступен только для аккаунтов с паролем
        </Text>
        {sent ? (
          <Text className="mt-6 text-gray-600 text-center">
            Проверьте email — код для сброса отправлен.
          </Text>
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
            <Button title="Отправить код" className="mt-4" onPress={sendReset} loading={loading} haptic />
          </>
        )}
        {error && <Text className="mt-4 text-sm text-red-600 text-center">{error}</Text>}
        <Button title="Назад" variant="ghost" className="mt-6" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
