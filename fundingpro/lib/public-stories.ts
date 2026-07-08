export type PublicStory = {
  id: string;
  org: string;
  sector: string;
  city: string;
  summary: string;
  outcome: string;
  status: "pilot" | "published";
};

const PILOT_STORIES: PublicStory[] = [
  {
    id: "dilnoza-stipend",
    org: "Дилноза К.",
    sector: "Образование",
    city: "Ташкент",
    summary:
      "Студентка бакалавриата использовала AI-подбор для стипендий и обменных программ ЕС. Платформа сократила поиск с двух недель до двух дней.",
    outcome: "Пилот · 3 программы в shortlist",
    status: "pilot",
  },
  {
    id: "javohir-grant",
    org: "Жавохир М.",
    sector: "Социальные проекты",
    city: "Нукус",
    summary:
      "Выпускник проверил соответствие гранту ПРООН до подачи. AI указал на пробелы в CV и мотивационном письме.",
    outcome: "Пилот · eligibility score 76%",
    status: "pilot",
  },
  {
    id: "nilufar-ai-writer",
    org: "Нилуфар А.",
    sector: "Международные программы",
    city: "Самарканд",
    summary:
      "Специалист подготовила черновик мотивационного письма для программы GIZ с помощью AI Writer за 15 минут.",
    outcome: "Пилот · черновик за 15 минут",
    status: "pilot",
  },
];

export async function listPublicStories(): Promise<{ stories: PublicStory[]; total: number }> {
  return { stories: PILOT_STORIES, total: PILOT_STORIES.length };
}
