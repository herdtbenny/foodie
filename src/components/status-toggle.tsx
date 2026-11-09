"use client";

import { Heart, LoaderCircle, PartyPopper } from "lucide-react";
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
    // Klein, sitzt in der Zeile "Zuletzt besucht"
    return (
      <button
        type="button"
        onClick={() => {
          if (confirm("Zurück auf die Wunschliste? Das Besuchsdatum wird entfernt.")) change("wunsch");
        }}
        disabled={pending}
        aria-label="Zurück auf die Wunschliste"
        title="Zurück auf die Wunschliste"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-ink disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Heart className="size-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => change("besucht")}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 font-semibold text-accent-ink disabled:opacity-70"
    >
      {pending ? <LoaderCircle className="size-5 animate-spin" /> : <PartyPopper className="size-5" />}
      Waren wir da!
    </button>
  );
}
