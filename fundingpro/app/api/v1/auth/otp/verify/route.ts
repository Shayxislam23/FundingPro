import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";

// POST /api/v1/auth/otp/verify
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, code } = body;

    if ((!phone && !email) || !code) {
      return apiError("Contact and code required", 400, "MISSING_FIELDS");
    }

    // TODO: verify OTP code against stored hash
    // TODO: issue JWT access + refresh tokens
    // TODO: write audit log: action="login"

    return apiSuccess({
      accessToken: "TODO_JWT_ACCESS_TOKEN",
      refreshToken: "TODO_JWT_REFRESH_TOKEN",
      expiresIn: 3600,
      user: {
        id: "placeholder-user-id",
        // Never return sensitive fields like raw phone in full
      },
    });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
