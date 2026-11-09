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

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          Note
          {[1, 4, 7, 10].map((n) => (
            <span
              key={n}
              className="flex size-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: scoreColor(n) }}
            >
              {n}
            </span>
          ))}
        </span>
        <span className="inline-flex items-center gap-1.5">
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
