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
    id: "eco-ngo-uz",
    org: "ЭкоНКО Узбекистан",
    sector: "Экология",
    city: "Ташкент",
    summary:
      "НКО использовала AI-подбор для поиска климатических грантов ПРООН и ЕС. Платформа помогла сократить время на первичный скрининг с 2 недель до 2 дней.",
    outcome: "Пилот · 3 гранта в shortlist",
    status: "pilot",
  },
  {
    id: "agro-consult",
    org: "АгроКонсалт ООО",
    sector: "Сельское хозяйство",
    city: "Самарканд",
    summary:
      "Малый бизнес протестировал проверку соответствия для программы GIZ по зелёной экономике. AI выявил недостающие документы до подачи заявки.",
    outcome: "Пилот · eligibility score 78%",
    status: "pilot",
  },
  {
    id: "edu-innovation",
    org: "Центр инновационного образования",
    sector: "Образование",
    city: "Ташкент",
    summary:
      "Академическая организация подготовила черновик заявки на грант Всемирного банка с помощью AI Writer в формате UNDP.",
    outcome: "Пилот · черновик за 15 минут",
    status: "pilot",
  },
];

export async function listPublicStories(): Promise<{ stories: PublicStory[]; total: number }> {
  return { stories: PILOT_STORIES, total: PILOT_STORIES.length };
}
