/** "YYYY-MM-DD" → "25. Okt. 2026" */
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(date),
  );
}

/** Heutiges Datum als "YYYY-MM-DD" in deutscher Zeit */
export function todayBerlin() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}
