import { useCallback, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  buildPartnerWebViewUrl,
  getMobilePartnerChannel,
} from "../../lib/partner/channels";
import { getApiBaseUrl } from "../../lib/config";
import { CLAY_COLORS } from "../../lib/clay-styles";

export default function PartnerWebViewScreen() {
  const router = useRouter();
  const { channel: channelParam, lang, session } = useLocalSearchParams<{
    channel?: string;
    lang?: string;
    session?: string;
  }>();
  const [reloadKey, setReloadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const channelSlug = String(channelParam ?? "zoomrad");
  const channel = getMobilePartnerChannel(channelSlug);

  const onRetry = useCallback(() => {
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }, []);

  if (!channel) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-clay-canvas px-6">
        <Text className="text-center text-base text-neutral-700">
          Канал «{channelSlug}» не настроен. Добавьте конфигурацию в lib/partner/channels.ts.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-xl px-4 py-3"
          style={{ backgroundColor: CLAY_COLORS.green }}
        >
          <Text className="text-center text-sm font-semibold text-white">Назад</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const uri = buildPartnerWebViewUrl(getApiBaseUrl(), channel, {
    lang: lang === "uz" ? "uz" : "ru",
    session: typeof session === "string" ? session : undefined,
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* Slim chrome only — ZoomradShell already has its own header/nav */}
      <View className="flex-row items-center justify-between border-b border-neutral-100 px-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
          onPress={() => router.back()}
          hitSlop={8}
          className="rounded-lg px-2 py-1"
        >
          <Text className="text-sm font-semibold" style={{ color: CLAY_COLORS.green }}>
            ← Закрыть
          </Text>
        </Pressable>
        <View
          className="rounded-full px-2 py-1"
          style={{ backgroundColor: channel.primaryColor }}
        >
          <Text className="text-xs font-semibold text-white">
            {channel.displayName} · {channel.badgeLabel}
          </Text>
        </View>
      </View>

      {loadError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center text-base text-neutral-800">{loadError}</Text>
          <Text className="text-center text-xs text-neutral-500">{uri}</Text>
          <Pressable
            onPress={onRetry}
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: channel.primaryColor }}
          >
            <Text className="text-sm font-semibold text-white">Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={reloadKey}
          source={{ uri }}
          startInLoadingState
          renderLoading={() => (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={channel.primaryColor} size="large" />
            </View>
          )}
          onError={() =>
            setLoadError("Не удалось загрузить мини-приложение. Проверьте сеть и API URL.")
          }
          onHttpError={(event) => {
            const status = event.nativeEvent.statusCode;
            if (status >= 400) {
              setLoadError(`Сервер ответил ${status}. Попробуйте ещё раз.`);
            }
          }}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
        />
      )}
    </SafeAreaView>
  );
}
