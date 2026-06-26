import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { Screen } from "../../components/ui/Screen";
import { LEGAL_DOCS } from "../../lib/legal-docs";

export default function LegalWebViewScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const meta = LEGAL_DOCS[doc ?? ""] ?? LEGAL_DOCS.offer;

  return (
    <Screen title={meta.title} showBack>
      <WebView source={{ uri: meta.url }} className="flex-1" startInLoadingState />
    </Screen>
  );
}
