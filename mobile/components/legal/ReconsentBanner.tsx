import { Link } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import { queryKeys } from "../../lib/query-keys";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export type ConsentState = {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptAi: boolean;
};

export function isRequiredConsentGiven(c: ConsentState) {
  return c.acceptTerms && c.acceptPrivacy;
}

function ConsentCheckboxes({
  value,
  onChange,
}: {
  value: ConsentState;
  onChange: (v: ConsentState) => void;
}) {
  const items: { key: keyof ConsentState; label: string; href: string }[] = [
    { key: "acceptTerms", label: "Публичная оферта", href: "/(legal)/offer" },
    { key: "acceptPrivacy", label: "Политика конфиденциальности", href: "/(legal)/privacy" },
    { key: "acceptAi", label: "Обработка данных для AI", href: "/(legal)/ai-processing" },
  ];

  return (
    <View className="gap-3">
      {items.map((item) => (
        <Pressable
          key={item.key}
          className="flex-row items-start gap-3"
          onPress={() => onChange({ ...value, [item.key]: !value[item.key] })}
        >
          <View
            className={`mt-0.5 h-5 w-5 rounded border ${value[item.key] ? "bg-funding-green border-funding-green" : "border-gray-400"}`}
          />
          <View className="flex-1">
            <Text className="text-sm text-funding-black">{item.label}</Text>
            <Link href={item.href as never} asChild>
              <Pressable>
                <Text className="text-xs text-funding-green underline mt-0.5">Читать</Text>
              </Pressable>
            </Link>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function ReconsentBanner() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    acceptTerms: false,
    acceptPrivacy: false,
    acceptAi: false,
  });
  const [error, setError] = useState("");

  const statusQuery = useQuery({
    queryKey: queryKeys.consentStatus,
    queryFn: () => api.consentStatus(),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.submitConsent({
        acceptTerms: consent.acceptTerms,
        acceptPrivacy: consent.acceptPrivacy,
        acceptAi: consent.acceptAi,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.consentStatus });
      setOpen(false);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!statusQuery.data?.needsReconsent) return null;

  return (
    <>
      <Card className="mb-4 border-amber-200 bg-amber-50">
        <Text className="font-semibold text-amber-900">Обновлены юридические документы</Text>
        <Text className="text-sm text-amber-800 mt-1">
          Примите актуальную оферту и политику конфиденциальности.
        </Text>
        <Button title="Принять сейчас" variant="secondary" className="mt-3" onPress={() => setOpen(true)} />
      </Card>

      <Modal visible={open} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-clay-surface rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-funding-black mb-4">Обновление документов</Text>
            <ConsentCheckboxes value={consent} onChange={setConsent} />
            {error ? <Text className="text-red-600 text-sm mt-3">{error}</Text> : null}
            <Button
              title="Подтвердить"
              className="mt-4"
              loading={submitMutation.isPending}
              onPress={() => {
                if (!isRequiredConsentGiven(consent)) {
                  setError("Примите оферту и политику конфиденциальности");
                  return;
                }
                setError("");
                submitMutation.mutate();
              }}
            />
            <Button title="Отмена" variant="ghost" className="mt-2" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

export function PaymentConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable className="flex-row items-start gap-3 mt-4" onPress={() => onChange(!checked)}>
      <View className={`mt-0.5 h-5 w-5 rounded border ${checked ? "bg-funding-green border-funding-green" : "border-gray-400"}`} />
      <View className="flex-1">
        <Text className="text-sm text-funding-black">
          Принимаю{" "}
          <Link href="/(legal)/payment-terms" className="text-funding-green underline">
            оферту и политику возвратов
          </Link>
        </Text>
      </View>
    </Pressable>
  );
}
