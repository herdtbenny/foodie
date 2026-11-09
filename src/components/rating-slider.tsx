"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { rateRestaurant } from "@/lib/actions";
import { SAVE_FAILED, toast } from "@/lib/toast";

/**
 * Eine Zeile pro Person: Name + Wert, darunter 1–10 als runde Buttons.
 * Die eigene Zeile ist antippbar und speichert sofort, die andere ist nur Anzeige.
 */
export function RatingSlider({
  restaurantId,
  score,
  label,
  editable,
  colorClass,
  bgClass,
  softClass,
  avatar,
}: {
  restaurantId: number;
  score?: number;
  label: string;
  editable: boolean;
  colorClass: string;
  bgClass: string;
  softClass: string;
  avatar: React.ReactNode;
}) {
  const [own, setOwn] = useState<number | undefined>(score);
  // Die Zeile der anderen Person zeigt immer den aktuellen Stand vom Server
  const value = editable ? own : score;
  const [pending, startTransition] = useTransition();

  function choose(next: number) {
    if (next === own) return;
    const previous = own;
    setOwn(next);
    startTransition(async () => {
      try {
        await rateRestaurant(restaurantId, next);
        toast(`Bewertung gespeichert: ${next}/10`);
      } catch {
        setOwn(previous);
        toast(SAVE_FAILED, "error");
      }
    });
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        {avatar}
        <span className="flex-1 text-sm font-medium">{label}</span>
        <span className="flex items-center gap-1 font-semibold tabular-nums">
          {pending && <LoaderCircle className="size-3.5 animate-spin text-muted" />}
          {value ? (
            <span className={`font-display text-2xl leading-none ${colorClass}`}>
              {value}
              <span className="text-sm font-normal text-muted">/10</span>
            </span>
          ) : (
            <span className="text-xs font-normal text-muted">noch offen</span>
          )}
        </span>
      </div>
      <div role="radiogroup" aria-label={`Bewertung ${label}`} className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = value === n;
          const below = !!value && n < value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${n} von 10`}
              disabled={!editable}
              onClick={() => choose(n)}
              className={`flex aspect-square items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors disabled:cursor-default sm:text-sm ${
                selected
                  ? `${bgClass} text-white`
                  : below
                    ? `${softClass} ${colorClass}`
                    : `border border-line text-muted ${editable ? "hover:border-ink hover:text-ink" : ""}`
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
