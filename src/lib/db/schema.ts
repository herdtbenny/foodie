import { date, doublePrecision, integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Küche, z. B. "Italienisch" */
  cuisine: text("cuisine"),
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

/** Eine Bewertung (1–10) pro Person und Restaurant */
export const ratings = pgTable(
  "ratings",
  {
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    person: text("person").notNull(),
    score: integer("score").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.restaurantId, t.person] })],
);
