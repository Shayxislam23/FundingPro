import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  buildPartnerWebViewUrl,
  getMobilePartnerChannel,
} from "../../lib/partner/channels";
import { getApiBaseUrl } from "../../lib/config";

export default function PartnerWebViewScreen() {
  const { channel: channelParam, lang, session } = useLocalSearchParams<{
    channel?: string;
    lang?: string;
    session?: string;
  }>();

  const channelSlug = String(channelParam ?? "zoomrad");
  const channel = getMobilePartnerChannel(channelSlug);

  if (!channel) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-clay-canvas px-6">
        <Text className="text-center text-base text-neutral-700">
          Канал «{channelSlug}» не настроен. Добавьте конфигурацию в lib/partner/channels.ts.
        </Text>
      </SafeAreaView>
    );
  }

  const uri = buildPartnerWebViewUrl(getApiBaseUrl(), channel, {
    lang: lang === "uz" ? "uz" : "ru",
    session: typeof session === "string" ? session : undefined,
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View
        className="flex-row items-center justify-between border-b border-emerald-100 px-4 py-2"
        style={{ backgroundColor: "#F4FAF6" }}
      >
        <Text className="text-sm font-semibold text-neutral-800">FundingPro</Text>
        <View
          className="rounded-full px-2 py-1"
          style={{ backgroundColor: channel.primaryColor }}
        >
          <Text className="text-xs font-semibold text-white">
            {channel.displayName} · {channel.badgeLabel}
          </Text>
        </View>
      </View>
      <WebView
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={channel.primaryColor} size="large" />
          </View>
        )}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
      />
    </SafeAreaView>
  );
}
