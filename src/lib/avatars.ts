import type { Person } from "./people";

/** Optionale Profilbilder, Adressen kommen aus Umgebungsvariablen (nicht im Repo). */
export function avatarUrls(): Partial<Record<Person, string>> {
  return { german: process.env.AVATAR_GERMAN_URL, evelyne: process.env.AVATAR_EVELYNE_URL };
}
