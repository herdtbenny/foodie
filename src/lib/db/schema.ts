import { boolean, date, doublePrecision, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { ActivityMeta } from "../activity-format";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Küche, z. B. "Italienisch", "Sushi", "Frühstück", "Bar" */
  cuisine: text("cuisine"),
  mapsUrl: text("maps_url"),
  /** Aus dem Google-Maps-Link gelesen (oder per Adresse gesucht) */
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  /** "wunsch" = wollen wir mal hin, "besucht" = waren wir schon */
  status: text("status").notNull().default("wunsch"),
  /** Bestellt statt vor Ort gegessen – Kategorien "nur vor Ort" (z. B. Ambiente) zählen dann nicht */
  ordered: boolean("ordered").notNull().default(false),
  visitedOn: date("visited_on", { mode: "string" }),
  /** Preisniveau 1–3 (€ bis €€€), null = unbekannt */
  priceLevel: integer("price_level"),
  /** Gemeinsame Notizen */
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Bewertungs-Kategorien (Ambiente, Preis-Leistung, Geschmack, …) mit gemeinsamer Gewichtung */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Anteil an der Gesamtnote in Prozent (5er-Schritte, alle zusammen 100); 0 = zählt nicht */
  weight: integer("weight").notNull().default(0),
  position: integer("position").notNull().default(0),
  /** Nur bewertbar, wenn man vor Ort war (z. B. Ambiente) */
  onSiteOnly: boolean("on_site_only").notNull().default(false),
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

/** Pro Person und Restaurant: was man gegessen hat, ein Foto */
export const reviews = pgTable(
  "reviews",
  {
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    person: text("person").notNull(),
    dish: text("dish"),
    /** Vercel Blob */
    photoUrl: text("photo_url"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.restaurantId, t.person] })],
);

/** Was German oder Evelyne gemacht hat – für Benachrichtigungen und den Rückblick */
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull(),
  type: text("type").notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id, { onDelete: "set null" }),
  /** Name wird mitgespeichert, damit der Eintrag auch nach dem Löschen lesbar bleibt */
  meta: jsonb("meta").$type<ActivityMeta>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Bis zu welcher Aktivität jemand alles gesehen hat */
export const activityReads = pgTable("activity_reads", {
  person: text("person").primaryKey(),
  lastSeenId: integer("last_seen_id").notNull().default(0),
});

/** Push-Abos pro Gerät (ein Endpoint = ein Browser/Homescreen-App) */
export const pushSubscriptions = pgTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  person: text("person").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
