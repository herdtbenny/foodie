import { ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/toaster";
import { switchPerson } from "@/lib/actions";
import { requirePerson } from "@/lib/auth";
import { avatarUrls } from "@/lib/avatars";
import { PEOPLE } from "@/lib/people";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const person = await requirePerson();

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="flex items-center justify-between gap-3 px-2 pt-[max(env(safe-area-inset-top),1rem)] pb-3 sm:px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-10 w-auto shrink-0" />
          <span className="font-display text-3xl leading-tight font-semibold tracking-tight">Foodie</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/kategorien"
          aria-label="Kategorien & Gewichtung"
          className="flex size-8 items-center justify-center rounded-full border border-line bg-surface text-muted"
        >
          <SlidersHorizontal className="size-4" />
        </Link>
        <form action={switchPerson}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-0.5 pr-2.5 pl-0.5 text-sm text-muted"
            aria-label={`Angemeldet als ${PEOPLE[person].name} – wechseln`}
          >
            <Avatar person={person} url={avatarUrls()[person]} className="size-7 text-xs" />
            {PEOPLE[person].name}
            <ArrowLeftRight className="size-3.5" />
          </button>
        </form>
        </div>
      </header>
      <main className="flex-1 px-2 pb-36 sm:px-4">{children}</main>
      <Toaster />
      <BottomNav />
    </div>
  );
}
