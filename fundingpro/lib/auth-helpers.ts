import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "./prisma";
import { apiError } from "./api";

// Server-side Supabase client with service role (for auth verification)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type AuthUser = {
  supabaseId: string;
  userId: string;
  email: string | null;
};

/**
 * Extract and verify Supabase JWT from Authorization header.
 * Maps Supabase user to internal User, creating one if needed.
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Find or create internal user
  let internalUser = await prisma.user.findFirst({
    where: {
      identities: {
        some: { provider: "otp_email", providerId: user.id },
      },
    },
  });

  if (!internalUser) {
    // Create internal user and link Supabase identity
    internalUser = await prisma.user.create({
      data: {
        email: user.email ?? null,
        emailVerified: !!user.email_confirmed_at,
        isActive: true,
        identities: {
          create: {
            provider: "otp_email",
            providerId: user.id,
          },
        },
      },
    });

    // Audit log: first user creation
    await prisma.auditLog.create({
      data: {
        userId: internalUser.id,
        action: "user_created",
        entityType: "User",
        entityId: internalUser.id,
        metadata: { supabaseId: user.id, email: user.email },
      },
    }).catch(() => {}); // non-blocking
  }

  return {
    supabaseId: user.id,
    userId: internalUser.id,
    email: internalUser.email,
  };
}

/**
 * Like getCurrentUser but throws 401 if not authenticated.
 */
export async function getCurrentUserOrThrow(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(req);
  if (!user) throw apiError("Unauthorized", 401, "UNAUTHORIZED");
  return user;
}

/**
 * Get current user's primary organization.
 */
export async function getCurrentOrganization(userId: string) {
  return prisma.organizationMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { organization: true },
  });
}

/**
 * Require admin role — for now checks a setting or email allowlist.
 * TODO: implement proper RBAC.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUserOrThrow(req);
  // TODO: check admin role in DB
  // For now allow any authenticated user in development
  if (process.env.NODE_ENV === "production") {
    // Production: check admin allowlist or role
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
    if (!user.email || !adminEmails.includes(user.email)) {
      throw apiError("Forbidden", 403, "FORBIDDEN");
    }
  }
  return user;
}
