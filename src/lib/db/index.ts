import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

let db: ReturnType<typeof createDb> | null = null;

/** Lazy, damit `next build` ohne DATABASE_URL funktioniert. */
export function getDb() {
  db ??= createDb();
  return db;
}
