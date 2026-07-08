import { ScrollView, Text } from "react-native";
import { Screen } from "../../../components/ui/Screen";
import { Card } from "../../../components/ui/Card";

export default function AiDisclosureScreen() {
  return (
    <Screen title="Раскрытие AI" showBack>
      <ScrollView className="p-4">
        <Card>
          <Text className="text-base text-gray-700 leading-6">
            FundingPro использует искусственный интеллект для генерации черновиков заявок на гранты.
            Сгенерированный текст является рекомендацией и требует проверки и редактирования перед подачей.
            Данные вашего профиля могут обрабатываться для персонализации результата в соответствии с
            политикой конфиденциальности.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
