"use client";

import { CalendarDays, ChevronDown, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { setVisitedOn } from "@/lib/actions";
import { formatDate, todayBerlin } from "@/lib/format-date";
import { SAVE_FAILED, toast } from "@/lib/toast";

/** Datum-Chip: zeigt das Datum, Antippen öffnet ein kleines Popup mit Auswahl und "Heute" */
export function VisitedDate({ restaurantId, date }: { restaurantId: number; date: string | null }) {
  const [value, setValue] = useState(date ?? "");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const today = todayBerlin();

  // Popup schließen, wenn man daneben tippt
  useEffect(() => {
    if (!open) return;
    function onDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function save(next: string) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await setVisitedOn(restaurantId, next || null);
        toast(next ? `Besucht am ${formatDate(next)}` : "Datum entfernt");
      } catch {
        setValue(previous);
        toast(SAVE_FAILED, "error");
      }
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Zuletzt besucht"
        className={`press glass inline-flex items-center gap-1.5 rounded-full py-1.5 pr-2.5 pl-3 text-sm font-medium ${
          value ? "text-ink" : "text-muted"
        }`}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
        {value ? formatDate(value) : "Datum"}
        <ChevronDown className={`size-3.5 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="card absolute top-full left-0 z-30 mt-2 flex w-64 flex-col gap-2 rounded-3xl p-2 shadow-xl animate-[toast-in_160ms_ease-out]">
          <input
            type="date"
            value={value}
            max={today}
            onChange={(e) => save(e.target.value)}
            aria-label="Datum wählen"
            className="w-full appearance-none rounded-full border border-line bg-surface px-4 py-2.5 font-medium outline-none focus:border-ink"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={value === today}
              onClick={() => {
                save(today);
                setOpen(false);
              }}
              className="press flex-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
            >
              Heute
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  save("");
                  setOpen(false);
                }}
                className="press rounded-full border border-line px-4 py-2 text-sm text-muted"
              >
                Entfernen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
