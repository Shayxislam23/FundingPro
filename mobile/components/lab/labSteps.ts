/** Shared step metadata for the Opportunities Lab journey screen — mirrors fundingpro/components/lab/labSteps.ts */

export type LabStepMeta = {
  id: string;
  label: string;
  hint: string; // Karakalpak-friendly microcopy
  description: string;
};

export const LAB_STEPS: LabStepMeta[] = [
  {
    id: "registration",
    label: "Регистрация завершена",
    hint: "Dizimnen ótiw tamamlandı.",
    description: "Вы зарегистрированы на платформе FundingPro.",
  },
  {
    id: "profile",
    label: "Заполните профиль",
    hint: "Profil maǵlıwmatlarıńızdı tolıqtırıń.",
    description: "Добавьте ФИО, возраст, город/район, Telegram и статус обучения.",
  },
  {
    id: "interests",
    label: "Выберите интересы",
    hint: "Qızıǵıwshılıqlarıńızdı belgileń.",
    description: "Отметьте, что вам интересно: гранты, стипендии, конкурсы, стажировки и другое.",
  },
  {
    id: "cv",
    label: "Подготовьте CV",
    hint: "CV tayarlań yamasa CV boyınsha járdem kerek ekenin belgileń.",
    description: "Загрузите CV в «Документы» или отметьте, что нужна помощь.",
  },
  {
    id: "linkedin",
    label: "Добавьте LinkedIn",
    hint: "LinkedIn profilińizdi qosıń.",
    description: "Укажите ссылку на LinkedIn или создайте профиль.",
  },
  {
    id: "opportunities",
    label: "Найдите 10 возможностей",
    hint: "Ózińizge sáykes 10 imkaniyattı tańlań.",
    description: "Сохраните 10 подходящих возможностей в каталоге грантов.",
  },
  {
    id: "motivation",
    label: "Мотивационное письмо",
    hint: "Motivaciya xatıńızdı júkleń.",
    description: "Подготовьте базовое мотивационное письмо.",
  },
  {
    id: "chosen",
    label: "Выберите 1 возможность",
    hint: "Keminde 1 real imkaniyattı tańlań.",
    description: "Выберите одну реальную возможность для подачи заявки.",
  },
  {
    id: "application",
    label: "Подайте заявку",
    hint: "Keminde 1 real arza tapsırıń.",
    description: "Подготовьте ответы и подайте настоящую заявку.",
  },
  {
    id: "proof",
    label: "Загрузите подтверждение",
    hint: "Arza tapsırǵanıńızdı dálillewshi hújjetti júkleń.",
    description: "Загрузите подтверждение в «Документы» и отметьте подачу.",
  },
];

export const LAB_INTERESTS: { id: string; label: string }[] = [
  { id: "grants", label: "Гранты" },
  { id: "scholarships", label: "Стипендии" },
  { id: "forums", label: "Форумы" },
  { id: "competitions", label: "Конкурсы" },
  { id: "internships", label: "Стажировки" },
  { id: "volunteering", label: "Волонтёрство" },
  { id: "exchange_programs", label: "Программы обмена" },
  { id: "hackathons", label: "Хакатоны" },
  { id: "startup_programs", label: "Стартап-программы" },
];

export const LAB_STATE_LABELS: Record<string, string> = {
  not_started: "Не начато",
  in_progress: "В процессе",
  submitted: "Отправлено",
  needs_revision: "Нужна доработка",
  completed: "Готово",
};
