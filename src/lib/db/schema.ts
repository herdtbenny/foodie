import { date, doublePrecision, integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Küche, z. B. "Italienisch" */
  cuisine: text("cuisine"),
  /** Art, z. B. "Abendessen", "Frühstück", "Café", "Bar", "Bestellung" */
  kind: text("kind"),
  address: text("address"),
  mapsUrl: text("maps_url"),
  /** Aus dem Google-Maps-Link gelesen (oder per Adresse gesucht) */
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  /** "wunsch" = wollen wir mal hin, "besucht" = waren wir schon */
  status: text("status").notNull().default("wunsch"),
  visitedOn: date("visited_on", { mode: "string" }),
  /** Gemeinsame Notizen */
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Bewertungs-Kategorien (Ambiente, Preis-Leistung, Geschmack, …) mit gemeinsamer Gewichtung */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** 0–5; 0 = zählt nicht zur Gesamtnote */
  weight: integer("weight").notNull().default(1),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Eine Note (1–10) pro Person, Restaurant und Kategorie */
export const ratings = pgTable(
  "ratings",
  {
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    person: text("person").notNull(),
    score: integer("score").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.restaurantId, t.categoryId, t.person] })],
);
