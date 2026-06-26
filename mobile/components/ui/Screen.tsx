import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "../cn";

type ScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    accessibilityLabel?: string;
  };
};

export function ScreenHeader({ title, showBack = true, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center px-5 py-3 border-b border-gray-100 bg-white">
      {showBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          className="mr-2 p-1 active:opacity-70"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#008A2E" />
        </Pressable>
      ) : (
        <View className="w-8" />
      )}
      <Text className="text-headline font-bold text-funding-black flex-1" numberOfLines={1}>
        {title}
      </Text>
      {rightAction ? (
        <Pressable
          onPress={rightAction.onPress}
          className="p-1 active:opacity-70"
          hitSlop={8}
          accessibilityLabel={rightAction.accessibilityLabel}
        >
          <Ionicons name={rightAction.icon} size={22} color="#008A2E" />
        </Pressable>
      ) : (
        <View className="w-8" />
      )}
    </View>
  );
}

function LargeTitleHeader({
  title,
  showBack = true,
  onBack,
}: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <View className="px-5 pt-2 pb-4 bg-white border-b border-gray-100">
      {showBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          className="self-start -ml-1 p-1 mb-2 active:opacity-70"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#008A2E" />
        </Pressable>
      ) : null}
      <Text className="text-display text-funding-black">{title}</Text>
    </View>
  );
}

export function Screen({
  children,
  title,
  showBack,
  onBack,
  rightAction,
  largeTitle,
  scrollable,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ScreenHeaderProps["rightAction"];
  largeTitle?: boolean;
  scrollable?: boolean;
  className?: string;
}) {
  const header =
    title && largeTitle ? (
      <LargeTitleHeader title={title} showBack={showBack} onBack={onBack} />
    ) : title ? (
      <ScreenHeader title={title} showBack={showBack} onBack={onBack} rightAction={rightAction} />
    ) : null;

  const body = scrollable ? (
    <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <SafeAreaView className={cn("flex-1 bg-funding-light", className)} edges={["top"]}>
      {header}
      {body}
    </SafeAreaView>
  );
}
