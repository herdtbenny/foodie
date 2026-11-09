"use client";

import { Bike, Store } from "lucide-react";
import { useState, useTransition } from "react";
import { setOrdered } from "@/lib/actions";
import { SAVE_FAILED, toast } from "@/lib/toast";
import { Segmented } from "./segmented";

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
    <Segmented
      label="Vor Ort oder bestellt"
      value={value}
      onChange={choose}
      disabled={pending}
      options={[
        { value: false, label: "Vor Ort", icon: Store },
        { value: true, label: "Bestellt", icon: Bike },
      ]}
    />
  );
}
