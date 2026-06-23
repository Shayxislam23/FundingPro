export const PROPOSAL_SECTION_KEYS = [
  "summary",
  "problem",
  "goal",
  "activities",
  "results",
  "budget",
  "logframe",
  "risks",
  "sustainability",
] as const;

export type ProposalSectionKey = (typeof PROPOSAL_SECTION_KEYS)[number];

const SECTION_KEY_SET = new Set<string>(PROPOSAL_SECTION_KEYS);

export function filterProposalSections(sections: unknown, maxSections = 5): ProposalSectionKey[] {
  if (!Array.isArray(sections)) return [];
  const unique: ProposalSectionKey[] = [];
  for (const raw of sections) {
    if (typeof raw !== "string") continue;
    const key = raw.trim().toLowerCase();
    if (!SECTION_KEY_SET.has(key)) continue;
    if (unique.includes(key as ProposalSectionKey)) continue;
    unique.push(key as ProposalSectionKey);
    if (unique.length >= maxSections) break;
  }
  return unique;
}
