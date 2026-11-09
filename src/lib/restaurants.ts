import { asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { categories, ratings, restaurants, reviews } from "./db/schema";
import { isPerson, PERSON_IDS, type Person } from "./people";

export type Scores = Partial<Record<Person, number>>;
export type Status = "wunsch" | "besucht";
export type Review = { dish: string | null; photoUrl: string | null };
export type Reviews = Partial<Record<Person, Review>>;
export type Category = { id: number; name: string; weight: number; position: number; onSiteOnly: boolean };
/** categoryId → Person → Note */
export type CategoryRatings = Record<number, Scores>;

export type RestaurantSummary = {
  id: number;
  name: string;
  cuisine: string | null;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: Status;
  /** Bestellt statt vor Ort */
  ordered: boolean;
  visitedOn: string | null;
  /** 1–3 (€ bis €€€) */
  priceLevel: number | null;
  createdBy: string;
  createdAt: string;
  ratings: CategoryRatings;
  /** Gesamtnote je Person (gewichtet über die Kategorien) */
  scores: Scores;
  /** Gesamtnote des Restaurants: Schnitt der Personen */
  overall: number | null;
};

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

/** Kategorien, die für dieses Restaurant zählen (bei Bestellung ohne "nur vor Ort") */
export function activeCategories(cats: Category[], ordered: boolean) {
  return ordered ? cats.filter((c) => !c.onSiteOnly) : cats;
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

export function overallScores(ratingsByCategory: CategoryRatings, allCats: Category[], ordered = false) {
  const cats = activeCategories(allCats, ordered);
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
    .select({
      id: categories.id,
      name: categories.name,
      weight: categories.weight,
      position: categories.position,
      onSiteOnly: categories.onSiteOnly,
    })
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
    entry[row.person] = { dish: row.dish, photoUrl: row.photoUrl };
    byRestaurant.set(row.restaurantId, entry);
  }
  return byRestaurant;
}

const reviewColumns = {
  restaurantId: reviews.restaurantId,
  person: reviews.person,
  dish: reviews.dish,
  photoUrl: reviews.photoUrl,
};

export async function listRestaurants(): Promise<{ restaurants: RestaurantSummary[]; categories: Category[] }> {
  const db = getDb();
  const [rows, ratingRows, cats] = await Promise.all([
    db.select().from(restaurants),
    db.select().from(ratings),
    listCategories(),
  ]);
  const grouped = groupRatings(ratingRows);

  return {
    categories: cats,
    restaurants: rows.map((r) => {
      const byCategory = grouped.get(r.id) ?? {};
      return {
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        mapsUrl: r.mapsUrl,
        lat: r.lat,
        lng: r.lng,
        status: toStatus(r.status),
        ordered: r.ordered,
        visitedOn: r.visitedOn,
        priceLevel: r.priceLevel,
        createdBy: r.createdBy,
        createdAt: r.createdAt.toISOString(),
        ratings: byCategory,
        ...overallScores(byCategory, cats, r.ordered),
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
    ...overallScores(byCategory, cats, row.ordered),
  };
}

export type RestaurantDetail = NonNullable<Awaited<ReturnType<typeof getRestaurant>>>;

/** Alle bisher benutzten Küchen, für Vorschläge und Filter */
export function cuisinesOf(list: { cuisine: string | null }[]) {
  return [...new Set(list.map((r) => r.cuisine?.trim()).filter((c): c is string => !!c))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );
}
