import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { cn } from "../cn";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function SectionHeader({ title, actionLabel, actionHref, onAction, className }: SectionHeaderProps) {
  const actionContent = actionLabel ? (
    <Pressable onPress={onAction} className="active:opacity-70">
      <Text className="text-sm font-semibold text-funding-green">{actionLabel}</Text>
    </Pressable>
  ) : null;

  return (
    <View className={cn("flex-row items-center justify-between mb-3", className)}>
      <Text className="text-lg font-bold text-funding-black">{title}</Text>
      {actionHref ? (
        <Link href={actionHref as never} asChild>
          {actionContent}
        </Link>
      ) : (
        actionContent
      )}
    </View>
  );
}
