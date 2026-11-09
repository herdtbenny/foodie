"use server";

import { and, eq, max } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePerson } from "./auth";
import { getDb } from "./db";
import { categories, ratings, restaurants } from "./db/schema";
import { todayBerlin } from "./format-date";
import { geocodeFirst, lookupMaps, type MapsInfo } from "./maps";
import { isPerson } from "./people";
import { AUTH_COOKIE, PERSON_COOKIE, signAuth, verifyAuth } from "./session";
import { toStatus, type Status } from "./restaurants";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  return text(formData, key) || null;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function optionalDate(formData: FormData, key: string) {
  const value = text(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function refresh() {
  revalidatePath("/", "layout");
}

export type LoginState = { error?: string };

/** Anmeldung: Passwort (nur beim ersten Mal pro Gerät) + „Wer bist du?“ */
export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const person = formData.get("person");
  if (!isPerson(person)) return { error: "Wer bist du?" };

  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  if (!(await verifyAuth(store.get(AUTH_COOKIE)?.value))) {
    const password = formData.get("password");
    if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
      return { error: "Das Passwort stimmt nicht." };
    }
    store.set(AUTH_COOKIE, await signAuth(), {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // Kein maxAge: Sitzungs-Cookie, beim nächsten Öffnen wird wieder gefragt
  store.set(PERSON_COOKIE, person, { httpOnly: true, secure, sameSite: "lax", path: "/" });
  redirect("/");
}

export async function switchPerson() {
  const store = await cookies();
  store.delete(PERSON_COOKIE);
  redirect("/login");
}

/** Google-Maps-Link (oder geteilter Text) auslesen, für das Formular. */
export async function lookupMapsLink(input: string): Promise<MapsInfo | null> {
  await requirePerson();
  return lookupMaps(input);
}

/** Legt ein Restaurant an oder aktualisiert es. */
export async function saveRestaurant(formData: FormData): Promise<{ error: string } | { id: number }> {
  const person = await requirePerson();
  const db = getDb();

  const id = Number.parseInt(text(formData, "id"), 10) || null;
  const name = text(formData, "name");
  if (!name) return { error: "Bitte gib dem Restaurant einen Namen." };

  const status = toStatus(text(formData, "status"));
  const mapsUrl = optionalText(formData, "mapsUrl");
  const address = optionalText(formData, "address");
  let lat = optionalNumber(formData, "lat");
  let lng = optionalNumber(formData, "lng");

  // Keine Position aus dem Formular: nochmal Link auslesen, dann Adresse suchen
  if (lat === null || lng === null) {
    const fromLink = mapsUrl ? await lookupMaps(mapsUrl) : null;
    const hit =
      fromLink?.lat != null && fromLink.lng != null
        ? { lat: fromLink.lat, lng: fromLink.lng }
        : await geocodeFirst([[name, address], [address]]);
    lat = hit?.lat ?? null;
    lng = hit?.lng ?? null;
  }

  const values = {
    name,
    cuisine: optionalText(formData, "cuisine"),
    kind: optionalText(formData, "kind"),
    address,
    mapsUrl,
    lat,
    lng,
    status,
    visitedOn: status === "besucht" ? optionalDate(formData, "visitedOn") : null,
    notes: optionalText(formData, "notes"),
  };

  if (id) {
    const updated = await db
      .update(restaurants)
      .set(values)
      .where(eq(restaurants.id, id))
      .returning({ id: restaurants.id });
    if (!updated.length) return { error: "Restaurant nicht gefunden." };
    refresh();
    return { id };
  }

  const [created] = await db
    .insert(restaurants)
    .values({ ...values, createdBy: person })
    .returning({ id: restaurants.id });
  refresh();
  return { id: created.id };
}

export async function deleteRestaurant(id: number) {
  await requirePerson();
  await getDb().delete(restaurants).where(eq(restaurants.id, id));
  refresh();
}

/** Note der eingeloggten Person in einer Kategorie setzen (1–10), oder mit null entfernen. */
export async function rateRestaurant(restaurantId: number, categoryId: number, score: number | null) {
  const person = await requirePerson();
  const db = getDb();
  if (score === null) {
    await db
      .delete(ratings)
      .where(
        and(eq(ratings.restaurantId, restaurantId), eq(ratings.categoryId, categoryId), eq(ratings.person, person)),
      );
  } else {
    if (!Number.isInteger(score) || score < 1 || score > 10) return;
    await db
      .insert(ratings)
      .values({ restaurantId, categoryId, person, score })
      .onConflictDoUpdate({
        target: [ratings.restaurantId, ratings.categoryId, ratings.person],
        set: { score, updatedAt: new Date() },
      });
  }
  refresh();
}

/** Neue Bewertungs-Kategorie anlegen */
export async function addCategory(name: string) {
  await requirePerson();
  const value = name.trim().slice(0, 40);
  if (!value) return;
  const db = getDb();
  const [{ last }] = await db.select({ last: max(categories.position) }).from(categories);
  await db.insert(categories).values({ name: value, weight: 1, position: (last ?? -1) + 1 });
  refresh();
}

export async function renameCategory(id: number, name: string) {
  await requirePerson();
  const value = name.trim().slice(0, 40);
  if (!value) return;
  await getDb().update(categories).set({ name: value }).where(eq(categories.id, id));
  refresh();
}

/** Gewichtung 0–5 (0 = zählt nicht zur Gesamtnote) */
export async function setCategoryWeight(id: number, weight: number) {
  await requirePerson();
  if (!Number.isInteger(weight) || weight < 0 || weight > 5) return;
  await getDb().update(categories).set({ weight }).where(eq(categories.id, id));
  refresh();
}

/** Löscht die Kategorie samt aller Noten darin */
export async function deleteCategory(id: number) {
  await requirePerson();
  await getDb().delete(categories).where(eq(categories.id, id));
  refresh();
}

/** Zwischen Wunschliste und "Waren wir schon" wechseln. */
export async function setStatus(restaurantId: number, status: Status) {
  await requirePerson();
  const db = getDb();
  const [current] = await db
    .select({ visitedOn: restaurants.visitedOn })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId));
  if (!current) throw new Error("Restaurant nicht gefunden");
  await db
    .update(restaurants)
    .set(
      status === "besucht"
        ? { status, visitedOn: current.visitedOn ?? todayBerlin() }
        : { status, visitedOn: null },
    )
    .where(eq(restaurants.id, restaurantId));
  refresh();
}

/** Gemeinsame Notizen speichern. */
export async function saveNotes(restaurantId: number, notes: string) {
  await requirePerson();
  const [updated] = await getDb()
    .update(restaurants)
    .set({ notes: notes.trim() || null })
    .where(eq(restaurants.id, restaurantId))
    .returning({ id: restaurants.id });
  if (!updated) throw new Error("Restaurant nicht gefunden");
  refresh();
}
