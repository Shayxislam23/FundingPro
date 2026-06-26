import { ActivityIndicator, Text, View } from "react-native";

export function LoadingState({ message = "Загрузка…" }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <ActivityIndicator color="#008A2E" size="large" />
      <Text className="mt-3 text-gray-500">{message}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-center text-red-600">{message}</Text>
      {onRetry && (
        <Text className="mt-4 text-funding-green font-semibold" onPress={onRetry}>
          Повторить
        </Text>
      )}
    </View>
  );
}

export function EmptyState({ message = "Нет данных" }: { message?: string }) {
  return (
    <View className="items-center justify-center p-8">
      <Text className="text-gray-500">{message}</Text>
    </View>
  );
}
