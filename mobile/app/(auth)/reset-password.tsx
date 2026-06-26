import { useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: Array<{ message?: string }> }).errors;
    if (errors?.[0]?.message) return errors[0].message;
  }
  if (err instanceof Error) return err.message;
  return "Не удалось сменить пароль";
}

export default function ResetPasswordScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updatePassword() {
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
      });
      if (result.status === "complete" && result.createdSessionId && setActive) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(app)/(tabs)/home");
        return;
      }
      throw new Error("Сброс пароля не завершён");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-funding-light px-5">
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-black text-funding-black">Новый пароль</Text>
        <Input
          className="mt-6"
          placeholder="Код из email"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
        <Input
          className="mt-3"
          placeholder="Новый пароль"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Сохранить" className="mt-4" onPress={updatePassword} loading={loading} />
        {error && <Text className="mt-4 text-sm text-red-600">{error}</Text>}
      </View>
    </SafeAreaView>
  );
}
