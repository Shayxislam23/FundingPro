import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export default function PublicLanding() {
  return (
    <SafeAreaView className="flex-1 bg-funding-light">
      <ScrollView className="px-5 py-6">
        <Text className="text-3xl font-black text-funding-black">FundingPro</Text>
        <Text className="mt-2 text-base text-gray-600">
          Платформа для поиска грантов и подготовки заявок в Узбекистане
        </Text>

        <Card className="mt-8">
          <Text className="font-semibold text-funding-black">Найдите подходящий грант</Text>
          <Text className="text-sm text-gray-500 mt-1">Каталог доноров, дедлайны, AI-помощник</Text>
        </Card>

        <View className="mt-6 gap-3">
          <Link href="/(public)/grants" asChild>
            <Button title="Публичные гранты" />
          </Link>
          <Link href="/(public)/how-it-works" asChild>
            <Button title="Как это работает" variant="secondary" />
          </Link>
          <Link href="/(public)/donors" asChild>
            <Button title="Доноры" variant="secondary" />
          </Link>
          <Link href="/(public)/stories" asChild>
            <Button title="Истории успеха" variant="secondary" />
          </Link>
          <Link href="/(auth)/login" asChild>
            <Button title="Войти" variant="ghost" />
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
