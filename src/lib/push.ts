import { eq, inArray } from "drizzle-orm";
import { sendNotification, setVapidDetails } from "web-push";
import { getDb } from "./db";
import { pushSubscriptions } from "./db/schema";
import type { Person } from "./people";

export type PushPayload = { title: string; body: string; url: string };

let configured = false;

function configure() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  setVapidDetails("mailto:foodie@example.invalid", publicKey, privateKey);
  configured = true;
  return true;
}

/** Schickt eine Push-Nachricht an alle Geräte einer Person; abgelaufene Abos werden entfernt. */
export async function pushToPerson(person: Person, payload: PushPayload) {
  if (!configure()) return;
  const db = getDb();
  const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.person, person));

  const expired: string[] = [];
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ icon: "/apple-icon", ...payload }),
          { TTL: 60 * 60 * 24 },
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) expired.push(sub.endpoint);
        else console.error("Push fehlgeschlagen", status, error);
      }
    }),
  );

  if (expired.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, expired));
}
