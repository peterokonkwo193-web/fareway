import { ImageResponse } from "next/og";

export const alt = "Fareway – compare cheap flights to every country";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default Open Graph / social preview image, rendered at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b3d91 0%, #0d4fb8 55%, #1572d6 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 30, height: 30, background: "#ff7a3d", transform: "rotate(45deg)", borderRadius: 6 }} />
          </div>
          <div style={{ fontSize: 48, fontWeight: 800 }}>Fareway</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Find the cheapest way to fly</div>
          <div style={{ fontSize: 34, opacity: 0.9 }}>Flights to and from every country. No payment online: our team confirms and books with you.</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["250 countries", "3,200+ airports", "Real people, not checkout pages"].map((t) => (
            <div key={t} style={{ fontSize: 26, padding: "10px 22px", borderRadius: 999, background: "rgba(255,255,255,0.16)" }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
