import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { FundingProLogo } from "../design/FundingProLogo";
import { GradientHero } from "../design/GradientHero";
import { Button } from "../ui/Button";

const STORAGE_KEY = "fundingpro:guest-carousel-seen";

const SLIDES = [
  {
    icon: "search" as const,
    title: "Найдите грант",
    description: "Каталог доноров, дедлайны и фильтры по секторам для бизнеса и молодёжи Узбекистана.",
  },
  {
    icon: "checkmark-circle" as const,
    title: "Проверьте соответствие",
    description: "Узнайте, подходите ли вы под условия гранта, до подачи заявки.",
  },
  {
    icon: "sparkles" as const,
    title: "AI-помощник",
    description: "Сгенерируйте черновик заявки и отслеживайте статус в одном приложении.",
  },
];

type GuestCarouselProps = {
  visible: boolean;
  onComplete: () => void;
};

export async function hasSeenGuestCarousel(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function markGuestCarouselSeen(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, "true");
}

export function GuestCarousel({ visible, onComplete }: GuestCarouselProps) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const width = Dimensions.get("window").width;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(next);
  }

  async function finish() {
    await markGuestCarouselSeen();
    onComplete();
  }

  function next() {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    void finish();
  }

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView className="flex-1 bg-funding-light">
        <GradientHero variant="strip" />

        <View className="px-5 pt-4 flex-row items-center justify-between">
          <FundingProLogo size="md" />
          <Pressable onPress={() => void finish()} hitSlop={8}>
            <Text className="text-sm text-gray-500">Пропустить</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => (
            <View style={{ width }} className="flex-1 px-8 justify-center items-center">
              <View className="w-20 h-20 rounded-3xl bg-funding-light-green items-center justify-center mb-8">
                <Ionicons name={item.icon} size={36} color="#008A2E" />
              </View>
              <Text className="text-2xl font-black text-funding-black text-center mb-3">
                {item.title}
              </Text>
              <Text className="text-base text-gray-500 text-center leading-6 max-w-sm">
                {item.description}
              </Text>
            </View>
          )}
        />

        <View className="px-5 pb-8">
          <View className="flex-row justify-center gap-2 mb-6">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={`h-2 rounded-full ${i === index ? "w-6 bg-funding-green" : "w-2 bg-gray-300"}`}
              />
            ))}
          </View>
          <Button
            title={index === SLIDES.length - 1 ? "Начать" : "Далее"}
            haptic
            onPress={next}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
