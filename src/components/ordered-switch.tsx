"use client";

import { Bike, Store } from "lucide-react";
import { useState, useTransition } from "react";
import { setOrdered } from "@/lib/actions";
import { SAVE_FAILED, toast } from "@/lib/toast";

/** Flag-Chip neben dem Datum: Vor Ort ↔ Bestellt. Bei "Bestellt" zählen Kategorien wie Ambiente nicht. */
export function OrderedSwitch({ restaurantId, ordered }: { restaurantId: number; ordered: boolean }) {
  const [value, setValue] = useState(ordered);
  const [pending, startTransition] = useTransition();
  const Icon = value ? Bike : Store;

  function toggle() {
    const next = !value;
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
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={value}
      title="Antippen zum Umschalten: Vor Ort / Bestellt"
      className={`press flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-3.5 text-sm font-medium disabled:opacity-70 ${
        value ? "glass-ink" : "glass text-ink"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{value ? "Bestellt" : "Vor Ort"}</span>
    </button>
  );
}
