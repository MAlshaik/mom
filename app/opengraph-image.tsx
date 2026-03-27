import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ختم المهدوي — Khatm Al-Mahdawi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          Quran Khatm Management
        </div>
      </div>
    ),
    { ...size }
  );
}
