import { Heart, Plus, History } from "lucide-react";
import Link from "next/link";
import { listRestaurants, type Status } from "@/lib/restaurants";
import { RestaurantList } from "./restaurant-list";

const COPY = {
  besucht: {
    title: "Waren wir schon",
    empty: "Noch kein Restaurant bewertet",
    hint: "Tragt ein, wo ihr wart, und gebt beide eure Note von 1 bis 10.",
    cta: "Restaurant eintragen",
    icon: History,
  },
  wunsch: {
    title: "Wollen wir hin",
    empty: "Die Wunschliste ist leer",
    hint: "Google-Maps-Link einfügen, fertig – so geht kein Tipp mehr verloren.",
    cta: "Auf die Wunschliste",
    icon: Heart,
  },
} as const;

/** Gemeinsame Seite für "Besucht" und "Wunschliste" */
export async function ListPage({ status }: { status: Status }) {
  const { restaurants: all, categories } = await listRestaurants();
  const restaurants = all.filter((r) => r.status === status);
  const copy = COPY[status];
  const Icon = copy.icon;

  return (
    <div className="space-y-5">
      <h1 className="sr-only">{copy.title}</h1>
      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-3xl border border-line text-muted">
            <Icon className="size-8" strokeWidth={1.6} />
          </div>
          <h2 className="font-display text-2xl font-semibold">{copy.empty}</h2>
          <p className="mt-2 max-w-xs text-muted">{copy.hint}</p>
          <Link
            href={`/neu?status=${status}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink"
          >
            <Plus className="size-5" />
            {copy.cta}
          </Link>
        </div>
      ) : (
        <RestaurantList restaurants={restaurants} status={status} categories={categories} />
      )}
    </div>
  );
}
