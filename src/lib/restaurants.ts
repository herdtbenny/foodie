import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { ratings, restaurants } from "./db/schema";
import { isPerson, type Person } from "./people";

export type Scores = Partial<Record<Person, number>>;
export type Status = "wunsch" | "besucht";

export type RestaurantSummary = {
  id: number;
  name: string;
  cuisine: string | null;
  address: string | null;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: Status;
  visitedOn: string | null;
  createdBy: string;
  createdAt: string;
  scores: Scores;
};

export function toStatus(value: unknown): Status {
  return value === "besucht" ? "besucht" : "wunsch";
}

/** Durchschnitt der vorhandenen Bewertungen, oder null */
export function averageScore(scores: Scores) {
  const values = Object.values(scores);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export async function listRestaurants(): Promise<RestaurantSummary[]> {
  const db = getDb();
  const [rows, ratingRows] = await Promise.all([db.select().from(restaurants), db.select().from(ratings)]);

  const scores = new Map<number, Scores>();
  for (const rating of ratingRows) {
    if (!isPerson(rating.person)) continue;
    const entry = scores.get(rating.restaurantId) ?? {};
    entry[rating.person] = rating.score;
    scores.set(rating.restaurantId, entry);
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    address: r.address,
    mapsUrl: r.mapsUrl,
    lat: r.lat,
    lng: r.lng,
    status: toStatus(r.status),
    visitedOn: r.visitedOn,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
    scores: scores.get(r.id) ?? {},
  }));
}

export async function getRestaurant(id: number) {
  if (!Number.isInteger(id)) return null;
  const db = getDb();
  const [[row], ratingRows] = await Promise.all([
    db.select().from(restaurants).where(eq(restaurants.id, id)),
    db.select().from(ratings).where(eq(ratings.restaurantId, id)),
  ]);
  if (!row) return null;

  const scores: Scores = {};
  for (const rating of ratingRows) {
    if (isPerson(rating.person)) scores[rating.person] = rating.score;
  }
  return { ...row, status: toStatus(row.status), scores };
}

export type RestaurantDetail = NonNullable<Awaited<ReturnType<typeof getRestaurant>>>;

/** Alle bisher benutzten Küchen, für Vorschläge im Formular und Filter */
export function cuisinesOf(list: { cuisine: string | null }[]) {
  return [...new Set(list.map((r) => r.cuisine?.trim()).filter((c): c is string => !!c))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );
}
