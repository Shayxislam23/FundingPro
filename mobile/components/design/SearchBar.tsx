import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";
import { ClaySurface } from "../clay/ClaySurface";
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
    <ClaySurface variant="inset" radius="input" className={cn("overflow-hidden", className)}>
      <View className="flex-row items-center px-3">
        <Ionicons name="search" size={18} color="#6B7F70" />
        <TextInput
          className="flex-1 py-3 px-2 text-funding-black bg-transparent"
          placeholder={placeholder}
          placeholderTextColor="#6B7F70"
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
            <Ionicons name="close-circle" size={18} color="#6B7F70" />
          </Pressable>
        )}
      </View>
    </ClaySurface>
  );
}
