import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { Screen } from "../../../components/ui/Screen";
import { Card } from "../../../components/ui/Card";
import { LEGAL_DOCS } from "../../../lib/legal-docs";

const DOC_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  offer: "document-text-outline",
  privacy: "shield-checkmark-outline",
  "ai-processing": "sparkles-outline",
  "payment-terms": "card-outline",
  cookies: "globe-outline",
};

export default function LegalHubScreen() {
  const docs = Object.entries(LEGAL_DOCS);

  return (
    <Screen title="Документы" showBack largeTitle>
      <ScrollView className="px-5 pt-4" contentContainerClassName="pb-8">
        <Text className="text-sm text-gray-500 mb-5 leading-5">
          Юридические документы платформы FundingPro
        </Text>

        {docs.map(([slug, meta]) => (
          <Link key={slug} href={`/(legal)/${slug}` as never} asChild>
            <Card className="mb-3 flex-row items-center gap-3 shadow-card active:opacity-80">
              <View className="w-10 h-10 rounded-xl bg-funding-light-green items-center justify-center">
                <Ionicons name={DOC_ICONS[slug] ?? "document-outline"} size={20} color="#008A2E" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-funding-black">{meta.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Card>
          </Link>
        ))}
      </ScrollView>
    </Screen>
  );
}
