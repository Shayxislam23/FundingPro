export function sanitizeForAI(answers: Record<string, unknown>): Record<string, unknown> {
  const forbidden = ["name", "phone", "email", "pinfl", "passport", "myid", "bank", "card", "payment_id"];
  return Object.fromEntries(
    Object.entries(answers).filter(([k]) => !forbidden.some((f) => k.toLowerCase().includes(f)))
  );
}

export function computeEligibility(
  answers: Record<string, unknown>,
  grant: { sectors: string[]; country_scope: string[] } | null
) {
  let score = 50;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const nextSteps: string[] = [];

  const applicantType = String(answers.applicant_type ?? "");
  if (applicantType === "Да") {
    score += 10;
    strengths.push("Заявка как физическое лицо — подходит для стипендий и индивидуальных программ");
  } else if (applicantType.includes("организацию")) {
    score -= 5;
    gaps.push("Сейчас платформа ориентирована на физических лиц — организации добавим позже");
    nextSteps.push("Заполните личный профиль и подавайте от своего имени, если программа это допускает");
  } else if (applicantType.includes("не решил")) {
    score -= 5;
    gaps.push("Не определён тип заявителя");
    nextSteps.push("Уточните в условиях гранта, допускаются ли физические лица");
  }

  const experience = String(answers.experience ?? "");
  if (experience.includes("3 лет")) {
    score += 20;
    strengths.push("Более 3 лет опыта в программах или проектах");
  } else if (experience.includes("1–3")) {
    score += 10;
    strengths.push("1–3 года релевантного опыта");
  } else if (experience.includes("Менее")) {
    score -= 5;
    gaps.push("Мало опыта — начните с программ для начинающих");
    nextSteps.push("Выберите гранты с пониженным порогом опыта");
  } else if (experience.includes("Нет")) {
    score -= 10;
    gaps.push("Нет опыта участия в программах");
    nextSteps.push("Подготовьте CV с учебными и волонтёрскими достижениями");
  }

  const education = String(answers.education ?? "");
  if (education.includes("Магистратура")) {
    score += 10;
    strengths.push("Уровень образования соответствует многим международным программам");
  } else if (education.includes("Бакалавр")) {
    score += 8;
    strengths.push("Бакалавриат — стандартный уровень для стипендий и грантов");
  } else if (education.includes("Студент")) {
    score += 5;
    strengths.push("Статус студента открывает стипендии и обменные программы");
  } else if (education.includes("Школа")) {
    score -= 5;
    gaps.push("Часть программ требует студенческий или высший статус");
    nextSteps.push("Ищите программы для школьников и молодёжи");
  }

  const documents = String(answers.documents ?? "");
  if (documents.includes("Все готовы")) {
    score += 15;
    strengths.push("CV и мотивационное письмо готовы");
  } else if (documents.includes("Большинство")) {
    score += 8;
    strengths.push("Основные документы почти готовы");
  } else if (documents.includes("Частично")) {
    score -= 5;
    gaps.push("Не полный пакет личных документов");
    nextSteps.push("Дозагрузите CV и мотивационное письмо в раздел «Документы»");
  } else if (documents.includes("Нет")) {
    score -= 20;
    gaps.push("Нет CV или мотивационного письма");
    nextSteps.push("Создайте CV и черновик мотивационного письма с помощью AI Writer");
  }

  const language = String(answers.language ?? "");
  if (language.includes("Несколько")) {
    score += 12;
    strengths.push("Мультиязычность усиливает международные заявки");
  } else if (language.includes("Английский")) {
    score += 10;
    strengths.push("Английский — ключевой язык для международных программ");
  } else if (language.includes("Русский") || language.includes("Узбекский")) {
    score += 3;
    strengths.push("Локальные языки подходят для региональных грантов");
  }

  if (grant && grant.sectors.length > 0 && answers.sector) {
    const userSector = String(answers.sector).toLowerCase();
    const match = grant.sectors.some(
      (s) => userSector.includes(s.toLowerCase()) || s.toLowerCase().includes(userSector)
    );
    if (match) {
      score += 5;
      strengths.push("Интересы профиля соответствуют сектору гранта");
    }
  }

  if (nextSteps.length === 0) {
    nextSteps.push("Проверьте дедлайн и формат подачи на сайте донора", "Загрузите документы в FundingPro");
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const status =
    clampedScore >= 70 ? "ELIGIBLE" : clampedScore >= 40 ? "PARTIALLY_ELIGIBLE" : "NOT_ELIGIBLE";

  return { score: clampedScore, status, strengths, gaps, nextSteps };
}
