import { z } from "zod";
import { parseApiResponse } from "@fundingpro/api-types";
import { getApiBaseUrl, getAppVersion } from "../../config";
import { getAccessToken } from "../../clerk";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "X-Client-Version": `mobile-${getAppVersion()}`,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
}

export async function parseResponse<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  const json: unknown = await res.json();
  if (!res.ok) {
    const err = json as { error?: { message?: string; code?: string } };
    throw new Error(err.error?.message ?? `HTTP ${res.status}`);
  }
  return parseApiResponse(json, schema);
}

export const genericRecordSchema = z.record(z.unknown());
