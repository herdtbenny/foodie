/** Gesamtnote → Farbe: 1 = Rot, 10 = Grün (wie Pins und Legende auf der Karte) */
export function scoreColor(score: number) {
  const t = Math.min(Math.max((score - 1) / 9, 0), 1);
  return `hsl(${Math.round(t * 125)} 62% 42%)`;
}
