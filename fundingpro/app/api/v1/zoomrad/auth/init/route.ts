import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";

// POST /api/v1/zoomrad/auth/init
// Initialize ZOOMRAD WebView Mini App session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { zoomradToken } = body;

    if (!zoomradToken) {
      return apiError("ZOOMRAD token required", 400, "MISSING_TOKEN");
    }

    // TODO: verify zoomradToken with ZOOMRAD server-to-server API
    // TODO: create or update ZoomradAccount record
    // TODO: issue FundingPro JWT
    // TODO: write audit log: action="zoomrad_auth"

    return apiSuccess({
      sessionToken: "TODO_SESSION_TOKEN",
      isNewUser: false,
    });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
