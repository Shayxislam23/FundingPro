import type { OnboardingStepId } from "@fundingpro/api-types";

export type OnboardingStep = {
  id: OnboardingStepId;
  label: string;
  description: string;
  href: `/(app)${string}`;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "profile",
    label: "Создать профиль НКО",
    description: "Укажите название, сектор и контакты организации.",
    href: "/(app)/profile",
  },
  {
    id: "documents",
    label: "Загрузить устав или регистрацию",
    description: "Добавьте учредительные документы для заявок.",
    href: "/(app)/documents",
  },
  {
    id: "saved_grant",
    label: "Сохранить первый грант",
    description: "Найдите подходящий грант и сохраните его в избранное.",
    href: "/(app)/(tabs)/grants",
  },
  {
    id: "eligibility",
    label: "Пройти проверку соответствия",
    description: "Проверьте, подходит ли ваша организация под условия гранта.",
    href: "/(app)/(tabs)/eligibility",
  },
  {
    id: "ai_proposal",
    label: "Сгенерировать AI-черновик",
    description: "Создайте черновик заявки с помощью AI-ассистента.",
    href: "/(app)/(tabs)/ai-writer",
  },
];

export function getNextOnboardingStep(steps: Record<OnboardingStepId, boolean>) {
  return ONBOARDING_STEPS.find((step) => !steps[step.id]);
}
