import type { Person } from "./people";

/** Profilbilder liegen in Vercel Blob, die Adressen kommen aus Umgebungsvariablen (nicht im Repo). */
export function avatarUrls(): Partial<Record<Person, string>> {
  return { benny: process.env.AVATAR_BENNY_URL, lisa: process.env.AVATAR_LISA_URL };
}
