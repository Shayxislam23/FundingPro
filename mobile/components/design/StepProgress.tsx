import { Text, View } from "react-native";
import { cn } from "../cn";

type StepProgressProps = {
  current: number;
  total: number;
  labels?: string[];
  className?: string;
};

export function StepProgress({ current, total, labels, className }: StepProgressProps) {
  return (
    <View className={cn("w-full", className)}>
      {labels && labels.length > 0 ? (
        <View className="flex-row justify-between mb-2 px-0.5">
          {labels.map((label, index) => {
            const step = index + 1;
            const active = step <= current;
            return (
              <Text
                key={label}
                className={cn(
                  "text-caption flex-1 text-center",
                  active ? "text-funding-green font-semibold" : "text-gray-400"
                )}
                numberOfLines={1}
              >
                {label}
              </Text>
            );
          })}
        </View>
      ) : null}
      <View className="flex-row gap-2">
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1;
          const active = step <= current;
          return (
            <View
              key={step}
              className={cn("h-1 flex-1 rounded-full", active ? "bg-funding-green" : "bg-gray-200")}
            />
          );
        })}
      </View>
      <Text className="mt-2 text-center text-caption text-gray-500">
        Шаг {current} из {total}
      </Text>
    </View>
  );
}
