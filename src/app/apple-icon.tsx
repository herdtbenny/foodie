import { brandIcon } from "./_fonts/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-Bildschirm-Icon (iOS rundet die Ecken selbst) */
export default function AppleIcon() {
  return brandIcon(180, false);
}
