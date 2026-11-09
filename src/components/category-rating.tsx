"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { rateRestaurant } from "@/lib/actions";
import { PEOPLE, type Person } from "@/lib/people";
import { SAVE_FAILED, toast } from "@/lib/toast";

/**
 * Eine Kategorie (z. B. Geschmack): oben Name, Gewicht und die Note der anderen Person,
 * darunter die eigene Note als 1–10. Nochmal auf die gewählte Zahl tippen entfernt sie.
 */
export function CategoryRating({
  restaurantId,
  categoryId,
  name,
  percent,
  person,
  own,
  others,
}: {
  restaurantId: number;
  categoryId: number;
  name: string;
  percent: number;
  person: Person;
  own?: number;
  others: { person: Person; score?: number }[];
}) {
  const [value, setValue] = useState<number | undefined>(own);
  const [pending, startTransition] = useTransition();
  const me = PEOPLE[person];

  function choose(next: number) {
    const previous = value;
    const target = next === value ? undefined : next;
    setValue(target);
    startTransition(async () => {
      try {
        await rateRestaurant(restaurantId, categoryId, target ?? null);
        toast(target ? `${name}: ${target}/10` : `${name}: Note entfernt`);
      } catch {
        setValue(previous);
        toast(SAVE_FAILED, "error");
      }
    });
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline gap-2">
        <h3 className="font-display text-xl font-semibold">{name}</h3>
        <span className="text-xs text-muted tabular-nums">{percent} %</span>
        {pending && <LoaderCircle className="size-3.5 animate-spin self-center text-muted" />}
        <div className="ml-auto flex gap-1.5">
          {others.map((o) => (
            <span
              key={o.person}
              className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${PEOPLE[o.person].soft} ${PEOPLE[o.person].text}`}
            >
              {PEOPLE[o.person].name} {o.score ?? "–"}
            </span>
          ))}
        </div>
      </div>
      <div role="radiogroup" aria-label={`${name}: deine Note`} className="grid max-w-md grid-cols-10 gap-1">
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
              onClick={() => choose(n)}
              className={`flex aspect-square items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors sm:text-sm ${
                selected
                  ? `${me.bg} text-white`
                  : below
                    ? `${me.soft} ${me.text}`
                    : "border border-line text-muted hover:border-ink hover:text-ink"
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
