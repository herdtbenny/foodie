import { ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { Notifications } from "@/components/notifications";
import { Toaster } from "@/components/toaster";
import { Wordmark } from "@/components/wordmark";
import { switchPerson } from "@/lib/actions";
import { unreadFor } from "@/lib/activity";
import { requirePerson } from "@/lib/auth";
import { avatarUrls } from "@/lib/avatars";
import { PEOPLE } from "@/lib/people";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const person = await requirePerson();
  const unread = await unreadFor(person);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3 sm:px-6">
        <Link href="/" aria-label="foodie – Startseite" className="min-w-0">
          <Wordmark className="text-4xl" />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Notifications initial={unread} avatars={avatarUrls()} />
        <Link
          href="/kategorien"
          aria-label="Kategorien & Gewichtung"
          className="press glass flex size-10 items-center justify-center rounded-full text-ink"
        >
          <SlidersHorizontal className="size-4" />
        </Link>
        <form action={switchPerson}>
          <button
            type="submit"
            className="press glass flex size-10 items-center justify-center rounded-full sm:w-auto sm:gap-1.5 sm:py-1 sm:pr-3 sm:pl-1"
            aria-label={`Angemeldet als ${PEOPLE[person].name} – wechseln`}
            title={`${PEOPLE[person].name} – wechseln`}
          >
            <Avatar person={person} url={avatarUrls()[person]} className="size-8 text-xs" />
            <span className="hidden text-sm font-medium text-ink sm:inline">{PEOPLE[person].name}</span>
            <ArrowLeftRight className="hidden size-3.5 text-ink sm:block" />
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
