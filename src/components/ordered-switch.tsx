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
      className={`press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium disabled:opacity-70 ${
        value ? "glass-ink" : "glass text-ink"
      }`}
    >
      <Icon className="size-4" />
      {value ? "Bestellt" : "Vor Ort"}
    </button>
  );
}
