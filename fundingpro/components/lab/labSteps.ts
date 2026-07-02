/** Shared step metadata for the Opportunities Lab journey UI. */

export type LabStepMeta = {
  id: string;
  label: string;
  hint: string; // Karakalpak-friendly microcopy
  description: string;
  action: string;
  href: string;
};

export const LAB_STEPS: LabStepMeta[] = [
  {
    id: "registration",
    label: "Регистрация завершена",
    hint: "Dizimnen ótiw tamamlandı.",
    description: "Вы зарегистрированы на платформе FundingPro.",
    action: "Готово",
    href: "/dashboard/lab",
  },
  {
    id: "profile",
    label: "Заполните профиль",
    hint: "Profil maǵlıwmatlarıńızdı tolıqtırıń.",
    description:
      "Добавьте ФИО, возраст, город/район, Telegram и статус обучения, чтобы мы рекомендовали подходящие возможности.",
    action: "Заполнить профиль",
    href: "/dashboard/lab#profile",
  },
  {
    id: "interests",
    label: "Выберите интересы",
    hint: "Qızıǵıwshılıqlarıńızdı belgileń.",
    description:
      "Отметьте, что вам интересно: гранты, стипендии, форумы, конкурсы, стажировки, волонтёрство, обмены, хакатоны или стартап-программы.",
    action: "Выбрать интересы",
    href: "/dashboard/lab#profile",
  },
  {
    id: "cv",
    label: "Подготовьте CV",
    hint: "CV tayarlań yamasa CV boyınsha járdem kerek ekenin belgileń.",
    description:
      "Загрузите CV в разделе «Документы» или отметьте, что нужна помощь. Сильное CV требуется для большинства международных программ.",
    action: "Отметить статус CV",
    href: "/dashboard/lab#profile",
  },
  {
    id: "linkedin",
    label: "Добавьте LinkedIn",
    hint: "LinkedIn profilińizdi qosıń.",
    description:
      "Укажите ссылку на LinkedIn или создайте профиль — он поможет находить программы и строить личный бренд.",
    action: "Добавить LinkedIn",
    href: "/dashboard/lab#profile",
  },
  {
    id: "opportunities",
    label: "Найдите 10 возможностей",
    hint: "Ózińizge sáykes 10 imkaniyattı tańlań.",
    description:
      "Первое задание — сохранить 10 подходящих возможностей: гранты, форумы, стипендии, конкурсы или стажировки.",
    action: "Открыть каталог",
    href: "/dashboard/grants",
  },
  {
    id: "motivation",
    label: "Мотивационное письмо",
    hint: "Motivaciya xatıńızdı júkleń.",
    description:
      "Подготовьте базовое мотивационное письмо, которое можно адаптировать под разные программы. Черновик поможет составить AI-помощник.",
    action: "Отметить письмо",
    href: "/dashboard/lab#actions",
  },
  {
    id: "chosen",
    label: "Выберите 1 возможность",
    hint: "Keminde 1 real imkaniyattı tańlań.",
    description: "Выберите одну реальную возможность для подачи заявки и добавьте её в трекер.",
    action: "Открыть трекер",
    href: "/dashboard/tracker",
  },
  {
    id: "application",
    label: "Подайте заявку",
    hint: "Keminde 1 real arza tapsırıń.",
    description: "Подготовьте ответы и подайте настоящую заявку на выбранную программу.",
    action: "Мои заявки",
    href: "/dashboard/tracker",
  },
  {
    id: "proof",
    label: "Загрузите подтверждение",
    hint: "Arza tapsırǵanıńızdı dálillewshi hújjetti júkleń.",
    description:
      "Загрузите скриншот или письмо-подтверждение в «Документы» и отметьте подачу — это откроет путь к сертификату.",
    action: "Отметить пруф",
    href: "/dashboard/lab#actions",
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

export const LAB_CERT_REQUIREMENTS: Record<string, string> = {
  profile: "Заполненный профиль",
  cv: "CV загружено",
  motivation: "Мотивационное письмо",
  linkedin: "Профиль LinkedIn",
  opportunities: "10 выбранных возможностей",
  application: "1 реальная заявка",
  attendance: "Посещаемость ≥70% (отмечает ментор)",
};

export const LAB_STATE_LABELS: Record<string, string> = {
  not_started: "Не начато",
  in_progress: "В процессе",
  submitted: "Отправлено",
  needs_revision: "Нужна доработка",
  completed: "Готово",
};
