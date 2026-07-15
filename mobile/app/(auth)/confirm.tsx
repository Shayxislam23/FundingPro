import { useSignIn, useSignUp } from "@clerk/expo/legacy";
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
  return "Ошибка подтверждения";
}

export default function ConfirmScreen() {
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    const code = otp.trim();
    const identifier = email.trim();

    try {
      if (signUp?.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete" && result.createdSessionId && setSignUpActive) {
          await setSignUpActive({ session: result.createdSessionId });
          router.replace("/(app)/(tabs)/home");
          return;
        }
      }

      if (!signIn) throw new Error("Сессия входа недоступна");
      if (!signIn.identifier) {
        await signIn.create({ identifier });
      }
      const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      if (result.status === "complete" && result.createdSessionId && setSignInActive) {
        await setSignInActive({ session: result.createdSessionId });
        router.replace("/(app)/(tabs)/home");
        return;
      }
      throw new Error("Подтверждение не завершено");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-funding-light px-5">
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-black text-funding-black">Подтверждение email</Text>
        <Input className="mt-6" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <Input className="mt-3" placeholder="Код" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
        <Button title="Подтвердить" className="mt-4" onPress={confirm} loading={loading} />
        {error && <Text className="mt-4 text-sm text-red-600">{error}</Text>}
      </View>
    </SafeAreaView>
  );
}
