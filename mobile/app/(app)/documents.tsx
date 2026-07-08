import { useMutation, useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { FlashListSized, FLASH_LIST_ITEM_SIZE } from "../../components/ui/FlashListSized";
import { useState } from "react";
import { Alert, RefreshControl, Text, View } from "react-native";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { api } from "../../lib/api/client";
import { t } from "../../lib/i18n";
import { queryKeys } from "../../lib/query-keys";

const DOCUMENT_ROW_HEIGHT = FLASH_LIST_ITEM_SIZE.document;

export default function DocumentsScreen() {
  const [uploadFeedback, setUploadFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const docsQuery = useQuery({
    queryKey: queryKeys.documents,
    queryFn: () => api.documents(),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return null;
      const asset = result.assets[0];
      return api.uploadDocument({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
      });
    },
    onSuccess: (data) => {
      if (!data) return;
      setUploadFeedback({ type: "success", message: t.uploadSuccess });
      void docsQuery.refetch();
    },
    onError: (error: Error) => {
      setUploadFeedback({ type: "error", message: error.message || t.uploadFailed });
    },
  });

  async function download(id: string) {
    setDownloadingId(id);
    try {
      const { url, downloadUrl } = await api.downloadDocumentUrl(id);
      const target = url ?? downloadUrl;
      if (!target) {
        throw new Error("Ссылка для скачивания недоступна");
      }
      const canOpen = await Linking.canOpenURL(target);
      if (!canOpen) {
        throw new Error("Не удалось открыть ссылку на устройстве");
      }
      await Linking.openURL(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.downloadFailed;
      Alert.alert(t.downloadFailed, message);
    } finally {
      setDownloadingId(null);
    }
  }

  if (docsQuery.isLoading) return <LoadingState message={t.loading} />;
  if (docsQuery.isError) {
    return <ErrorState message={docsQuery.error.message} onRetry={() => docsQuery.refetch()} />;
  }

  return (
    <Screen title={t.documents} showBack>
      <View className="mx-4 mt-4">
        <Button
          title={t.uploadDocument}
          loading={uploadMutation.isPending}
          onPress={() => {
            setUploadFeedback(null);
            uploadMutation.mutate();
          }}
        />
        {uploadFeedback ? (
          <Text
            className={`text-sm mt-2 ${
              uploadFeedback.type === "success" ? "text-funding-green" : "text-red-600"
            }`}
          >
            {uploadFeedback.message}
          </Text>
        ) : null}
      </View>
      <FlashListSized
        data={docsQuery.data?.documents ?? []}
        estimatedItemSize={DOCUMENT_ROW_HEIGHT}
        refreshControl={
          <RefreshControl refreshing={docsQuery.isRefetching} onRefresh={() => docsQuery.refetch()} />
        }
        ListEmptyComponent={<EmptyState message={t.noDocuments} />}
        renderItem={({ item }) => (
          <Card className="mx-4 mb-3">
            <Text className="font-medium text-funding-black">{item.fileName}</Text>
            <Button
              title={t.download}
              variant="ghost"
              className="mt-2"
              loading={downloadingId === item.id}
              onPress={() => download(item.id)}
            />
          </Card>
        )}
      />
    </Screen>
  );
}
