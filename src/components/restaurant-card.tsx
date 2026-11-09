import { Bookmark, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import type { RestaurantSummary } from "@/lib/restaurants";
import { formatScore, ScorePills } from "./score";

/** Ein Restaurant in der Liste. Ganze Karte führt zur Detailseite, rechts geht's direkt zu Google Maps. */
export function RestaurantCard({ restaurant }: { restaurant: RestaurantSummary }) {
  const visited = restaurant.status === "besucht";
  const average = restaurant.overall;
  const tags = [restaurant.kind, restaurant.cuisine].filter(Boolean).join(" · ");

  return (
    <div className="relative flex min-w-0 items-center gap-3 rounded-3xl border border-line bg-surface p-2 pr-3">
      <div
        className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl ${
          visited ? (average !== null ? "bg-pop text-white" : "bg-ink text-paper") : "border border-line text-muted"
        }`}
      >
        {visited ? (
          average !== null ? (
            <>
              <span className="font-display text-2xl leading-none font-semibold tabular-nums">{formatScore(average)}</span>
              <span className="mt-0.5 text-[10px] opacity-80">von 10</span>
            </>
          ) : (
            <span className="text-xs font-medium">offen</span>
          )
        ) : (
          <Bookmark className="size-6" strokeWidth={1.8} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/restaurants/${restaurant.id}`}
          className="truncate font-display text-lg leading-snug font-semibold after:absolute after:inset-0 after:rounded-3xl"
        >
          {restaurant.name}
        </Link>
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted">
          {tags && <span className="truncate text-[11px] font-semibold tracking-wider uppercase">{tags}</span>}
          {!tags && restaurant.address && <span className="truncate">{restaurant.address}</span>}
          {!tags && !restaurant.address && restaurant.lat === null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              ohne Position
            </span>
          )}
        </p>
        {visited ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <ScorePills scores={restaurant.scores} />
            {restaurant.visitedOn && <span className="text-xs text-muted">{formatDate(restaurant.visitedOn)}</span>}
          </div>
        ) : null}
      </div>

      {restaurant.mapsUrl && (
        <a
          href={restaurant.mapsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${restaurant.name} in Google Maps öffnen`}
          className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink"
        >
          <Navigation className="size-4" />
        </a>
      )}
    </div>
  );
}
