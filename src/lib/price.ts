/** Preisniveau: 1 = günstig, 2 = mittel, 3 = teuer */
export const PRICE_LEVELS = [
  { value: 1, label: "€", hint: "günstig" },
  { value: 2, label: "€€", hint: "mittel" },
  { value: 3, label: "€€€", hint: "teuer" },
] as const;

export function toPriceLevel(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 3 ? value : null;
}

export function formatPrice(level: number | null | undefined) {
  return level ? "€".repeat(Math.min(level, 3)) : "";
}
