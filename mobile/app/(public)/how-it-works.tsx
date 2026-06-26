import { ScrollView, Text } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";

export default function HowItWorksScreen() {
  const steps = [
    "Создайте профиль организации",
    "Найдите гранты по секторам и дедлайнам",
    "Проверьте соответствие требованиям",
    "Сгенерируйте AI-черновик заявки",
    "Отслеживайте статус заявок",
  ];

  return (
    <Screen title="Как это работает" showBack>
      <ScrollView className="p-4 gap-3">
        {steps.map((step, i) => (
          <Card key={step}>
            <Text className="text-funding-green font-bold">Шаг {i + 1}</Text>
            <Text className="text-funding-black mt-1">{step}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
