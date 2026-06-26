import { Link, router } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../lib/auth/context";
import { Button } from "../../../components/ui/Button";

const MENU = [
  { label: "Мои заявки", href: "/(app)/tracker" },
  { label: "Документы", href: "/(app)/documents" },
  { label: "Консультанты", href: "/(app)/consultants" },
  { label: "Профиль", href: "/(app)/profile" },
  { label: "Подписка", href: "/(app)/subscription" },
  { label: "Поддержка", href: "/(app)/support" },
] as const;

export default function MoreTab() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-funding-light">
      <ScrollView className="p-4">
        <Text className="text-2xl font-black text-funding-black mb-4">Ещё</Text>
        {MENU.map((item) => (
          <Link key={item.href} href={item.href as never} asChild>
            <Pressable className="py-4 border-b border-gray-100">
              <Text className="text-base text-funding-black">{item.label}</Text>
            </Pressable>
          </Link>
        ))}
        <Button
          title="Выйти"
          variant="danger"
          className="mt-8"
          onPress={async () => {
            await signOut();
            router.replace("/(public)");
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
