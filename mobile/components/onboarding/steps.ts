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
    label: "Заполнить личный профиль",
    description: "Укажите имя, интересы и контакты.",
    href: "/(app)/profile",
  },
  {
    id: "documents",
    label: "Загрузить CV или документы",
    description: "Добавьте резюме и мотивационное письмо для заявок.",
    href: "/(app)/documents",
  },
  {
    id: "saved_grant",
    label: "Сохранить первую возможность",
    description: "Найдите подходящий грант или программу и сохраните в избранное.",
    href: "/(app)/(tabs)/grants",
  },
  {
    id: "eligibility",
    label: "Пройти проверку соответствия",
    description: "Проверьте, подходите ли вы под условия выбранной программы.",
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
