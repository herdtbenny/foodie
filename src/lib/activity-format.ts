import { PEOPLE, type Person } from "./people";

// Typen und Texte für Aktivitäten – ohne DB-Import, damit auch Client-Komponenten sie nutzen können.

export type ActivityType = "created" | "visited" | "rated" | "photo" | "dish";

export type ActivityMeta = {
  /** Name des Restaurants */
  name: string;
  /** created: Wunschliste oder schon besucht */
  status?: "wunsch" | "besucht";
  /** rated */
  category?: string;
  score?: number;
  /** dish */
  dish?: string;
};

export type ActivityItem = {
  id: number;
  actor: Person;
  type: ActivityType;
  restaurantId: number | null;
  meta: ActivityMeta;
  createdAt: string;
};

export type UnreadActivity = { items: ActivityItem[]; unread: number };

function shorten(text: string, max = 70) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function describeActivity({ actor, type, meta }: ActivityItem) {
  const who = PEOPLE[actor].name;
  const name = `„${meta.name}“`;
  switch (type) {
    case "created":
      return meta.status === "besucht"
        ? `${who} hat ${name} als besucht eingetragen`
        : `${who} hat ${name} auf die Wunschliste gesetzt`;
    case "visited":
      return `${who}: Wir waren in ${name}!`;
    case "rated":
      return `${who} hat ${name} bewertet – ${meta.category} ${meta.score}/10`;
    case "photo":
      return `${who} hat ein Foto zu ${name} hochgeladen`;
    case "dish":
      return `${who} hat bei ${name} gegessen: „${shorten(meta.dish ?? "")}“`;
  }
}

export function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });
}
