import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, View } from "react-native";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../cn";

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
      <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
        <Ionicons color="#DC2626" name="alert-circle-outline" size={24} />
      </View>
      <Text className="text-center font-medium text-red-600">{message}</Text>
      {onRetry && (
        <Text className="mt-4 font-semibold text-funding-green" onPress={onRetry}>
          Повторить
        </Text>
      )}
    </View>
  );
}

type EmptyStateIconName = ComponentProps<typeof Ionicons>["name"];

type EmptyStateProps = {
  /** @deprecated Use `title` instead */
  message?: string;
  icon?: EmptyStateIconName;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  message,
  icon = "folder-open-outline",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const resolvedTitle = title ?? message ?? "Нет данных";

  return (
    <View className={cn("items-center justify-center px-6 py-12", className)}>
      {icon && (
        <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-funding-light-green">
          <Ionicons color="#008A2E" name={icon} size={24} />
        </View>
      )}
      <Text className="mb-2 text-center text-base font-semibold text-funding-black">{resolvedTitle}</Text>
      {description && (
        <Text className="max-w-xs text-center text-sm text-gray-400">{description}</Text>
      )}
      {action && <View className="mt-6">{action}</View>}
    </View>
  );
}
