import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

/** Wer noch nicht gewählt hat, ob Benny oder Lisa, landet bei der Auswahl. */
export function proxy(request: NextRequest) {
  if (!readSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|manifest.webmanifest|icon|apple-icon).*)"],
};
