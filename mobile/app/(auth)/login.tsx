import { useSignIn, useSignUp } from "@clerk/expo/legacy";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FundingProLogo } from "../../components/design/FundingProLogo";
import { OtpInput } from "../../components/design/OtpInput";
import { StepProgress } from "../../components/design/StepProgress";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { safeNotificationSuccess } from "../../lib/haptics";
import { t } from "../../lib/i18n";

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

  const stepNumber = step === "email" ? 1 : 2;

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
        throw new Error("Email-код не настроен");
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
          await safeNotificationSuccess();
          router.replace("/(app)/(tabs)/home");
          return;
        }
        throw new Error("Регистрация не завершена");
      }

      if (!signIn) throw new Error("Сессия входа недоступна");
      const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      if (result.status === "complete" && result.createdSessionId && setSignInActive) {
        await setSignInActive({ session: result.createdSessionId });
        await safeNotificationSuccess();
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
    <SafeAreaView className="flex-1 bg-clay-canvas">
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="flex-grow justify-center py-8"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="p-6">
          <View className="items-center mb-6">
            <FundingProLogo size="lg" />
          </View>

          <StepProgress current={stepNumber} total={2} className="mb-6" />

          <Text className="text-title text-funding-black text-center">Вход</Text>
          <Text className="mt-2 text-sm text-gray-600 text-center">
            {step === "email" ? "Мы отправим код на email" : `Код отправлен на ${email}`}
          </Text>

          {step === "email" ? (
            <>
              <Input
                className="mt-5"
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
                haptic
              />
            </>
          ) : (
            <>
              <OtpInput value={otp} onChange={setOtp} className="mt-5" autoFocus />
              <Button
                title="Подтвердить"
                className="mt-4"
                onPress={verifyOtp}
                disabled={loading || otp.length < 6}
                loading={loading}
                haptic
              />
              <Button
                title="Изменить email"
                variant="ghost"
                className="mt-2"
                onPress={() => {
                  setStep("email");
                  setOtp("");
                }}
              />
            </>
          )}

          {error ? <Text className="mt-4 text-sm text-red-600 text-center">{error}</Text> : null}
        </Card>

        <Button
          title={t.goHome}
          variant="ghost"
          className="mt-6"
          onPress={() => router.replace("/(public)")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
