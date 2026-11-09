"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { rateRestaurant } from "@/lib/actions";
import { SAVE_FAILED, toast } from "@/lib/toast";

/**
 * Eine Zeile pro Person: Name, Slider 1–10, Wert.
 * Die eigene Zeile ist bedienbar und speichert kurz nach dem Loslassen, die andere ist nur Anzeige.
 */
export function RatingSlider({
  restaurantId,
  score,
  label,
  editable,
  colorClass,
  avatar,
}: {
  restaurantId: number;
  score?: number;
  label: string;
  editable: boolean;
  colorClass: string;
  avatar: React.ReactNode;
}) {
  const [own, setOwn] = useState<number | undefined>(score);
  // Die Zeile der anderen Person zeigt immer den aktuellen Stand vom Server
  const value = editable ? own : score;
  const [pending, startTransition] = useTransition();
  const saved = useRef(score);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function change(next: number) {
    setOwn(next);
    clearTimeout(timer.current);
    // Erst speichern, wenn der Finger kurz stillhält – nicht bei jedem Zwischenschritt
    timer.current = setTimeout(() => {
      if (next === saved.current) return;
      startTransition(async () => {
        try {
          await rateRestaurant(restaurantId, next);
          saved.current = next;
          toast(`Bewertung gespeichert: ${next}/10`);
        } catch {
          toast(SAVE_FAILED, "error");
        }
      });
    }, 500);
  }

  const percent = value ? ((value - 1) / 9) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      {avatar}
      <span className="w-12 shrink-0 text-sm font-medium">{label}</span>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value ?? 5}
        disabled={!editable}
        onChange={(e) => change(Number(e.target.value))}
        aria-label={`Bewertung ${label}`}
        aria-valuetext={value ? `${value} von 10` : "noch nicht bewertet"}
        className={`h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-line disabled:cursor-default ${colorClass} ${
          value ? "" : "opacity-40"
        } [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-current [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-current [&::-webkit-slider-thumb]:shadow-md disabled:[&::-webkit-slider-thumb]:size-4 disabled:[&::-moz-range-thumb]:size-4`}
        style={{
          background: value
            ? `linear-gradient(to right, currentColor ${percent}%, var(--line) ${percent}%)`
            : undefined,
        }}
      />
      <span className="flex w-14 shrink-0 items-center justify-end gap-1 font-semibold tabular-nums">
        {pending && <LoaderCircle className="size-3.5 animate-spin text-muted" />}
        {value ? (
          <>
            {value}
            <span className="text-xs font-normal text-muted">/10</span>
          </>
        ) : (
          <span className="text-xs font-normal text-muted">offen</span>
        )}
      </span>
    </div>
  );
}
