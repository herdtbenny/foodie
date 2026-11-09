"use client";

import { LoaderCircle, PartyPopper } from "lucide-react";
import { useTransition } from "react";
import { setStatus } from "@/lib/actions";
import type { Status } from "@/lib/restaurants";
import { SAVE_FAILED, toast } from "@/lib/toast";

/** Von der Wunschliste zu "Bisherige": "Wir waren da!" (zurück geht es nicht mehr) */
export function StatusToggle({ restaurantId, status }: { restaurantId: number; status: Status }) {
  const [pending, startTransition] = useTransition();

  if (status === "besucht") return null;

  function markVisited() {
    startTransition(async () => {
      try {
        await setStatus(restaurantId, "besucht");
        toast("Eingetragen als besucht – jetzt bewerten!");
      } catch {
        toast(SAVE_FAILED, "error");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={markVisited}
      disabled={pending}
      className="press flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 font-semibold text-accent-ink disabled:opacity-70"
    >
      {pending ? <LoaderCircle className="size-5 animate-spin" /> : <PartyPopper className="size-5" />}
      Wir waren da!
    </button>
  );
}
