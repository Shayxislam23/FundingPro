import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";

// POST /api/v1/auth/otp/request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email } = body;

    if (!phone && !email) {
      return apiError("Phone or email required", 400, "MISSING_CONTACT");
    }

    // TODO: integrate with OTP provider (SMS / email)
    // Rate limit: max 3 OTP requests per 10 minutes per number

    return apiSuccess({
      message: "OTP sent",
      // Never reveal if phone/email exists in response
      expiresIn: 300,
    });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
