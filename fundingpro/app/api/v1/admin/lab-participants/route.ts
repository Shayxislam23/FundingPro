export const dynamic = "force-dynamic";

import { apiError, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-route";
import {
  importLabParticipantsForAdmin,
  listLabParticipantsForAdmin,
  recomputeLabCohortStatsForAdmin,
  updateLabParticipantForAdmin,
  type AdminLabParticipantImportRow,
  type LabCvStatus,
  type LabParticipantStatus,
  type LabProgressState,
} from "@/lib/db/lab";

const PARTICIPANT_STATUSES = new Set<LabParticipantStatus>([
  "new_applicant",
  "registered",
  "onboarding_incomplete",
  "active_participant",
  "needs_reminder",
  "strong_participant",
  "application_submitted",
  "completed",
  "dropped",
]);

const PROGRESS_STATES = new Set<LabProgressState>([
  "not_started",
  "in_progress",
  "submitted",
  "needs_revision",
  "completed",
]);

const CV_STATUSES = new Set<LabCvStatus>([
  "not_started",
  "in_progress",
  "submitted",
  "needs_revision",
  "completed",
  "help_requested",
]);

const HEADER_ALIASES: Record<keyof AdminLabParticipantImportRow, string[]> = {
  email: ["email", "email address", "почта", "электронная почта", "e-mail"],
  userId: ["user id", "userid", "clerk id", "fundingpro user id"],
  fullName: ["full name", "name", "fio", "фио", "имя", "аты-жөни", "аты жөни"],
  telegramUsername: ["telegram", "telegram username", "tg", "username", "телеграм"],
  cityOrDistrict: ["city", "district", "city or district", "город", "район", "қала", "қала/район"],
  educationStatus: ["education", "education status", "учеба", "образование"],
  interests: ["interests", "interest", "направления", "интересы", "qiziqish", "qızıǵıwshılıq"],
  linkedinUrl: ["linkedin", "linkedin url", "linkedin profile"],
  selectedOpportunityCount: ["selected opportunity count", "opportunities count", "10 opportunities", "opportunity count"],
  attendancePercent: ["attendance", "attendance percent", "attendance %", "посещаемость"],
  participantStatus: ["participant status", "status", "статус"],
  cvStatus: ["cv status", "cv", "резюме"],
  motivationLetterStatus: ["motivation letter status", "motivation", "мотивационное письмо"],
  chosenOpportunityStatus: ["chosen opportunity status", "chosen opportunity"],
  applicationProofStatus: ["application proof status", "proof status", "proof"],
  mentorNotes: ["mentor notes", "notes", "comment", "комментарий", "заметки"],
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getValue(row: Record<string, string>, key: keyof AdminLabParticipantImportRow) {
  for (const alias of HEADER_ALIASES[key]) {
    const value = row[normalizeHeader(alias)];
    if (value !== undefined && value.trim()) return value.trim();
  }
  return undefined;
}

function parseNumber(value?: string) {
  if (!value) return undefined;
  const number = Number(value.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(number) ? number : undefined;
}

function parseInterests(value?: string) {
  if (!value) return undefined;
  return value
    .split(/[,;|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStatus(value?: string) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if ((char === "," || char === "\t") && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
}

function normalizeRow(input: Record<string, unknown>): AdminLabParticipantImportRow {
  const stringRow: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    stringRow[normalizeHeader(key)] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  const participantStatus = normalizeStatus(getValue(stringRow, "participantStatus"));
  const cvStatus = normalizeStatus(getValue(stringRow, "cvStatus"));
  const motivationLetterStatus = normalizeStatus(getValue(stringRow, "motivationLetterStatus"));
  const chosenOpportunityStatus = normalizeStatus(getValue(stringRow, "chosenOpportunityStatus"));
  const applicationProofStatus = normalizeStatus(getValue(stringRow, "applicationProofStatus"));

  return {
    email: getValue(stringRow, "email"),
    userId: getValue(stringRow, "userId"),
    fullName: getValue(stringRow, "fullName"),
    telegramUsername: getValue(stringRow, "telegramUsername"),
    cityOrDistrict: getValue(stringRow, "cityOrDistrict"),
    educationStatus: getValue(stringRow, "educationStatus"),
    interests: parseInterests(getValue(stringRow, "interests")),
    linkedinUrl: getValue(stringRow, "linkedinUrl"),
    selectedOpportunityCount: parseNumber(getValue(stringRow, "selectedOpportunityCount")),
    attendancePercent: parseNumber(getValue(stringRow, "attendancePercent")),
    participantStatus: participantStatus && PARTICIPANT_STATUSES.has(participantStatus as LabParticipantStatus)
      ? participantStatus as LabParticipantStatus
      : undefined,
    cvStatus: cvStatus && CV_STATUSES.has(cvStatus as LabCvStatus) ? cvStatus as LabCvStatus : undefined,
    motivationLetterStatus: motivationLetterStatus && PROGRESS_STATES.has(motivationLetterStatus as LabProgressState)
      ? motivationLetterStatus as LabProgressState
      : undefined,
    chosenOpportunityStatus: chosenOpportunityStatus && PROGRESS_STATES.has(chosenOpportunityStatus as LabProgressState)
      ? chosenOpportunityStatus as LabProgressState
      : undefined,
    applicationProofStatus: applicationProofStatus && PROGRESS_STATES.has(applicationProofStatus as LabProgressState)
      ? applicationProofStatus as LabProgressState
      : undefined,
    mentorNotes: getValue(stringRow, "mentorNotes"),
  };
}

function normalizeRows(body: unknown) {
  if (!body || typeof body !== "object") return [];
  const input = body as { rows?: unknown; text?: unknown };
  if (Array.isArray(input.rows)) {
    return input.rows
      .filter((row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row))
      .map(normalizeRow);
  }
  if (typeof input.text === "string") {
    const trimmed = input.text.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      const rows = Array.isArray(parsed) ? parsed : parsed.rows;
      return Array.isArray(rows)
        ? rows.filter((row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row)).map(normalizeRow)
        : [];
    }
    return parseCsv(trimmed).map(normalizeRow);
  }
  return [];
}

export const GET = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10) || 100, 200);
  const cohortSlug = searchParams.get("cohortSlug") ?? undefined;
  const result = await listLabParticipantsForAdmin({ limit, cohortSlug }, admin.accessToken);
  return apiSuccess(result);
});

export const POST = withAdmin(async (req, admin) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("action") === "recompute-stats") {
    const cohortSlug = searchParams.get("cohortSlug") ?? undefined;
    const stats = await recomputeLabCohortStatsForAdmin({ cohortSlug }, admin.accessToken);
    return apiSuccess({ cohortStats: stats });
  }

  const rows = normalizeRows(await req.json());
  if (rows.length === 0) return apiError("No participant rows found", 400, "NO_ROWS");
  if (rows.length > 200) return apiError("Import is limited to 200 rows", 400, "TOO_MANY_ROWS");

  const result = await importLabParticipantsForAdmin(rows, admin.accessToken);
  return apiSuccess(result, 201);
});

export const PATCH = withAdmin(async (req, admin) => {
  const body = await req.json();
  const userId = String(body.userId ?? "");
  if (!userId) return apiError("userId required", 400, "MISSING_FIELDS");

  const participantStatus = normalizeStatus(typeof body.participantStatus === "string" ? body.participantStatus : undefined);
  if (participantStatus && !PARTICIPANT_STATUSES.has(participantStatus as LabParticipantStatus)) {
    return apiError("Invalid participantStatus", 400, "INVALID_STATUS");
  }

  const participant = await updateLabParticipantForAdmin(
    {
      userId,
      fullName: typeof body.fullName === "string" ? body.fullName.trim() : undefined,
      telegramUsername: typeof body.telegramUsername === "string" ? body.telegramUsername.trim() : undefined,
      cityOrDistrict: typeof body.cityOrDistrict === "string" ? body.cityOrDistrict.trim() : undefined,
      educationStatus: typeof body.educationStatus === "string" ? body.educationStatus.trim() : undefined,
      interests: Array.isArray(body.interests) ? body.interests.filter((item: unknown) => typeof item === "string") : undefined,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() : undefined,
      selectedOpportunityCount: typeof body.selectedOpportunityCount === "number" ? body.selectedOpportunityCount : undefined,
      attendancePercent: typeof body.attendancePercent === "number" ? body.attendancePercent : undefined,
      participantStatus: participantStatus as LabParticipantStatus | undefined,
      mentorNotes: typeof body.mentorNotes === "string" ? body.mentorNotes.trim() : undefined,
    },
    admin.accessToken
  );

  return apiSuccess({ participant });
});
