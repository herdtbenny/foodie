import { isPerson, type Person } from "./people";

// Kein Passwort: das Cookie merkt sich nur, wer gerade am Gerät ist.
export const SESSION_COOKIE = "foodie_person";

export function readSession(value: string | undefined): Person | null {
  return isPerson(value) ? value : null;
}
