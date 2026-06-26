import { useMutation, useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { FlashList } from "@shopify/flash-list";
import { RefreshControl, Text } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";

export default function DocumentsScreen() {
  const docsQuery = useQuery({
    queryKey: queryKeys.documents,
    queryFn: () => api.documents(),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      return api.uploadDocument({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
      });
    },
    onSuccess: () => docsQuery.refetch(),
  });

  async function download(id: string) {
    const { url, downloadUrl } = await api.downloadDocumentUrl(id);
    const target = url ?? downloadUrl;
    if (target) await Linking.openURL(target);
  }

  if (docsQuery.isLoading) return <LoadingState />;
  if (docsQuery.isError) {
    return <ErrorState message={docsQuery.error.message} onRetry={() => docsQuery.refetch()} />;
  }

  return (
    <Screen title="Документы" showBack>
      <Button
        title="Загрузить документ"
        className="mx-4 mt-4"
        loading={uploadMutation.isPending}
        onPress={() => uploadMutation.mutate()}
      />
      <FlashList
        data={docsQuery.data?.documents ?? []}
        refreshControl={
          <RefreshControl refreshing={docsQuery.isRefetching} onRefresh={() => docsQuery.refetch()} />
        }
        ListEmptyComponent={<EmptyState message="Документов нет" />}
        renderItem={({ item }) => (
          <Card className="mx-4 mb-3">
            <Text className="font-medium text-funding-black">{item.fileName}</Text>
            <Button title="Скачать" variant="ghost" className="mt-2" onPress={() => download(item.id)} />
          </Card>
        )}
      />
    </Screen>
  );
}
