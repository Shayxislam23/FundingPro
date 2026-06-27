import { SEED_DONORS } from "../../convex/seedData";
import type { PublicDonor } from "@/lib/public-donors";

/** Static donor catalog when Convex is unavailable at build time. */
export function seedDonorFallback(): PublicDonor[] {
  return SEED_DONORS.map((donor) => ({
    id: donor.key,
    name: donor.name,
    nameRu: donor.nameRu ?? null,
  }));
}
