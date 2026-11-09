"use client";

import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RestaurantMap, scoreColor, type MapPoint } from "./restaurant-map";
import { Segmented } from "./segmented";

type Filter = "alle" | "besucht" | "wunsch";

const FILTERS: [Filter, string][] = [
  ["alle", "Alle"],
  ["besucht", "Besucht"],
  ["wunsch", "Wunschliste"],
];

/** Vollbild-Karte mit Filter; Einträge ohne Position stehen darunter. */
export function MapExplorer({
  points,
  missing,
}: {
  points: MapPoint[];
  missing: { id: number; name: string }[];
}) {
  const [filter, setFilter] = useState<Filter>("alle");
  const shown = filter === "alle" ? points : points.filter((p) => p.status === filter);
  const count = (f: Filter) => (f === "alle" ? points.length : points.filter((p) => p.status === f).length);

  return (
    <div className="space-y-4">
      <div className="relative">
        <RestaurantMap
          points={shown}
          className="h-[calc(100dvh-14rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] min-h-80 rounded-3xl border border-line"
        />
        <div className="absolute inset-x-0 top-3 z-[500] flex justify-center px-3">
          <Segmented
            size="sm"
            label="Filter"
            value={filter}
            onChange={setFilter}
            options={FILTERS.map(([value, label]) => ({ value, label, count: count(value) }))}
          />
        </div>
      </div>

      {/* Legende: Notenstrahl 1–10 in den Pinfarben (einzelne Felder, kein Verlauf) */}
      <div className="flex items-end gap-3 px-2 text-xs text-muted">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex justify-between">
            <span>Gesamtnote</span>
            <span>schlecht → top</span>
          </div>
          <div className="flex overflow-hidden rounded-full">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <span
                key={n}
                className="flex h-6 flex-1 items-center justify-center text-[10px] font-semibold text-white tabular-nums"
                style={{ background: scoreColor(n) }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 pb-1">
          <span className="size-4 rounded-full border-2 border-ink bg-surface" /> Wunschliste
        </span>
      </div>

      {missing.length > 0 && (
        <div className="card rounded-3xl p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <MapPinOff className="size-4 text-muted" />
            Ohne Position ({missing.length})
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/restaurants/${r.id}`}
                  className="inline-block rounded-full border border-line px-3 py-1 text-sm"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
