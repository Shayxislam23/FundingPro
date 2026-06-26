import { api, convexPublicQuery } from "@/lib/convex-server";

export type PublicDonorRow = {
  id: string;
  name: string;
  name_ru: string | null;
  description: string | null;
  country: string | null;
  website: string | null;
};

export type ListDonorsResult = {
  donors: PublicDonorRow[];
  total: number;
};

export async function listPublicDonors(): Promise<ListDonorsResult> {
  return convexPublicQuery(api.donors.list, {});
}
