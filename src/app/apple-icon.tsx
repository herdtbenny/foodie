import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-Bildschirm-Icon: Pin mit Besteck */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#141414" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M32 12c-8.3 0-15 6.5-15 14.6C17 37.5 32 52 32 52s15-14.5 15-25.4C47 18.5 40.3 12 32 12z" fill="#ffffff" />
          <path
            d="M28 19v7.5a2.5 2.5 0 0 0 2 2.45V38h2V28.95a2.5 2.5 0 0 0 2-2.45V19h-1.5v6.5h-1V19h-1.5v6.5h-1V19z M37 19c-1.7 0-2.5 3-2.5 6v3H37v10h2V19z"
            fill="#141414"
          />
        </svg>
      </div>
    ),
    size,
  );
}
