"use client";

import { Calendar, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { setVisitedOn } from "@/lib/actions";
import { formatDate, todayBerlin } from "@/lib/format-date";
import { SAVE_FAILED, toast } from "@/lib/toast";

/** "Zuletzt besucht": Datum direkt änderbar, plus "Heute" */
export function VisitedDate({ restaurantId, date }: { restaurantId: number; date: string | null }) {
  const [value, setValue] = useState(date ?? "");
  const [pending, startTransition] = useTransition();
  const today = todayBerlin();

  function save(next: string) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await setVisitedOn(restaurantId, next || null);
        toast(next ? `Zuletzt besucht: ${formatDate(next)}` : "Datum entfernt");
      } catch {
        setValue(previous);
        toast(SAVE_FAILED, "error");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-surface p-1 pl-4">
      <Calendar className="size-4 shrink-0 text-muted" />
      <span className="shrink-0 text-sm text-muted">Zuletzt besucht</span>
      <input
        type="date"
        value={value}
        max={today}
        onChange={(e) => save(e.target.value)}
        aria-label="Zuletzt besucht"
        className="min-w-0 flex-1 appearance-none bg-transparent text-right font-medium outline-none"
      />
      {pending && <LoaderCircle className="size-4 shrink-0 animate-spin text-muted" />}
      {value !== today && (
        <button
          type="button"
          onClick={() => save(today)}
          disabled={pending}
          className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-paper"
        >
          Heute
        </button>
      )}
    </div>
  );
}
