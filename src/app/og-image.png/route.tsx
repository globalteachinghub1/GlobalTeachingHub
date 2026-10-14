import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_NAME, OG_IMAGE } from "@/lib/seo";

// 1200x630 social-share card (Open Graph / Twitter summary_large_image).
// Served as a route handler rather than the opengraph-image file convention
// because that convention's extensionless URL would be caught by the
// next-intl middleware; the ".png" path here is skipped by its matcher.
// Rendered once at build time.
export const dynamic = "force-static";

export async function GET() {
  const logo = await readFile(join(process.cwd(), "public/logo-full.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #ffffff 0%, #eef3ff 100%)",
          padding: "0 80px",
          gap: 64,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse only supports <img> */}
        <img src={logoSrc} width={380} height={349} alt="" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#1a2340", lineHeight: 1.1 }}>
            {SITE_NAME}
          </div>
          <div style={{ marginTop: 24, fontSize: 34, color: "#2a5bd7", lineHeight: 1.3 }}>
            Live one-to-one online classes with expert teachers
          </div>
          <div style={{ marginTop: 24, fontSize: 26, color: "#5b6478" }}>
            Anytime, anywhere — for students worldwide
          </div>
        </div>
      </div>
    ),
    { width: OG_IMAGE.width, height: OG_IMAGE.height }
  );
}
