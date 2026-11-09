import { avatarUrls } from "@/lib/avatars";
import { isAuthed } from "@/lib/auth";
import { Wordmark } from "@/components/wordmark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Wer bist du? · Foodie" };

export default async function LoginPage() {
  const needsPassword = !(await isAuthed());
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <h1>
          <Wordmark className="text-7xl" />
        </h1>
        <p className="mt-3 text-muted">Wo gehen wir als Nächstes essen?</p>
      </div>
      <LoginForm avatars={avatarUrls()} needsPassword={needsPassword} />
    </main>
  );
}
