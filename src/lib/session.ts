import { isPerson, type Person } from "./people";

// Nur Web Crypto, damit es auch im Proxy läuft.

/** Wer gerade am Gerät ist – Sitzungs-Cookie, beim nächsten Öffnen wird wieder gefragt */
export const PERSON_COOKIE = "foodie_person";
/** Gerät kennt das Passwort – signiert, bleibt ein Jahr */
export const AUTH_COOKIE = "foodie_auth";

const encoder = new TextEncoder();
const AUTH_VALUE = "foodie-ok-v2";

export function readPerson(value: string | undefined): Person | null {
  return isPerson(value) ? value : null;
}

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET ist nicht gesetzt");
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toBase64Url(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}

export async function signAuth() {
  return toBase64Url(await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(AUTH_VALUE)));
}

export async function verifyAuth(value: string | undefined) {
  if (!value) return false;
  try {
    return await crypto.subtle.verify("HMAC", await getKey(), fromBase64Url(value), encoder.encode(AUTH_VALUE));
  } catch {
    return false;
  }
}
