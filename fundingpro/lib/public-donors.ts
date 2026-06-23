import { listDonors } from "@/lib/db/admin-grants";

export type PublicDonor = {
  id: string;
  name: string;
  nameRu: string | null;
};

const STATIC_DONORS: PublicDonor[] = [
  { id: "undp", name: "UNDP", nameRu: "ПРООН" },
  { id: "eu", name: "European Union", nameRu: "Европейский Союз" },
  { id: "giz", name: "GIZ", nameRu: "GIZ" },
  { id: "world-bank", name: "World Bank", nameRu: "Всемирный банк" },
  { id: "swiss", name: "Swiss Embassy", nameRu: "Посольство Швейцарии" },
];

export async function listPublicDonors(): Promise<PublicDonor[]> {
  try {
    const donors = await listDonors();
    if (donors.length > 0) return donors;
  } catch {
    // fall through to static seed
  }
  return STATIC_DONORS;
}
