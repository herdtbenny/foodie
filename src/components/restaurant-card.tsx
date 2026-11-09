import { MapPin, Navigation, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import type { RestaurantSummary } from "@/lib/restaurants";
import { CuisineIcon } from "./cuisine-icon";
import { formatScore, ScorePills } from "./score";

/** Ein Restaurant in der Liste. Ganze Karte führt zur Detailseite, rechts geht's direkt zu Google Maps. */
export function RestaurantCard({ restaurant }: { restaurant: RestaurantSummary }) {
  const visited = restaurant.status === "besucht";
  const average = restaurant.overall;
  const tags = [restaurant.kind, restaurant.cuisine].filter(Boolean).join(" · ");

  return (
    <div className="relative flex min-w-0 items-center gap-3 card rounded-3xl p-2 pr-3">
      {/* Icon zur Küche statt Foto */}
      <div
        className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-line text-muted"
      >
        <CuisineIcon cuisine={restaurant.cuisine} kind={restaurant.kind} name={restaurant.name} className="size-7" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/restaurants/${restaurant.id}`}
            className="min-w-0 truncate font-display text-lg leading-snug font-semibold after:absolute after:inset-0 after:rounded-3xl"
          >
            {restaurant.name}
          </Link>
          {visited && average !== null && (
            <span
              title="Gesamtnote"
              className="shrink-0 rounded-full bg-pop px-2 py-0.5 text-sm font-semibold text-white tabular-nums"
            >
              {formatScore(average)}
            </span>
          )}
        </div>
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
            {restaurant.recommendedBy.length > 0 && (
              <span
                title="Weiterempfohlen"
                className="press inline-flex items-center gap-1 rounded-full bg-pop px-2 py-0.5 text-xs font-semibold text-white"
              >
                <ThumbsUp className="size-3" />
                {restaurant.recommendedBy.length === 2 ? "beide" : ""}
              </span>
            )}
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
