import { isPerson, type Person } from "./people";

// Nur Web Crypto, damit es auch im Proxy läuft.

/** Wer gerade am Gerät ist – Sitzungs-Cookie, beim nächsten Öffnen wird wieder gefragt */
export const PERSON_COOKIE = "foodie_person";
/** Gerät kennt das Passwort – signiert mit Ablaufdatum, danach wird wieder gefragt */
export const AUTH_COOKIE = "foodie_auth";
/** Wie lange das Passwort gilt (Sekunden) */
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();
const AUTH_VALUE = "foodie-ok-v3";

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

/** Cookie-Wert: "<Ablauf in ms>.<Signatur>" – das Ablaufdatum ist mitsigniert */
export async function signAuth() {
  const expires = Date.now() + AUTH_MAX_AGE * 1000;
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(`${AUTH_VALUE}:${expires}`));
  return `${expires}.${toBase64Url(signature)}`;
}

export async function verifyAuth(value: string | undefined) {
  if (!value) return false;
  const [rawExpires, signature] = value.split(".");
  const expires = Number(rawExpires);
  if (!signature || !Number.isFinite(expires) || expires < Date.now()) return false;
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(signature),
      encoder.encode(`${AUTH_VALUE}:${expires}`),
    );
  } catch {
    return false;
  }
}
