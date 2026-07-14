import * as WebBrowser from "expo-web-browser";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, Text } from "react-native";
import { FundingProLogo } from "../../components/design/FundingProLogo";
import { GradientHero } from "../../components/design/GradientHero";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";

const CONTACTS = [
  { icon: "mail-outline" as const, label: "support@fundingpro.uz", url: "mailto:support@fundingpro.uz" },
  { icon: "globe-outline" as const, label: "fundingpro.uz", url: "https://www.fundingpro.uz" },
] as const;

export default function AboutScreen() {
  return (
    <Screen title="О платформе" showBack largeTitle>
      <ScrollView className="px-5 pt-4" contentContainerClassName="pb-8">
        <GradientHero variant="card" className="mb-6">
          <FundingProLogo variant="light" size="lg" />
          <Text className="text-white/90 mt-4 leading-6 text-body">
            FundingPro помогает бизнесу и молодёжи в Узбекистане находить гранты, стипендии и конкурсы,
            проверять соответствие требованиям и готовить заявки с помощью AI.
          </Text>
        </GradientHero>

        <Card className="mb-4 shadow-card">
          <Text className="font-bold text-headline text-funding-black mb-2">Миссия</Text>
          <Text className="text-sm text-gray-600 leading-5">
            Сделать доступ к международным и локальным возможностям прозрачным и понятным
            для каждого человека — от поиска до подачи заявки.
          </Text>
        </Card>

        <Card className="mb-6 shadow-card">
          <Text className="font-bold text-headline text-funding-black mb-3">Контакты</Text>
          {CONTACTS.map((c) => (
            <Pressable
              key={c.label}
              onPress={() => {
                if (c.url.startsWith("mailto:")) {
                  void Linking.openURL(c.url);
                } else {
                  void WebBrowser.openBrowserAsync(c.url);
                }
              }}
              className="flex-row items-center gap-3 py-2 active:opacity-70"
            >
              <Ionicons name={c.icon} size={20} color="#008A2E" />
              <Text className="text-sm text-funding-green font-medium">{c.label}</Text>
            </Pressable>
          ))}
        </Card>

        <Link href="/(public)/how-it-works">
          <Text className="text-center text-sm text-funding-green font-semibold">
            Как это работает →
          </Text>
        </Link>
      </ScrollView>
    </Screen>
  );
}
