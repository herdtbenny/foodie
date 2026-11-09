import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-Bildschirm-Icon: schwarzes "f" mit rotem Punkt auf Creme */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f1e7" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M21 52V24a12 12 0 0 1 12-12h7v9h-7a3 3 0 0 0-3 3v28z" fill="#1d1b18" />
          <rect x="14" y="27" width="24" height="8" fill="#1d1b18" />
          <circle cx="45" cy="47" r="6" fill="#d7392b" />
        </svg>
      </div>
    ),
    size,
  );
}
