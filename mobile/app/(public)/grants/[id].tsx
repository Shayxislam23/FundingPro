import { useLocalSearchParams, Link } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, Share, Text, View } from "react-native";
import {
  formatDeadlineDisplay,
  formatGrantAmount,
  translateSector,
} from "@fundingpro/shared";
import { Badge } from "../../../components/design/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Screen } from "../../../components/ui/Screen";
import { LoadingState, ErrorState } from "../../../components/ui/States";
import { api } from "../../../lib/api/client";
import { getFallbackGrantDetail, isFallbackGrantId } from "../../../lib/public-fallback";
import { queryKeys } from "../../../lib/query-keys";

const WEB_BASE = "https://www.fundingpro.uz";

async function shareGrant(id: string, title: string) {
  const url = `${WEB_BASE}/grants/${id}`;
  const message = `${title}\n${url}`;

  try {
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) {
      await Share.share({ message, url, title });
      return;
    }
    await Share.share({ message });
    return;
  } catch {
    // expo-sharing native module not in dev client — RN Share works without rebuild
  }

  await Share.share({ message, url, title });
}

export default function PublicGrantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const fallbackGrant = id && isFallbackGrantId(id) ? getFallbackGrantDetail(id) : null;

  const grantQuery = useQuery({
    queryKey: queryKeys.grant(id),
    queryFn: () => api.grant(id),
    enabled: !!id && !isFallbackGrantId(id),
  });

  if (!fallbackGrant && grantQuery.isLoading) return <LoadingState />;
  if (!fallbackGrant && (grantQuery.isError || !grantQuery.data)) {
    return <ErrorState message={grantQuery.error?.message ?? "Не найдено"} />;
  }

  const grant = fallbackGrant ?? grantQuery.data!;
  const title = grant.title_ru ?? grant.title;
  const donor = grant.donor.name_ru ?? grant.donor.name;
  const sector = grant.sectors[0] ? translateSector(grant.sectors[0]) : undefined;

  return (
    <Screen
      title="Грант"
      showBack
      rightAction={{
        icon: "share-outline",
        onPress: () => void shareGrant(grant.id, title),
        accessibilityLabel: "Поделиться",
      }}
    >
      <ScrollView className="p-4">
        {sector && (
          <View className="mb-3">
            <Badge label={sector} variant="sector" />
          </View>
        )}
        <Text className="text-xl font-bold text-funding-black">{title}</Text>
        <Text className="text-sm font-medium text-funding-green mt-2">{donor}</Text>

        <Card className="mt-4 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500">Сумма</Text>
            <Text className="text-sm font-semibold text-funding-black">
              {formatGrantAmount(grant.amount_min, grant.amount_max)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500">Дедлайн</Text>
            <Text className="text-sm font-semibold text-funding-black">
              {formatDeadlineDisplay(grant.deadline)}
            </Text>
          </View>
          {grant.country_scope.length > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">География</Text>
              <Text className="text-sm font-semibold text-funding-black">
                {grant.country_scope.join(", ")}
              </Text>
            </View>
          )}
        </Card>

        {grant.description ? (
          <Text className="text-base text-gray-700 mt-4 leading-6">{grant.description}</Text>
        ) : null}

        <View className="mt-8 gap-3">
          <Link href="/(auth)/login" asChild>
            <Button title="Войти, чтобы сохранить" haptic />
          </Link>
          <Button
            title="Поделиться"
            variant="secondary"
            onPress={() => void shareGrant(grant.id, title)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
