import { NextResponse } from "next/server";

/** Replace TEAM_ID with your Apple Developer Team ID before production submit. */
const IOS_BUNDLE_ID = "uz.fundingpro.app";
const IOS_APP_ID = `TEAM_ID.${IOS_BUNDLE_ID}`;

const association = {
  applinks: {
    apps: [],
    details: [
      {
        appIDs: [IOS_APP_ID],
        components: [
          { "/": "/mobile/auth/callback" },
          { "/": "/mobile/subscription/return*" },
          { "/": "/mobile/*" },
        ],
      },
    ],
  },
};

export function GET() {
  return NextResponse.json(association, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
