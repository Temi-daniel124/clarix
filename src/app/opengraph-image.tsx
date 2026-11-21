import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Clarix. Run your cooperative with every number in view.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mona Sans ExtraBold (800), the latin subset, kept in the repo so the image renders the same
// everywhere. Satori cannot read the variable woff2 that next/font ships, so this is the
// static instance Google Fonts serves for weight 800.
const fontPath = join(
  process.cwd(),
  "assets/fonts/MonaSans-ExtraBold-latin.woff",
);
const logoPath = join(process.cwd(), "public/brand/clarix-horizontal.svg");

export default async function Image() {
  const [font, logo] = await Promise.all([
    readFile(fontPath),
    readFile(logoPath, "utf8"),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#F5F6FB",
        padding: "72px 80px",
        fontFamily: "Mona Sans",
      }}
    >
      <img src={logoSrc} width={191} height={48} alt="" />

      <div
        style={{
          display: "flex",
          fontSize: 80,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: "-0.035em",
          color: "#0B1033",
          maxWidth: 1040,
        }}
      >
        Run your cooperative with every number in view.
      </div>

      {/* The signature meter: committed, reserved, still available. */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 28,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", width: "52%", background: "#2F3DA6" }} />
        <div style={{ display: "flex", width: "18%", background: "#E3A23B" }} />
        <div style={{ display: "flex", flex: 1, background: "#2BD19A" }} />
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Mona Sans", data: font, style: "normal", weight: 800 }],
    },
  );
}
