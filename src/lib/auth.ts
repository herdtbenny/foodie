import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, PERSON_COOKIE, readPerson, verifyAuth } from "./session";

export async function isAuthed() {
  const store = await cookies();
  return verifyAuth(store.get(AUTH_COOKIE)?.value);
}

export async function getPerson() {
  const store = await cookies();
  if (!(await verifyAuth(store.get(AUTH_COOKIE)?.value))) return null;
  return readPerson(store.get(PERSON_COOKIE)?.value);
}

export async function requirePerson() {
  const person = await getPerson();
  if (!person) redirect("/login");
  return person;
}
