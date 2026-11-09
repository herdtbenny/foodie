import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, SESSION_COOKIE } from "./session";

export async function getPerson() {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

export async function requirePerson() {
  const person = await getPerson();
  if (!person) redirect("/login");
  return person;
}
