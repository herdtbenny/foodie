import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * App-Icon: "f." in Bricolage Grotesque – schwarzes f, roter Punkt, auf Creme.
 * Die Schrift liegt als winzige Teilmenge (nur "f" und ".") im Projekt.
 */
export async function brandIcon(size: number, rounded: boolean) {
  const font = await readFile(join(process.cwd(), "src/app/_fonts/bricolage-f.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f1e7",
          borderRadius: rounded ? size * 0.22 : 0,
          fontFamily: "Bricolage",
          fontSize: size * 0.78,
          lineHeight: 1,
          letterSpacing: -size * 0.02,
          paddingBottom: size * 0.04,
          paddingLeft: size * 0.04,
        }}
      >
        <span style={{ color: "#3a3633" }}>f</span>
        <span style={{ color: "#d7392b" }}>.</span>
      </div>
    ),
    { width: size, height: size, fonts: [{ name: "Bricolage", data: font, weight: 700, style: "normal" }] },
  );
}
