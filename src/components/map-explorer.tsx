"use client";

import { ChevronDown, MapPinOff } from "lucide-react";
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

/** Abstand für Pins: oben Kopfzeile + Filter, unten Legende + Navigation */
const FIT_PADDING = { top: 150, bottom: 190 };

/**
 * Karte über den ganzen Bildschirm. Kopfzeile, Filter, Legende und Navigation liegen darüber.
 * Einträge ohne Position klappen aus der Legende auf.
 */
export function MapExplorer({
  points,
  missing,
}: {
  points: MapPoint[];
  missing: { id: number; name: string }[];
}) {
  const [filter, setFilter] = useState<Filter>("alle");
  const [showMissing, setShowMissing] = useState(false);
  const shown = filter === "alle" ? points : points.filter((p) => p.status === filter);
  const count = (f: Filter) => (f === "alle" ? points.length : points.filter((p) => p.status === f).length);

  return (
    <>
      <RestaurantMap points={shown} fitPadding={FIT_PADDING} className="map-fullscreen fixed inset-0" />

      {/* Leichter Verlauf oben, damit Logo und Buttons auf der Karte lesbar bleiben */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[1] h-[calc(max(env(safe-area-inset-top),1rem)+6rem)] bg-gradient-to-b from-paper/90 via-paper/50 to-transparent"
      />

      {/* Filter unter der Kopfzeile */}
      <div className="fixed inset-x-0 top-[calc(max(env(safe-area-inset-top),1rem)+4.25rem)] z-10 flex justify-center px-3">
        <Segmented
          size="sm"
          label="Filter"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map(([value, label]) => ({ value, label, count: count(value) }))}
        />
      </div>

      {/* Legende über der Navigation: Notenstrahl 1–10 in den Pinfarben */}
      <div className="fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+4.75rem)] z-10 px-3 sm:px-4">
        <div className="glass mx-auto max-w-[calc(48rem-2rem)] rounded-3xl px-3 py-2.5 text-xs text-muted">
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between">
                <span>Gesamtnote</span>
                <span>schlecht → top</span>
              </div>
              <div className="flex overflow-hidden rounded-full">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <span
                    key={n}
                    className="flex h-5 flex-1 items-center justify-center text-[10px] font-semibold text-white tabular-nums"
                    style={{ background: scoreColor(n) }}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 pb-0.5">
              <span className="size-4 rounded-full border-2 border-ink bg-surface" /> Wunsch
            </span>
          </div>

          {missing.length > 0 && (
            <div className="mt-2 border-t border-line pt-2">
              <button
                type="button"
                onClick={() => setShowMissing((v) => !v)}
                aria-expanded={showMissing}
                className="press flex w-full items-center gap-1.5 font-medium text-ink"
              >
                <MapPinOff className="size-3.5 text-muted" />
                Ohne Position ({missing.length})
                <ChevronDown className={`ml-auto size-3.5 transition-transform ${showMissing ? "rotate-180" : ""}`} />
              </button>
              {showMissing && (
                <ul className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                  {missing.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/restaurants/${r.id}`}
                        className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink"
                      >
                        {r.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
