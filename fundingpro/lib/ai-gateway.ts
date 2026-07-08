/**
 * FundingPro AI Gateway
 * Abstracts OpenAI / Anthropic / Mock providers.
 * All input is redacted before sending to external APIs.
 */

// ── REDACTION ─────────────────────────────────────────────────────────────────

const PII_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: "email", pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  // Phone patterns are deliberately narrow: proposals are full of legitimate
  // numbers (budgets, deadlines, KPIs) that must survive redaction intact.
  { name: "phone", pattern: /\+?998[\s\-.]?\(?\d{2}\)?[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}/g },
  { name: "phone_intl", pattern: /\+\d{9,15}\b/g },
  { name: "pinfl", pattern: /\b\d{14}\b/g },
  { name: "passport", pattern: /\b[A-Z]{2}\d{7}\b/g },
  { name: "fullname_ru", pattern: /[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+/g },
];

export type RedactionResult = {
  redacted: string;
  fieldsFound: string[];
};

export function redactPii(text: string): RedactionResult {
  let result = text;
  const fieldsFound: string[] = [];

  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(result)) {
      fieldsFound.push(name);
      result = result.replace(pattern, `[REDACTED_${name.toUpperCase()}]`);
    }
    pattern.lastIndex = 0;
  }

  return { redacted: result, fieldsFound };
}

// ── PROMPT REGISTRY ───────────────────────────────────────────────────────────

export const PROMPTS = {
  "match-grants": (profile: string) =>
    `You are a grant expert for Central Asia. Given this individual applicant profile, suggest the 5 most relevant grants and programs from our database.\n\nProfile:\n${profile}\n\nRespond in Russian. Format as JSON array with fields: grantId, matchScore (0-100), reason.`,

  "eligibility-review": (grantTitle: string, profile: string) =>
    `You are a grant eligibility expert. Review this individual applicant's eligibility for the grant or program.\n\nGrant: ${grantTitle}\nApplicant: ${profile}\n\nRespond in Russian with: score (0-100), status (eligible/partially_eligible/not_eligible), strengths (array), gaps (array), nextSteps (array).`,

  "proposal-generate": (section: string, grantTitle: string, context: string) =>
    `You are a professional grant writer. Write a ${section} section for a grant proposal.\n\nGrant: ${grantTitle}\nContext: ${context}\n\nWrite in Russian. Be professional, specific and compelling. Max 500 words.`,

  "logframe-generate": (goal: string, activities: string) =>
    `Create a logical framework (logframe) for this grant project.\n\nGoal: ${goal}\nActivities: ${activities}\n\nRespond in Russian as JSON with: goal, outcomes (array), outputs (array), activities (array), indicators (array).`,

  "budget-narrative-generate": (activities: string, totalBudget: string) =>
    `Write a budget narrative for these grant activities.\n\nActivities: ${activities}\nTotal budget: ${totalBudget} USD\n\nRespond in Russian. Be specific about cost justifications.`,

  "grant-extract": (announcement: string) =>
    `You are a data-entry assistant for a grants catalog. Extract structured fields from this grant announcement.

Announcement:
"""
${announcement}
"""

Respond with ONLY a JSON object (no markdown fences, no commentary) with these fields:
- title (string, English or original language)
- titleRu (string or null, Russian translation of the title)
- description (string or null, 1-3 sentence summary in the original language)
- descriptionRu (string or null, 1-3 sentence summary in Russian)
- donorName (string or null, funding organization name)
- sectors (array of lowercase English keywords, e.g. ["education", "climate"])
- countryScope (array of country names in English, e.g. ["Uzbekistan"])
- applicantTypes (array from: "NGO", "Business", "Government", "Academic", "Individual")
- amountMin (number or null, in the announcement currency)
- amountMax (number or null)
- currency (3-letter code string, e.g. "USD", or null)
- deadline (string "YYYY-MM-DD" or null)
- sourceUrl (string or null, only if a URL appears in the announcement)
- requirements (array of strings, key eligibility requirements)

STRICT RULES: use null for anything not stated in the announcement. Never invent amounts, deadlines, URLs or requirements.`,
} as const;

export type PromptKey = keyof typeof PROMPTS;

// ── PROVIDERS ─────────────────────────────────────────────────────────────────

export type AiResponse = {
  content: string;
  provider: string;
  tokensUsed?: number;
  isMock: boolean;
};

async function callOpenAI(prompt: string): Promise<AiResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content ?? "",
    provider: "openai",
    tokensUsed: data.usage?.total_tokens,
    isMock: false,
  };
}

async function callAnthropic(prompt: string): Promise<AiResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic error: ${err}`);
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text ?? "",
    provider: "anthropic",
    tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
    isMock: false,
  };
}

function callMock(prompt: string): AiResponse {
  // Realistic mock responses for development
  const content = `[AI модуль работает в тестовом режиме]\n\nЭто демонстрационный ответ для разработки. В рабочей среде здесь будет реальный AI-ответ на основе следующего запроса:\n\n---\n${prompt.slice(0, 200)}...\n---\n\nДля активации реального AI установите переменную окружения OPENAI_API_KEY или ANTHROPIC_API_KEY.`;

  return { content, provider: "mock", isMock: true };
}

// ── GATEWAY ───────────────────────────────────────────────────────────────────

/**
 * Thrown in strict mode instead of silently degrading to the mock provider,
 * so quota-consuming routes can refuse the request before charging the user.
 */
export class AiUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AiUnavailableError";
  }
}

export type AiCallOptions = {
  module: string;
  userId?: string;
  skipRedaction?: boolean;
  /** When true, provider errors and missing configuration throw AiUnavailableError instead of returning mock output. */
  strict?: boolean;
};

export async function callAi(
  prompt: string,
  opts: AiCallOptions
): Promise<AiResponse & { redactionFields: string[] }> {
  // Redact PII before sending to external providers
  const { redacted, fieldsFound } = opts.skipRedaction
    ? { redacted: prompt, fieldsFound: [] }
    : redactPii(prompt);

  const provider = process.env.AI_PROVIDER ?? "mock";
  const production = process.env.NODE_ENV === "production";

  if (production && provider === "mock") {
    throw new Error("AI mock provider is disabled in production. Set AI_PROVIDER and API keys.");
  }

  let response: AiResponse;

  try {
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      response = await callOpenAI(redacted);
    } else if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      response = await callAnthropic(redacted);
    } else if (production) {
      throw new Error(`AI provider is not configured for production: ${provider}`);
    } else {
      if (opts.strict) {
        throw new AiUnavailableError(`AI provider not configured (AI_PROVIDER=${provider})`);
      }
      response = callMock(redacted);
    }
  } catch (err) {
    if (err instanceof AiUnavailableError) throw err;
    console.error(`AI provider error (${provider}):`, err);
    if (opts.strict) {
      throw new AiUnavailableError(`AI provider ${provider} failed`, { cause: err });
    }
    if (production) {
      throw err instanceof Error ? err : new Error("AI provider failed in production");
    }
    // Fallback to mock on error
    response = callMock(redacted);
  }

  return { ...response, redactionFields: fieldsFound };
}
