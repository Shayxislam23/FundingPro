const MOCK_PREFIX = "[AI модуль работает в тестовом режиме]";
const MIN_PROPOSAL_LENGTH = 80;

export function isMockAiOutput(content: string): boolean {
  return content.trimStart().startsWith(MOCK_PREFIX);
}

export function validateProposalContent(content: string): {
  valid: boolean;
  reason?: string;
  isMock: boolean;
} {
  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, reason: "empty_output", isMock: false };
  }
  if (trimmed.length < MIN_PROPOSAL_LENGTH) {
    return { valid: false, reason: "too_short", isMock: false };
  }
  const isMock = isMockAiOutput(trimmed);
  return { valid: true, isMock };
}
