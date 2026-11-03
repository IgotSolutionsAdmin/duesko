import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DuesKo";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F4FBFA",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "#0A5C5B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "#FFB547" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 84, color: "#0A5C5B", fontWeight: 700, letterSpacing: -2 }}>
              DuesKo
            </div>
            <div style={{ fontSize: 28, color: "#0F2A33", opacity: 0.7 }}>
              Simple HOA and condo dues collection
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
