import { avatarUrls } from "@/lib/avatars";
import { isAuthed } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Wer bist du? · Foodie" };

export default async function LoginPage() {
  const needsPassword = !(await isAuthed());
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="mx-auto mb-5 size-16 rounded-3xl ring-1 ring-line" />
        <h1 className="font-display text-4xl font-semibold tracking-tight">Mahlzeit.</h1>
        <p className="mt-2 text-muted">Wo gehen wir als Nächstes essen?</p>
      </div>
      <LoginForm avatars={avatarUrls()} needsPassword={needsPassword} />
    </main>
  );
}
