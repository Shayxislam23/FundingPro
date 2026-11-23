import { redirect } from "next/navigation";
import { SIGN_IN_PATH, safePostAuthPath } from "@/lib/auth/paths";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy /auth → canonical custom /sign-in (maps redirect → next). */
export default async function AuthRedirectPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const nextRaw =
    (typeof sp.next === "string" ? sp.next : undefined) ??
    (typeof sp.redirect === "string" ? sp.redirect : undefined);
  const next = safePostAuthPath(nextRaw);
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const q = params.toString();
  redirect(q ? `${SIGN_IN_PATH}?${q}` : SIGN_IN_PATH);
}
