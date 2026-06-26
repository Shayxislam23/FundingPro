async function getClerkConvexToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const clerk = (
    window as unknown as {
      Clerk?: {
        session?: {
          getToken: (opts?: { template?: string }) => Promise<string | null>;
        };
      };
    }
  ).Clerk;
  if (!clerk?.session) return null;
  return clerk.session.getToken({ template: "convex" });
}

/** Client-side Authorization headers for API calls */
export async function getAuthHeaders(
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  const token = await getClerkConvexToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/** For FormData uploads — omit Content-Type so browser sets boundary */
export async function getAuthHeadersForUpload(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await getClerkConvexToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
