import { api, convexPublicQuery } from "@/lib/convex-server";

export async function listConsultants(opts?: {
  limit?: number;
  specialty?: string;
  country?: string;
  page?: number;
}) {
  return convexPublicQuery(api.consultants.list, {
    page: opts?.page ?? 1,
    limit: opts?.limit ?? 20,
    specialty: opts?.specialty,
    country: opts?.country,
  });
}
