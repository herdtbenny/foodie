"use client";

import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RestaurantMap, type MapPoint } from "./restaurant-map";

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
          <div className="flex gap-1 rounded-full border border-line bg-surface/95 p-1 shadow-lg shadow-black/10">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === value ? "bg-accent text-accent-ink" : "text-muted"
                }`}
              >
                {label} <span className="opacity-60 tabular-nums">{count(value)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-accent" /> Besucht (mit Note)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-accent bg-surface" /> Wunschliste
        </span>
      </div>

      {missing.length > 0 && (
        <div className="rounded-3xl border border-line bg-surface p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <MapPinOff className="size-4 text-muted" />
            Ohne Position ({missing.length})
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/restaurants/${r.id}/bearbeiten`}
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
