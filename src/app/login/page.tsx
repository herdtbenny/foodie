import { Avatar } from "@/components/avatar";
import { choosePerson } from "@/lib/actions";
import { avatarUrls } from "@/lib/avatars";
import { PEOPLE, type Person } from "@/lib/people";

export const metadata = { title: "Wer bist du? · Foodie" };

const ORDER: Person[] = ["lisa", "benny"];

/** Kein Passwort – nur wählen, wer gerade am Gerät ist. */
export default function LoginPage() {
  const avatars = avatarUrls();
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mx-auto mb-5 size-16 rounded-3xl" />
        <h1 className="font-display text-4xl font-semibold tracking-tight">Mahlzeit.</h1>
        <p className="mt-2 text-muted">Wo gehen wir als Nächstes essen?</p>
      </div>
      <form action={choosePerson}>
        <p className="mb-3 text-sm font-medium text-muted">Wer bist du?</p>
        <div className="space-y-3">
          {ORDER.map((id) => (
            <button
              key={id}
              type="submit"
              name="person"
              value={id}
              className="flex w-full items-center gap-3 rounded-full border-2 border-line bg-surface p-2 pr-6 text-lg transition-colors hover:border-accent active:border-accent"
            >
              <Avatar person={id} url={avatars[id]} className="size-12 text-lg" />
              <span className="font-medium">{PEOPLE[id].name}</span>
            </button>
          ))}
        </div>
      </form>
    </main>
  );
}
