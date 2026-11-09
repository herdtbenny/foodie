"use client";

import { useActionState } from "react";
import { Avatar } from "@/components/avatar";
import { login, type LoginState } from "@/lib/actions";
import { PEOPLE, type Person } from "@/lib/people";

const ORDER: Person[] = ["german", "evelyne"];

export function LoginForm({
  avatars,
  needsPassword,
}: {
  avatars: Partial<Record<Person, string>>;
  needsPassword: boolean;
}) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-5">
      {needsPassword && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">Passwort</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-full border border-line bg-surface px-5 py-3 outline-none focus:border-ink"
          />
        </label>
      )}

      <div>
        <p className="mb-3 text-sm font-medium text-muted">Wer bist du?</p>
        <div className="space-y-3">
          {ORDER.map((id) => (
            <button
              key={id}
              type="submit"
              name="person"
              value={id}
              disabled={pending}
              className="press flex w-full items-center gap-3 rounded-full border-2 border-line bg-surface p-2 pr-6 text-lg transition-colors hover:border-ink active:border-ink disabled:opacity-60"
            >
              <Avatar person={id} url={avatars[id]} className="size-12 text-lg" />
              <span className="font-medium">{PEOPLE[id].name}</span>
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-pop">
          {state.error}
        </p>
      )}
    </form>
  );
}
