"use client";

import { LoaderCircle } from "lucide-react";
import { useRef, useState, useTransition, type CSSProperties } from "react";
import { rateRestaurant } from "@/lib/actions";
import { PEOPLE, type Person } from "@/lib/people";
import { SAVE_FAILED, toast } from "@/lib/toast";

/**
 * Eine Kategorie als schmale Zeile: links Name und Gewicht, in der Mitte die eigene Note
 * als Slider (0 = keine Note, 1–10), rechts die eigene Zahl und die Note der anderen Person.
 * Gespeichert wird beim Loslassen.
 */
export function CategoryRating({
  restaurantId,
  categoryId,
  name,
  percent,
  person,
  own,
  others,
  disabled = false,
}: {
  restaurantId: number;
  categoryId: number;
  name: string;
  percent: number;
  person: Person;
  own?: number;
  others: { person: Person; score?: number }[];
  /** Ausgegraut, z. B. Ambiente bei Bestellung */
  disabled?: boolean;
}) {
  const [value, setValue] = useState(own ?? 0);
  const saved = useRef(own ?? 0);
  const [pending, startTransition] = useTransition();
  const me = PEOPLE[person];

  function commit() {
    const target = value;
    const previous = saved.current;
    if (target === previous) return;
    saved.current = target;
    startTransition(async () => {
      try {
        await rateRestaurant(restaurantId, categoryId, target || null);
        toast(target ? `${name}: ${target}/10` : `${name}: Note entfernt`);
      } catch {
        saved.current = previous;
        setValue(previous);
        toast(SAVE_FAILED, "error");
      }
    });
  }

  return (
    <div className={`flex items-center gap-2.5 ${disabled ? "opacity-35" : ""}`} aria-disabled={disabled}>
      <div className="w-24 shrink-0 leading-tight">
        <h3 className="truncate font-display text-base font-semibold">{name}</h3>
        <span className="text-xs text-muted tabular-nums">{disabled ? "zählt nicht" : `${percent} %`}</span>
      </div>

      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        aria-label={`${name}: deine Note`}
        aria-valuetext={value ? `${value} von 10` : "keine Note"}
        className="rating-slider min-w-0 flex-1"
        style={{ "--fill": `${value * 10}%`, "--c": `var(--${person})` } as CSSProperties}
      />

      <span className={`w-6 shrink-0 text-right font-display text-xl leading-none font-semibold tabular-nums ${me.text}`}>
        {pending ? <LoaderCircle className="ml-auto size-3.5 animate-spin text-muted" /> : value || "–"}
      </span>

      {others.map((o) => (
        <span
          key={o.person}
          title={`${PEOPLE[o.person].name}: ${o.score ?? "keine Note"}`}
          className={`min-w-10 shrink-0 rounded-full px-2 py-1 text-center text-sm font-semibold tabular-nums ${PEOPLE[o.person].soft} ${PEOPLE[o.person].text}`}
        >
          <span className="opacity-60">{PEOPLE[o.person].initial}</span> {o.score ?? "–"}
        </span>
      ))}
    </div>
  );
}
