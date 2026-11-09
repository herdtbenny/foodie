"use client";

import { Dices, Navigation, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { RestaurantSummary } from "@/lib/restaurants";
import { formatScore, ScorePills } from "./score";
import { Segmented } from "./segmented";

type Source = "egal" | "neu" | "bewaehrt";

const SOURCES: [Source, string][] = [
  ["egal", "Beides"],
  ["bewaehrt", "Bisherige"],
  ["neu", "Wunschliste"],
];

/** Bisherige, die sich lohnen: Gesamtnote ab 7 */
const isProven = (r: RestaurantSummary) => r.status === "besucht" && (r.overall ?? 0) >= 7;

/** "Wohin heute?": Art und Lust wählen, die App würfelt ein Restaurant. Darunter die Top 5. */
export function TodayPicker({ restaurants }: { restaurants: RestaurantSummary[] }) {
  const [cuisine, setCuisine] = useState("");
  const [source, setSource] = useState<Source>("egal");
  const [pick, setPick] = useState<RestaurantSummary | null>(null);
  const [rolled, setRolled] = useState(false);

  // Küchen nach Häufigkeit
  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of restaurants) if (r.cuisine) counts.set(r.cuisine, (counts.get(r.cuisine) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "de")).map(([c]) => c);
  }, [restaurants]);

  const pool = restaurants
    .filter((r) => !cuisine || r.cuisine === cuisine)
    .filter((r) => (source === "neu" ? r.status === "wunsch" : source === "bewaehrt" ? isProven(r) : r.status === "wunsch" || isProven(r)));

  const top = restaurants
    .filter((r) => r.status === "besucht" && r.overall !== null && (!cuisine || r.cuisine === cuisine))
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
    .slice(0, 5);

  function roll() {
    const options = pool.length > 1 && pick ? pool.filter((r) => r.id !== pick.id) : pool;
    setPick(options.length ? options[Math.floor(Math.random() * options.length)] : null);
    setRolled(true);
  }

  const chip = (selected: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors ${
      selected ? "border-ink bg-ink text-paper" : "border-line bg-surface text-muted"
    }`;

  return (
    <div className="space-y-6">
      <h1 className="px-2 font-display text-4xl font-semibold">Wohin heute?</h1>

      <div className="space-y-3">
        <div className="no-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 sm:-mx-4 sm:px-4">
          <button type="button" onClick={() => setCuisine("")} className={chip(!cuisine)}>
            Alles
          </button>
          {cuisines.map((k) => (
            <button key={k} type="button" onClick={() => setCuisine(cuisine === k ? "" : k)} className={chip(cuisine === k)}>
              {k}
            </button>
          ))}
        </div>
        <Segmented
          label="Woraus würfeln"
          value={source}
          onChange={setSource}
          options={SOURCES.map(([value, label]) => ({ value, label }))}
        />
      </div>

      <button
        type="button"
        onClick={roll}
        disabled={pool.length === 0}
        className="press flex w-full items-center justify-center gap-2 rounded-full bg-pop px-5 py-4 text-lg font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-10px_rgb(215_57_43/0.7)] disabled:opacity-40"
      >
        {rolled ? <RotateCcw className="size-5" /> : <Dices className="size-5" />}
        {rolled ? "Nochmal würfeln" : "Würfeln"}
        <span className="text-sm font-normal opacity-80">({pool.length})</span>
      </button>

      {rolled &&
        (pick ? (
          <div className="glass-ink space-y-3 rounded-3xl p-5">
            <p className="text-[11px] font-semibold tracking-wider uppercase opacity-70">
              {[pick.status === "wunsch" ? "Wunschliste" : "Bisherige", pick.cuisine]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="flex items-start gap-3">
              <h2 className="min-w-0 flex-1 font-display text-4xl leading-tight font-semibold text-balance">
                {pick.name}
              </h2>
              {pick.overall !== null && (
                <span className="press flex size-14 shrink-0 items-center justify-center rounded-full bg-pop font-display text-2xl font-semibold text-white">
                  {formatScore(pick.overall)}
                </span>
              )}
            </div>
            {pick.address && <p className="text-sm opacity-70">{pick.address}</p>}
            <div className="flex gap-2 pt-1">
              <Link
                href={`/restaurants/${pick.id}`}
                className="flex-1 rounded-full bg-paper px-4 py-3 text-center font-semibold text-ink"
              >
                Ansehen
              </Link>
              {pick.mapsUrl && (
                <a
                  href={pick.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-paper/30 px-4 py-3 font-semibold"
                >
                  <Navigation className="size-4" />
                  Route
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-muted">Nichts Passendes gefunden.</p>
        ))}

      {top.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-2 font-display text-2xl font-semibold">Eure Top {top.length}</h2>
          <ol className="divide-y divide-line overflow-hidden card rounded-3xl">
            {top.map((r, i) => (
              <li key={r.id}>
                <Link href={`/restaurants/${r.id}`} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-5 font-display text-2xl font-semibold text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.name}</span>
                    <ScorePills scores={r.scores} />
                  </span>
                  <span className="font-display text-2xl font-semibold text-pop tabular-nums">
                    {formatScore(r.overall!)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
