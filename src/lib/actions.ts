"use server";

import { del, put } from "@vercel/blob";
import { and, eq, max } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePerson } from "./auth";
import { getDb } from "./db";
import { categories, ratings, restaurants, reviews } from "./db/schema";
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
    ordered: status === "besucht" && formData.get("ordered") === "1",
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

export type RestaurantPatch = Partial<{
  name: string;
  kind: string | null;
  cuisine: string | null;
  address: string | null;
  mapsUrl: string | null;
}>;

/**
 * Einzelne Felder direkt auf der Detailseite ändern.
 * Neuer Maps-Link oder neue Adresse → Position wird neu gesucht.
 */
export async function updateRestaurant(id: number, patch: RestaurantPatch) {
  await requirePerson();
  const db = getDb();
  const [current] = await db.select().from(restaurants).where(eq(restaurants.id, id));
  if (!current) throw new Error("Restaurant nicht gefunden");

  const clean = (v: string | null | undefined) => (typeof v === "string" ? v.trim().slice(0, 300) || null : null);
  const values: Partial<typeof restaurants.$inferInsert> = {};
  if ("name" in patch) {
    const name = clean(patch.name);
    if (!name) throw new Error("Name fehlt");
    values.name = name;
  }
  if ("kind" in patch) values.kind = clean(patch.kind);
  if ("cuisine" in patch) values.cuisine = clean(patch.cuisine);
  if ("address" in patch) values.address = clean(patch.address);
  if ("mapsUrl" in patch) values.mapsUrl = clean(patch.mapsUrl);

  if ("mapsUrl" in patch && values.mapsUrl) {
    const info = await lookupMaps(values.mapsUrl);
    if (info) {
      values.mapsUrl = info.mapsUrl;
      if (info.lat != null && info.lng != null) {
        values.lat = info.lat;
        values.lng = info.lng;
      }
      if (!current.address && info.address) values.address = info.address;
    }
  } else if ("address" in patch && values.address && !current.mapsUrl) {
    // Ohne Maps-Link: Position aus der Adresse
    const hit = await geocodeFirst([[current.name, values.address], [values.address]]);
    if (hit) {
      values.lat = hit.lat;
      values.lng = hit.lng;
    }
  }

  await db.update(restaurants).set(values).where(eq(restaurants.id, id));
  refresh();
  return { lat: values.lat ?? current.lat, lng: values.lng ?? current.lng, address: values.address ?? current.address };
}

export async function deleteRestaurant(id: number) {
  await requirePerson();
  const db = getDb();
  const photos = await db.select({ url: reviews.photoUrl }).from(reviews).where(eq(reviews.restaurantId, id));
  await db.delete(restaurants).where(eq(restaurants.id, id));
  const urls = photos.map((p) => p.url).filter((u): u is string => !!u);
  if (urls.length) await del(urls);
  refresh();
}

/** Eigenen Eintrag (Gericht, Foto) anlegen oder ändern */
async function updateReview(
  restaurantId: number,
  values: Partial<{ dish: string | null; photoUrl: string | null }>,
) {
  const person = await requirePerson();
  const db = getDb();
  const [previous] = await db
    .select({ photoUrl: reviews.photoUrl })
    .from(reviews)
    .where(and(eq(reviews.restaurantId, restaurantId), eq(reviews.person, person)));
  await db
    .insert(reviews)
    .values({ restaurantId, person, ...values })
    .onConflictDoUpdate({ target: [reviews.restaurantId, reviews.person], set: { ...values, updatedAt: new Date() } });
  // Altes Foto aufräumen, wenn es ersetzt oder entfernt wurde
  if ("photoUrl" in values && previous?.photoUrl && previous.photoUrl !== values.photoUrl) {
    await del(previous.photoUrl).catch(() => {});
  }
  refresh();
}

export async function saveDish(restaurantId: number, dish: string) {
  await updateReview(restaurantId, { dish: dish.trim().slice(0, 2000) || null });
}

/** Eigenes Foto hochladen (kommt bereits verkleinert aus dem Browser) */
export async function uploadPhoto(restaurantId: number, formData: FormData) {
  const person = await requirePerson();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) throw new Error("Kein Foto");
  if (!file.type.startsWith("image/")) throw new Error("Kein Bild");
  const blob = await put(`fotos/${restaurantId}/${person}-${crypto.randomUUID()}.jpg`, file, {
    access: "public",
    contentType: file.type,
  });
  await updateReview(restaurantId, { photoUrl: blob.url });
}

export async function removePhoto(restaurantId: number) {
  await updateReview(restaurantId, { photoUrl: null });
}

/** "Zuletzt besucht" direkt auf der Detailseite setzen */
export async function setVisitedOn(restaurantId: number, date: string | null) {
  await requirePerson();
  const value = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  await getDb().update(restaurants).set({ visitedOn: value }).where(eq(restaurants.id, restaurantId));
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
  // Neue Kategorie startet mit 0 %, die Prozente verteilt man danach selbst
  await db.insert(categories).values({ name: value, weight: 0, position: (last ?? -1) + 1 });
  refresh();
}

export async function renameCategory(id: number, name: string) {
  await requirePerson();
  const value = name.trim().slice(0, 40);
  if (!value) return;
  await getDb().update(categories).set({ name: value }).where(eq(categories.id, id));
  refresh();
}

/** Anteil in Prozent (5er-Schritte). Alle Kategorien zusammen höchstens 100 %. */
export async function setCategoryWeight(id: number, weight: number) {
  await requirePerson();
  if (!Number.isInteger(weight) || weight < 0 || weight > 100 || weight % 5 !== 0) return;
  const db = getDb();
  const others = await db.select({ id: categories.id, weight: categories.weight }).from(categories);
  const rest = others.filter((c) => c.id !== id).reduce((sum, c) => sum + c.weight, 0);
  if (rest + weight > 100) throw new Error("Mehr als 100 %");
  await db.update(categories).set({ weight }).where(eq(categories.id, id));
  refresh();
}

/** Kategorie nur vor Ort bewertbar (bei Bestellung ausgegraut) */
export async function setCategoryOnSiteOnly(id: number, onSiteOnly: boolean) {
  await requirePerson();
  await getDb().update(categories).set({ onSiteOnly }).where(eq(categories.id, id));
  refresh();
}

/** Vor Ort gegessen oder bestellt */
export async function setOrdered(restaurantId: number, ordered: boolean) {
  await requirePerson();
  await getDb().update(restaurants).set({ ordered }).where(eq(restaurants.id, restaurantId));
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
