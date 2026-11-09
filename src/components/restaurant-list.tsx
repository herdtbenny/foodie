"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { averageScore, type RestaurantSummary, type Status } from "@/lib/restaurants";
import { RestaurantCard } from "./restaurant-card";

const SORTS = {
  beste: "Beste zuerst",
  german: "Germans Favoriten",
  evelyne: "Evelynes Favoriten",
  datum: "Zuletzt besucht",
  neu: "Neu eingetragen",
  az: "A–Z",
} as const;
type Sort = keyof typeof SORTS;

const VISITED_SORTS: Sort[] = ["beste", "german", "evelyne", "datum", "az"];
const WISH_SORTS: Sort[] = ["neu", "az"];

const byDesc = (a: number | null | undefined, b: number | null | undefined) => (b ?? -1) - (a ?? -1);

const sorters: Record<Sort, (a: RestaurantSummary, b: RestaurantSummary) => number> = {
  beste: (a, b) => byDesc(averageScore(a.scores), averageScore(b.scores)),
  german: (a, b) => byDesc(a.scores.german, b.scores.german),
  evelyne: (a, b) => byDesc(a.scores.evelyne, b.scores.evelyne),
  datum: (a, b) => (b.visitedOn ?? "").localeCompare(a.visitedOn ?? ""),
  neu: (a, b) => b.createdAt.localeCompare(a.createdAt),
  az: (a, b) => a.name.localeCompare(b.name, "de"),
};

const chip = "shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors";

/** Suche, Küche und Sortierung – alles im Browser, die Liste ist klein. */
export function RestaurantList({ restaurants, status }: { restaurants: RestaurantSummary[]; status: Status }) {
  const sorts = status === "besucht" ? VISITED_SORTS : WISH_SORTS;
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [sort, setSort] = useState<Sort>(sorts[0]);

  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of restaurants) if (r.cuisine) counts.set(r.cuisine, (counts.get(r.cuisine) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de"));
  }, [restaurants]);

  const needle = q.trim().toLowerCase();
  const shown = restaurants
    .filter((r) => !needle || `${r.name}\n${r.cuisine ?? ""}\n${r.address ?? ""}`.toLowerCase().includes(needle))
    .filter((r) => !cuisine || r.cuisine === cuisine)
    .sort(sorters[sort]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suchen: Name, Küche, Ort …"
            aria-label="Suchen"
            className="w-full rounded-full border border-line bg-surface py-2.5 pr-10 pl-10 outline-none placeholder:text-muted/70 focus:border-ink [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Suche leeren"
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sortierung"
          className="w-36 shrink-0 appearance-none rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-ink"
        >
          {sorts.map((s) => (
            <option key={s} value={s}>
              {SORTS[s]}
            </option>
          ))}
        </select>
      </div>

      {cuisines.length > 1 && (
        <div className="no-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 sm:-mx-4 sm:px-4">
          <button
            type="button"
            onClick={() => setCuisine("")}
            className={`${chip} ${!cuisine ? "border-ink bg-ink text-paper" : "border-line bg-surface text-muted"}`}
          >
            Alle <span className="opacity-60">{restaurants.length}</span>
          </button>
          {cuisines.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setCuisine(cuisine === name ? "" : name)}
              className={`${chip} ${cuisine === name ? "border-ink bg-ink text-paper" : "border-line bg-surface text-muted"}`}
            >
              {name} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {shown.length ? (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li key={r.id}>
              <RestaurantCard restaurant={r} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center text-muted">Nichts gefunden.</p>
      )}
    </div>
  );
}
