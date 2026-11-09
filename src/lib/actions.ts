"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePerson } from "./auth";
import { getDb } from "./db";
import { ratings, restaurants } from "./db/schema";
import { todayBerlin } from "./format-date";
import { geocodeFirst, lookupMaps, type MapsInfo } from "./maps";
import { isPerson } from "./people";
import { SESSION_COOKIE } from "./session";
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

/** Auswahl "Wer bist du?" – ohne Passwort. */
export async function choosePerson(formData: FormData) {
  const person = formData.get("person");
  if (!isPerson(person)) return;
  const store = await cookies();
  store.set(SESSION_COOKIE, person, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Kein maxAge: Sitzungs-Cookie, beim nächsten Öffnen wird wieder gefragt
  });
  redirect("/");
}

export async function switchPerson() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
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

/** Bewertung der eingeloggten Person setzen (1–10). Bewerten heißt: wir waren da. */
export async function rateRestaurant(restaurantId: number, score: number) {
  const person = await requirePerson();
  if (!Number.isInteger(score) || score < 1 || score > 10) return;
  const db = getDb();
  await db
    .insert(ratings)
    .values({ restaurantId, person, score })
    .onConflictDoUpdate({
      target: [ratings.restaurantId, ratings.person],
      set: { score, updatedAt: new Date() },
    });
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
