import { asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { categories, ratings, restaurants, reviews } from "./db/schema";
import { isPerson, PERSON_IDS, type Person } from "./people";

export type Scores = Partial<Record<Person, number>>;
export type Status = "wunsch" | "besucht";
export type Review = { recommend: boolean; dish: string | null; photoUrl: string | null };
export type Reviews = Partial<Record<Person, Review>>;
export type Category = { id: number; name: string; weight: number; position: number };
/** categoryId → Person → Note */
export type CategoryRatings = Record<number, Scores>;

export type RestaurantSummary = {
  id: number;
  name: string;
  cuisine: string | null;
  kind: string | null;
  address: string | null;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: Status;
  visitedOn: string | null;
  createdBy: string;
  createdAt: string;
  ratings: CategoryRatings;
  /** Gesamtnote je Person (gewichtet über die Kategorien) */
  scores: Scores;
  /** Gesamtnote des Restaurants: Schnitt der Personen */
  overall: number | null;
  /** Wer es weiterempfiehlt */
  recommendedBy: Person[];
};

/** Reihenfolge, in der die Arten angezeigt werden */
export const KINDS = ["Frühstück", "Café", "Mittagessen", "Abendessen", "Bar", "Bestellung"];

export function toStatus(value: unknown): Status {
  return value === "besucht" ? "besucht" : "wunsch";
}

export function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Durchschnitt der vorhandenen Noten, oder null */
export function averageScore(scores: Scores) {
  return average(Object.values(scores));
}

/**
 * Gesamtnote einer Person: gewichteter Schnitt über die Kategorien, die sie bewertet hat.
 * Kategorien mit Gewicht 0 zählen nicht.
 */
export function personOverall(ratingsByCategory: CategoryRatings, cats: Category[], person: Person) {
  let sum = 0;
  let weights = 0;
  for (const cat of cats) {
    const score = ratingsByCategory[cat.id]?.[person];
    if (score == null || cat.weight <= 0) continue;
    sum += score * cat.weight;
    weights += cat.weight;
  }
  return weights ? sum / weights : null;
}

export function overallScores(ratingsByCategory: CategoryRatings, cats: Category[]) {
  const scores: Scores = {};
  for (const person of PERSON_IDS) {
    const value = personOverall(ratingsByCategory, cats, person);
    if (value !== null) scores[person] = value;
  }
  return { scores, overall: averageScore(scores) };
}

/** Schnitt beider Personen in einer Kategorie */
export function categoryAverage(ratingsByCategory: CategoryRatings, categoryId: number) {
  return averageScore(ratingsByCategory[categoryId] ?? {});
}

/** Gewicht als Prozent der Gesamtnote */
export function weightPercent(cats: Category[], cat: Category) {
  const total = cats.reduce((sum, c) => sum + Math.max(c.weight, 0), 0);
  return total ? Math.round((Math.max(cat.weight, 0) / total) * 100) : 0;
}

export async function listCategories(): Promise<Category[]> {
  return getDb()
    .select({ id: categories.id, name: categories.name, weight: categories.weight, position: categories.position })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.id));
}

function groupRatings(rows: { restaurantId: number; categoryId: number; person: string; score: number }[]) {
  const byRestaurant = new Map<number, CategoryRatings>();
  for (const row of rows) {
    if (!isPerson(row.person)) continue;
    const entry = byRestaurant.get(row.restaurantId) ?? {};
    (entry[row.categoryId] ??= {})[row.person] = row.score;
    byRestaurant.set(row.restaurantId, entry);
  }
  return byRestaurant;
}

function groupReviews(rows: (Review & { restaurantId: number; person: string })[]) {
  const byRestaurant = new Map<number, Reviews>();
  for (const row of rows) {
    if (!isPerson(row.person)) continue;
    const entry = byRestaurant.get(row.restaurantId) ?? {};
    entry[row.person] = { recommend: row.recommend, dish: row.dish, photoUrl: row.photoUrl };
    byRestaurant.set(row.restaurantId, entry);
  }
  return byRestaurant;
}

const reviewColumns = {
  restaurantId: reviews.restaurantId,
  person: reviews.person,
  recommend: reviews.recommend,
  dish: reviews.dish,
  photoUrl: reviews.photoUrl,
};

export async function listRestaurants(): Promise<{ restaurants: RestaurantSummary[]; categories: Category[] }> {
  const db = getDb();
  const [rows, ratingRows, cats, reviewRows] = await Promise.all([
    db.select().from(restaurants),
    db.select().from(ratings),
    listCategories(),
    db.select(reviewColumns).from(reviews),
  ]);
  const grouped = groupRatings(ratingRows);
  const reviewMap = groupReviews(reviewRows);

  return {
    categories: cats,
    restaurants: rows.map((r) => {
      const byCategory = grouped.get(r.id) ?? {};
      return {
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        kind: r.kind,
        address: r.address,
        mapsUrl: r.mapsUrl,
        lat: r.lat,
        lng: r.lng,
        status: toStatus(r.status),
        visitedOn: r.visitedOn,
        createdBy: r.createdBy,
        createdAt: r.createdAt.toISOString(),
        ratings: byCategory,
        ...overallScores(byCategory, cats),
        recommendedBy: PERSON_IDS.filter((p) => reviewMap.get(r.id)?.[p]?.recommend),
      };
    }),
  };
}

export async function getRestaurant(id: number) {
  if (!Number.isInteger(id)) return null;
  const db = getDb();
  const [[row], ratingRows, cats, reviewRows] = await Promise.all([
    db.select().from(restaurants).where(eq(restaurants.id, id)),
    db.select().from(ratings).where(eq(ratings.restaurantId, id)),
    listCategories(),
    db.select(reviewColumns).from(reviews).where(eq(reviews.restaurantId, id)),
  ]);
  if (!row) return null;

  const byCategory = groupRatings(ratingRows).get(id) ?? {};
  return {
    ...row,
    status: toStatus(row.status),
    ratings: byCategory,
    categories: cats,
    reviews: groupReviews(reviewRows).get(id) ?? {},
    ...overallScores(byCategory, cats),
  };
}

export type RestaurantDetail = NonNullable<Awaited<ReturnType<typeof getRestaurant>>>;

/** Alle bisher benutzten Werte eines Feldes, für Vorschläge im Formular */
export function valuesOf(list: { cuisine: string | null; kind: string | null }[], key: "cuisine" | "kind") {
  const found = new Set(list.map((r) => r[key]?.trim()).filter((c): c is string => !!c));
  if (key === "kind") KINDS.forEach((k) => found.add(k));
  return [...found].sort((a, b) =>
    key === "kind" ? kindOrder(a) - kindOrder(b) || a.localeCompare(b, "de") : a.localeCompare(b, "de"),
  );
}

export function kindOrder(kind: string) {
  const index = KINDS.indexOf(kind);
  return index === -1 ? KINDS.length : index;
}
