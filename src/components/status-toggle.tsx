"use client";

import { Bookmark, LoaderCircle, PartyPopper } from "lucide-react";
import { useTransition } from "react";
import { setStatus } from "@/lib/actions";
import type { Status } from "@/lib/restaurants";
import { SAVE_FAILED, toast } from "@/lib/toast";

/** Wunschliste ↔ "Waren wir schon" */
export function StatusToggle({ restaurantId, status }: { restaurantId: number; status: Status }) {
  const [pending, startTransition] = useTransition();
  const visited = status === "besucht";

  function change(next: Status) {
    startTransition(async () => {
      try {
        await setStatus(restaurantId, next);
        toast(next === "besucht" ? "Eingetragen als besucht – jetzt bewerten!" : "Zurück auf der Wunschliste");
      } catch {
        toast(SAVE_FAILED, "error");
      }
    });
  }

  if (visited) {
    return (
      <button
        type="button"
        onClick={() => change("wunsch")}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Bookmark className="size-3.5" />}
        Zurück auf die Wunschliste
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => change("besucht")}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 font-semibold text-accent-ink shadow-md disabled:opacity-70"
    >
      {pending ? <LoaderCircle className="size-5 animate-spin" /> : <PartyPopper className="size-5" />}
      Waren wir da!
    </button>
  );
}
