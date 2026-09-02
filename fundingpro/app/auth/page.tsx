import { redirect } from "next/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/paths";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy /auth → canonical custom /sign-in */
export default async function AuthRedirectPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
  }
  const q = params.toString();
  redirect(q ? `${SIGN_IN_PATH}?${q}` : SIGN_IN_PATH);
}
