import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, PERSON_COOKIE, readPerson, verifyAuth } from "@/lib/session";

/** Ohne Passwort oder ohne Auswahl „Wer bist du?“ geht's zur Anmeldung. */
export async function proxy(request: NextRequest) {
  const authed = await verifyAuth(request.cookies.get(AUTH_COOKIE)?.value);
  if (!authed || !readPerson(request.cookies.get(PERSON_COOKIE)?.value)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|manifest.webmanifest|icon|apple-icon|sw.js).*)"],
};
