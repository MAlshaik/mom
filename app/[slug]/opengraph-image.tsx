import { ImageResponse } from "next/og";
import { getGroupBySlug } from "@/server/actions/admin";

export const runtime = "edge";
export const alt = "ختم المهدوي";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // If the group has a custom banner, redirect to it
  // Otherwise generate a default OG image
  // Note: edge runtime can't do DB queries directly, so we generate a default

  return new ImageResponse(
    (
      <div
        style={{
          background: "#1B3A6B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
        }}
      >
        <div style={{ fontSize: "80px" }}>🌸</div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#D4AF37",
            direction: "rtl",
          }}
        >
          ختم المهدوي
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          /{slug}
        </div>
      </div>
    ),
    { ...size }
  );
}
