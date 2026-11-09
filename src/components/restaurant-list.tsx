"use client";

import { ArrowUpDown, ListFilter, Search, X } from "lucide-react";
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
  /** "" = alle, sonst "art:Café" oder "kueche:Sushi" */
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState(sorts[0].key);
  const compare = (sorts.find((s) => s.key === sort) ?? sorts[0]).compare;

  const kinds = useMemo(
    () =>
      [...counts(restaurants.map((r) => r.kind))].sort(
        (a, b) => kindOrder(a[0]) - kindOrder(b[0]) || a[0].localeCompare(b[0], "de"),
      ),
    [restaurants],
  );
  const cuisines = useMemo(
    () => [...counts(restaurants.map((r) => r.cuisine))].sort((a, b) => a[0].localeCompare(b[0], "de")),
    [restaurants],
  );

  const [filterType, filterValue] = filter ? [filter.slice(0, filter.indexOf(":")), filter.slice(filter.indexOf(":") + 1)] : ["", ""];
  const orderedCount = restaurants.filter((r) => r.ordered).length;
  const needle = q.trim().toLowerCase();
  const shown = restaurants
    .filter((r) => !needle || `${r.name}\n${r.cuisine ?? ""}\n${r.kind ?? ""}\n${r.address ?? ""}`.toLowerCase().includes(needle))
    .filter((r) =>
      filterType === "art"
        ? r.kind === filterValue
        : filterType === "kueche"
          ? r.cuisine === filterValue
          : filterType === "ort"
            ? r.ordered === (filterValue === "Bestellt")
            : true,
    )
    .sort(compare);

  return (
    <div className="space-y-4">
      <div className="glass sticky top-2 z-10 flex items-center gap-1 rounded-full p-1 pl-4 focus-within:ring-2 focus-within:ring-ink/20">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suchen: Name, Küche, Ort …"
          aria-label="Suchen"
          className="min-w-0 flex-1 bg-transparent py-1.5 pl-1.5 outline-none placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Suche leeren"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Natives <select> liegt unsichtbar über dem Button: öffnet auf dem iPhone das System-Menü */}
        {(kinds.length > 0 || cuisines.length > 0 || orderedCount > 0) && (
          <MenuButton label="Filtern" icon={ListFilter} active={!!filter}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtern" className={nativeSelect}>
              <option value="">Alle anzeigen ({restaurants.length})</option>
              {orderedCount > 0 && (
                <optgroup label="Wie">
                  <option value="ort:Vor Ort">Vor Ort ({restaurants.length - orderedCount})</option>
                  <option value="ort:Bestellt">Bestellt ({orderedCount})</option>
                </optgroup>
              )}
              {kinds.length > 0 && (
                <optgroup label="Art">
                  {kinds.map(([name, count]) => (
                    <option key={name} value={`art:${name}`}>
                      {name} ({count})
                    </option>
                  ))}
                </optgroup>
              )}
              {cuisines.length > 0 && (
                <optgroup label="Küche">
                  {cuisines.map(([name, count]) => (
                    <option key={name} value={`kueche:${name}`}>
                      {name} ({count})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </MenuButton>
        )}

        <MenuButton label="Sortieren" icon={ArrowUpDown} active={sort !== sorts[0].key}>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sortieren" className={nativeSelect}>
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </MenuButton>
      </div>

      {(filter || sort !== sorts[0].key) && (
        <div className="flex flex-wrap gap-1.5">
          {filter && (
            <button
              type="button"
              onClick={() => setFilter("")}
              className="press inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-sm text-paper"
            >
              {filterValue}
              <X className="size-3.5" />
            </button>
          )}
          {sort !== sorts[0].key && (
            <button
              type="button"
              onClick={() => setSort(sorts[0].key)}
              className="press inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted"
            >
              {sorts.find((s) => s.key === sort)?.label}
              <X className="size-3.5" />
            </button>
          )}
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

const nativeSelect = "absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0";

function MenuButton({
  label,
  icon: Icon,
  active,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      title={label}
      className={`relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
        active ? "bg-ink text-paper" : "text-muted hover:text-ink"
      }`}
    >
      <Icon className="size-[18px]" />
      {children}
    </span>
  );
}
