import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: { message?: string }[] }).errors;
    if (errors?.[0]?.message) return errors[0].message;
  }
  if (err instanceof Error) return err.message;
  return "Ошибка входа";
}

export default function LoginScreen() {
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSignUp, setUsingSignUp] = useState(false);

  async function sendOtp() {
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;
    setLoading(true);
    setError(null);
    const identifier = email.trim();

    try {
      await signIn.create({ identifier });
      const emailCodeFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code"
      );
      if (!emailCodeFactor || !("emailAddressId" in emailCodeFactor)) {
        throw new Error("Email-код не настроен в Clerk");
      }
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor.emailAddressId,
      });
      setUsingSignUp(false);
      setStep("otp");
    } catch (signInErr) {
      try {
        await signUp.create({ emailAddress: identifier });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setUsingSignUp(true);
        setStep("otp");
      } catch (signUpErr) {
        setError(clerkErrorMessage(signUpErr ?? signInErr));
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!signInLoaded || !signUpLoaded) return;
    setLoading(true);
    setError(null);
    const code = otp.trim();

    try {
      if (usingSignUp && signUp && setSignUpActive) {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete" && result.createdSessionId) {
          await setSignUpActive({ session: result.createdSessionId });
          router.replace("/(app)/(tabs)/home");
          return;
        }
        throw new Error("Регистрация не завершена");
      }

      if (!signIn) throw new Error("Сессия входа недоступна");
      const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      if (result.status === "complete" && result.createdSessionId && setSignInActive) {
        await setSignInActive({ session: result.createdSessionId });
        router.replace("/(app)/(tabs)/home");
        return;
      }
      throw new Error("Вход не завершён");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-funding-light px-5">
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-black text-funding-black">Вход</Text>
        <Text className="mt-2 text-gray-600">Код на email — через Clerk</Text>

        {step === "email" ? (
          <>
            <Input
              className="mt-6"
              placeholder="email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button
              title="Получить код"
              className="mt-4"
              onPress={sendOtp}
              disabled={loading || !email.trim()}
              loading={loading}
            />
          </>
        ) : (
          <>
            <Input
              className="mt-6"
              placeholder="6-значный код"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
            />
            <Button
              title="Подтвердить"
              className="mt-4"
              onPress={verifyOtp}
              disabled={loading || otp.length < 6}
              loading={loading}
            />
          </>
        )}

        {error && <Text className="mt-4 text-sm text-red-600">{error}</Text>}

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable className="mt-6">
            <Text className="text-center text-funding-green">Забыли пароль?</Text>
          </Pressable>
        </Link>

        <Link href="/(public)" asChild>
          <Pressable className="mt-4">
            <Text className="text-center text-gray-500">На главную</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
