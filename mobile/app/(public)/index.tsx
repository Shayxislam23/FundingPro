import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClaySurface } from "../../components/clay/ClaySurface";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DemoBanner } from "../../components/design/DemoBanner";
import { FundingProLogo } from "../../components/design/FundingProLogo";
import { GradientHero } from "../../components/design/GradientHero";
import { GrantCard } from "../../components/design/GrantCard";
import { SectionHeader } from "../../components/design/SectionHeader";
import { StatPill } from "../../components/design/StatPill";
import { api } from "../../lib/api/client";
import {
  getLandingDonorStats,
  getLandingGrantStats,
  withDonorsFallback,
  withGrantsFallback,
} from "../../lib/public-fallback";
import { queryKeys } from "../../lib/query-keys";

const QUICK_LINKS = [
  { label: "Как это работает", href: "/(public)/how-it-works", icon: "help-circle" as const },
  { label: "Доноры", href: "/(public)/donors", icon: "people" as const },
  { label: "Истории", href: "/(public)/stories", icon: "trophy" as const },
  { label: "Тарифы", href: "/(public)/pricing", icon: "card" as const },
] as const;

export default function PublicLanding() {
  const [email, setEmail] = useState("");
  const [leadDone, setLeadDone] = useState(false);

  const leadMutation = useMutation({
    mutationFn: () => api.submitLeadMagnet(email.trim(), "mobile_landing"),
    onSuccess: () => {
      setLeadDone(true);
      setEmail("");
    },
    onError: (error: Error) => {
      Alert.alert("Не удалось подписаться", error.message);
    },
  });

  const grantsQuery = useQuery({
    queryKey: queryKeys.grants({ landing: true }),
    queryFn: () => api.grants({ limit: 3, featured: true }),
  });
  const donorsQuery = useQuery({
    queryKey: queryKeys.donors,
    queryFn: () => api.donors(),
  });
  const statsQuery = useQuery({
    queryKey: queryKeys.grants({ stats: true }),
    queryFn: () => api.grants({ limit: 1 }),
  });

  const grantsData = withGrantsFallback(grantsQuery.data);
  const featured = grantsData.grants;
  const apiGrantTotal = statsQuery.data?.total ?? grantsQuery.data?.total ?? 0;
  const grantStats = getLandingGrantStats(apiGrantTotal);
  const donorStats = getLandingDonorStats(withDonorsFallback(donorsQuery.data).total);
  const showDemoBanner = grantsData.fromFallback || grantStats.fromFallback;
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const refreshing = grantsQuery.isRefetching || donorsQuery.isRefetching || statsQuery.isRefetching;

  return (
    <SafeAreaView className="flex-1 bg-clay-canvas">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void grantsQuery.refetch();
              void donorsQuery.refetch();
              void statsQuery.refetch();
            }}
          />
        }
      >
        <GradientHero variant="hero">
          <FundingProLogo variant="light" size="lg" />
          <Text className="mt-3 text-body text-white/90 leading-6 max-w-sm">
            Платформа для поиска грантов и подготовки заявок в Узбекистане
          </Text>
        </GradientHero>

        <View className="px-5 -mt-6">
          <View className="flex-row flex-wrap gap-2">
            <StatPill icon="document-text" value={grantStats.value} label={grantStats.label} />
            <StatPill icon="people" value={donorStats.value} label={donorStats.label} />
          </View>

          {showDemoBanner ? <DemoBanner className="mt-3" /> : null}

          <Link href="/(public)/grants" asChild>
            <Button title="Найти грант" className="mt-6" haptic />
          </Link>

          <ClaySurface variant="raised" className="mt-8 rounded-[24px] p-5">
            <Text className="text-base font-bold text-funding-black">Подборка грантов на email</Text>
            <Text className="text-sm text-gray-500 mt-1 leading-5">
              Получите актуальные возможности финансирования для НКО Узбекистана.
            </Text>
            {leadDone ? (
              <Text className="text-sm text-funding-green font-medium mt-4">
                Спасибо! Мы отправим подборку на ваш email.
              </Text>
            ) : (
              <>
                <Input
                  className="mt-4"
                  placeholder="Email для подборки грантов"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  title="Получить подборку"
                  className="mt-3"
                  loading={leadMutation.isPending}
                  onPress={() => leadMutation.mutate()}
                />
              </>
            )}
          </ClaySurface>

          {featured.length > 0 && (
            <View className="mt-8">
              <SectionHeader title="Популярные гранты" actionLabel="Все →" actionHref="/(public)/grants" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-1"
                contentContainerClassName="px-1 pb-1"
                onScroll={(event) => {
                  const offsetX = event.nativeEvent.contentOffset.x;
                  const cardWidth = 288 + 12;
                  setFeaturedIndex(Math.round(offsetX / cardWidth));
                }}
                scrollEventThrottle={16}
              >
                {featured.map((grant) => (
                  <View key={grant.id} className="w-72 mr-3">
                    <Link href={`/(public)/grants/${grant.id}` as never} asChild>
                      <GrantCard grant={grant} compact />
                    </Link>
                  </View>
                ))}
              </ScrollView>
              {featured.length > 1 ? (
                <View className="flex-row justify-center gap-1.5 mt-3">
                  {featured.map((grant, index) => (
                    <View
                      key={grant.id}
                      className={`h-1.5 rounded-full ${
                        index === featuredIndex ? "w-4 bg-funding-green" : "w-1.5 bg-clay-inset"
                      }`}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}

          <Text className="text-overline text-gray-500 mt-8 mb-3 uppercase">Разделы</Text>
          <View className="flex-row flex-wrap gap-3">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href as never} asChild>
                <ClaySurface
                  variant="raised"
                  className="w-[47%] rounded-[24px] p-4 active:opacity-80"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                      <ClaySurface
                        variant="inset"
                        className="w-8 h-8 rounded-lg items-center justify-center"
                      >
                        <Ionicons name={link.icon} size={16} color="#008A2E" />
                      </ClaySurface>
                      <Text className="font-semibold text-funding-black text-sm flex-1" numberOfLines={2}>
                        {link.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </ClaySurface>
              </Link>
            ))}
          </View>

          <View className="mt-10 mb-8 pt-6 border-t border-clay-inset/60">
            <View className="flex-row flex-wrap gap-x-4 gap-y-2 justify-center">
              <Link href="/(public)/about">
                <Text className="text-sm text-gray-500">О платформе</Text>
              </Link>
              <Link href="/(public)/legal">
                <Text className="text-sm text-gray-500">Документы</Text>
              </Link>
              <Link href="/(auth)/login">
                <Text className="text-sm font-semibold text-funding-green">Войти</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
