import { api, convexMutation, convexQuery } from "@/lib/convex-server";

export type ApplicationRow = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  grant: {
    id: string;
    title: string;
    title_ru: string | null;
    deadline: string | null;
    amount_min: number | null;
    amount_max: number | null;
    donor: { name: string | null; name_ru: string | null };
  } | null;
};

export async function listApplications(
  opts: { status?: string; page: number; limit: number },
  accessToken: string
) {
  return convexQuery(
    api.applications.list,
    { status: opts.status, page: opts.page, limit: opts.limit },
    accessToken
  );
}

export async function createApplication(
  grantId: string,
  notes: string | null | undefined,
  accessToken: string
) {
  return convexMutation(api.applications.create, { grantId, notes }, accessToken);
}

export async function getApplicationForUser(
  applicationId: string,
  accessToken: string
) {
  return convexQuery(api.applications.getForUser, { applicationId }, accessToken);
}

export async function updateApplication(
  applicationId: string,
  update: { status?: string; notes?: string | null; wonAmountUsd?: number },
  accessToken: string
) {
  return convexMutation(
    api.applications.update,
    { applicationId, ...update },
    accessToken
  );
}

export async function deleteApplication(
  applicationId: string,
  accessToken: string
) {
  return convexMutation(api.applications.remove, { applicationId }, accessToken);
}

export async function listApplicationsForAdmin(
  opts: { limit: number; status?: string },
  accessToken: string
) {
  return convexQuery(api.applications.listForAdmin, opts, accessToken);
}
