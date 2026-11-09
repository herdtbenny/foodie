"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { categoryAverage, kindOrder, type Category, type RestaurantSummary, type Status } from "@/lib/restaurants";
import { RestaurantCard } from "./restaurant-card";

const BASE_SORTS = {
  beste: "Beste zuerst",
  german: "Germans Favoriten",
  evelyne: "Evelynes Favoriten",
  datum: "Zuletzt besucht",
  neu: "Neu eingetragen",
  az: "A–Z",
} as const;

const byDesc = (a: number | null | undefined, b: number | null | undefined) => (b ?? -1) - (a ?? -1);

const baseSorters: Record<keyof typeof BASE_SORTS, (a: RestaurantSummary, b: RestaurantSummary) => number> = {
  beste: (a, b) => byDesc(a.overall, b.overall),
  german: (a, b) => byDesc(a.scores.german, b.scores.german),
  evelyne: (a, b) => byDesc(a.scores.evelyne, b.scores.evelyne),
  datum: (a, b) => (b.visitedOn ?? "").localeCompare(a.visitedOn ?? ""),
  neu: (a, b) => b.createdAt.localeCompare(a.createdAt),
  az: (a, b) => a.name.localeCompare(b.name, "de"),
};

/** Sortierungen: feste plus eine pro Kategorie ("Bester Geschmack") */
function sortOptions(status: Status, categories: Category[]) {
  if (status === "wunsch") {
    return [
      { key: "neu", label: BASE_SORTS.neu, compare: baseSorters.neu },
      { key: "az", label: BASE_SORTS.az, compare: baseSorters.az },
    ];
  }
  return [
    ...(["beste", "german", "evelyne"] as const).map((key) => ({ key, label: BASE_SORTS[key], compare: baseSorters[key] })),
    ...categories.map((cat) => ({
      key: `kat-${cat.id}`,
      label: `Beste: ${cat.name}`,
      compare: (a: RestaurantSummary, b: RestaurantSummary) =>
        byDesc(categoryAverage(a.ratings, cat.id), categoryAverage(b.ratings, cat.id)),
    })),
    ...(["datum", "az"] as const).map((key) => ({ key, label: BASE_SORTS[key], compare: baseSorters[key] })),
  ];
}

function counts(values: (string | null)[]) {
  const map = new Map<string, number>();
  for (const v of values) if (v) map.set(v, (map.get(v) ?? 0) + 1);
  return map;
}

const chip = "shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors";

/** Suche, Küche und Sortierung – alles im Browser, die Liste ist klein. */
export function RestaurantList({
  restaurants,
  status,
  categories,
}: {
  restaurants: RestaurantSummary[];
  status: Status;
  categories: Category[];
}) {
  const sorts = sortOptions(status, categories);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [sort, setSort] = useState(sorts[0].key);
  const compare = (sorts.find((s) => s.key === sort) ?? sorts[0]).compare;

  const kinds = useMemo(
    () => [...counts(restaurants.map((r) => r.kind))].sort((a, b) => kindOrder(a[0]) - kindOrder(b[0]) || a[0].localeCompare(b[0], "de")),
    [restaurants],
  );
  const cuisines = useMemo(
    () =>
      [...counts(restaurants.filter((r) => !kind || r.kind === kind).map((r) => r.cuisine))].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de"),
      ),
    [restaurants, kind],
  );

  const needle = q.trim().toLowerCase();
  const shown = restaurants
    .filter((r) => !needle || `${r.name}\n${r.cuisine ?? ""}\n${r.kind ?? ""}\n${r.address ?? ""}`.toLowerCase().includes(needle))
    .filter((r) => !kind || r.kind === kind)
    .filter((r) => !cuisine || r.cuisine === cuisine)
    .sort(compare);

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
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sortierung"
          className="w-36 shrink-0 appearance-none rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-ink"
        >
          {sorts.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {kinds.length > 1 && (
        <ChipRow
          all={restaurants.length}
          items={kinds}
          value={kind}
          onChange={(v) => {
            setKind(v);
            setCuisine("");
          }}
        />
      )}
      {cuisines.length > 1 && <ChipRow small items={cuisines} value={cuisine} onChange={setCuisine} />}

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

function ChipRow({
  items,
  value,
  onChange,
  all,
  small,
}: {
  items: [string, number][];
  value: string;
  onChange: (value: string) => void;
  all?: number;
  small?: boolean;
}) {
  const tone = (active: boolean) =>
    active ? "border-ink bg-ink text-paper" : "border-line bg-surface text-muted";
  const size = small ? "px-2.5 py-1 text-xs" : "";
  return (
    <div className="no-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 sm:-mx-4 sm:px-4">
      {all !== undefined && (
        <button type="button" onClick={() => onChange("")} className={`${chip} ${size} ${tone(!value)}`}>
          Alle <span className="opacity-60">{all}</span>
        </button>
      )}
      {items.map(([name, count]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(value === name ? "" : name)}
          className={`${chip} ${size} ${tone(value === name)}`}
        >
          {name} <span className="opacity-60">{count}</span>
        </button>
      ))}
    </div>
  );
}
