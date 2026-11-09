"use client";

import { Bike, Store } from "lucide-react";
import { useState, useTransition } from "react";
import { setOrdered } from "@/lib/actions";
import { SAVE_FAILED, toast } from "@/lib/toast";

/** Vor Ort gegessen oder bestellt – bei "Bestellt" zählen Kategorien wie Ambiente nicht */
export function OrderedSwitch({ restaurantId, ordered }: { restaurantId: number; ordered: boolean }) {
  const [value, setValue] = useState(ordered);
  const [pending, startTransition] = useTransition();

  function choose(next: boolean) {
    if (next === value) return;
    setValue(next);
    startTransition(async () => {
      try {
        await setOrdered(restaurantId, next);
        toast(next ? "Bestellt – Ambiente zählt nicht" : "Vor Ort gegessen");
      } catch {
        setValue(!next);
        toast(SAVE_FAILED, "error");
      }
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Vor Ort oder bestellt"
      className={`grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1 ${pending ? "opacity-70" : ""}`}
    >
      {(
        [
          [false, "Vor Ort", Store],
          [true, "Bestellt", Bike],
        ] as const
      ).map(([option, label, Icon]) => (
        <button
          key={label}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => choose(option)}
          className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
            value === option ? "bg-ink text-paper" : "text-muted"
          }`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
