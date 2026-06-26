import { listPublicDonors as listDonorsFromDb } from "@/lib/db/donors";

export type PublicDonor = {
  id: string;
  name: string;
  nameRu: string | null;
};

export async function listPublicDonors(): Promise<PublicDonor[]> {
  const { donors } = await listDonorsFromDb();
  return donors.map((d) => ({
    id: d.id,
    name: d.name,
    nameRu: d.name_ru,
  }));
}
