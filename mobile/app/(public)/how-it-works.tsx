import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { GradientHero } from "../../components/design/GradientHero";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";

const STEPS = [
  {
    icon: "person-circle-outline" as const,
    title: "Создайте личный профиль",
    description: "Укажите интересы, опыт и цели — это основа для подбора грантов и программ.",
    href: "/(auth)/login",
  },
  {
    icon: "search-outline" as const,
    title: "Найдите гранты",
    description: "Фильтруйте по секторам, дедлайнам и донорам.",
    href: "/(public)/grants",
  },
  {
    icon: "checkmark-circle-outline" as const,
    title: "Проверьте соответствие",
    description: "Узнайте, подходите ли вы под условия гранта или программы.",
    href: "/(auth)/login",
  },
  {
    icon: "sparkles-outline" as const,
    title: "Сгенерируйте AI-черновик",
    description: "Помощник подготовит структуру заявки под формат донора.",
    href: "/(auth)/login",
  },
  {
    icon: "analytics-outline" as const,
    title: "Отслеживайте заявки",
    description: "Статусы, заметки и история в одном трекере.",
    href: "/(auth)/login",
  },
] as const;

export default function HowItWorksScreen() {
  return (
    <Screen title="Как это работает" showBack largeTitle>
      <ScrollView className="px-5 pt-4" contentContainerClassName="pb-8">
        <Text className="text-body text-gray-600 mb-6 leading-6">
          Пять шагов от регистрации до подачи заявки — всё в одном приложении.
        </Text>

        {STEPS.map((step, i) => (
          <View key={step.title} className="flex-row mb-6">
            <View className="items-center mr-4">
              <View className="w-10 h-10 rounded-full bg-funding-light-green items-center justify-center">
                <Ionicons name={step.icon} size={20} color="#008A2E" />
              </View>
              {i < STEPS.length - 1 ? (
                <View className="w-0.5 flex-1 bg-funding-light-green mt-2 min-h-[24px]" />
              ) : null}
            </View>
            <Link href={step.href as never} asChild>
              <Card className="flex-1 active:opacity-80">
                <Text className="text-overline font-bold text-funding-green mb-1 uppercase">
                  Шаг {i + 1}
                </Text>
                <Text className="font-semibold text-headline text-funding-black">{step.title}</Text>
                <Text className="text-sm text-gray-500 mt-1 leading-5">{step.description}</Text>
              </Card>
            </Link>
          </View>
        ))}

        <GradientHero variant="soft" className="mt-2">
          <Text className="font-bold text-funding-black text-center mb-3 text-headline">
            Готовы начать?
          </Text>
          <Link href="/(auth)/login" asChild>
            <Button title="Начать бесплатно" haptic />
          </Link>
        </GradientHero>
      </ScrollView>
    </Screen>
  );
}
