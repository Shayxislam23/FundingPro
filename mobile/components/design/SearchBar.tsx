import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";
import { cn } from "../cn";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Поиск…",
  onClear,
  className,
}: SearchBarProps) {
  return (
    <View className={cn("flex-row items-center rounded-xl border border-gray-200 bg-white px-3", className)}>
      <Ionicons name="search" size={18} color="#9CA3AF" />
      <TextInput
        className="flex-1 py-3 px-2 text-funding-black"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText("");
            onClear?.();
          }}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </Pressable>
      )}
    </View>
  );
}
