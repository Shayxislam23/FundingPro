import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/site";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #008A2E 0%, #005C1F 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          padding: "48px",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Funding<span style={{ color: "#B8F5C8" }}>Pro</span>
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            fontWeight: 500,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
            opacity: 0.95,
          }}
        >
          AI-платформа для международных грантов
        </div>
      </div>
    ),
    { ...size }
  );
}
