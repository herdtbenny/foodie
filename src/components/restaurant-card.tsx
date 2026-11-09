import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/price";
import { scoreColor } from "@/lib/score-color";
import type { RestaurantSummary } from "@/lib/restaurants";
import { CuisineIcon } from "./cuisine-icon";
import { formatScore, ScorePills } from "./score";

/** Ein Restaurant in der Liste. Ganze Karte führt zur Detailseite; rechts die Bewertung (Bisherige) bzw. Route (Wunschliste). */
export function RestaurantCard({ restaurant }: { restaurant: RestaurantSummary }) {
  const visited = restaurant.status === "besucht";
  const average = restaurant.overall;
  const tags = restaurant.cuisine ?? "";
  const price = formatPrice(restaurant.priceLevel);

  return (
    <div className="relative flex min-w-0 items-center gap-3 card rounded-3xl p-2 pr-3">
      {/* Icon zur Küche statt Foto */}
      <div
        className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-line text-muted"
      >
        <CuisineIcon cuisine={restaurant.cuisine} name={restaurant.name} className="size-7" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/restaurants/${restaurant.id}`}
          className="min-w-0 truncate font-display text-lg leading-snug font-semibold after:absolute after:inset-0 after:rounded-3xl"
        >
          {restaurant.name}
        </Link>
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted">
          {tags && <span className="truncate text-[11px] font-semibold tracking-wider uppercase">{tags}</span>}
          {tags && price && <span aria-hidden>·</span>}
          {price && (
            <span className="shrink-0 text-[11px] font-semibold text-ink/70" aria-label={`Preis ${price}`}>
              {price}
            </span>
          )}
          {!tags && restaurant.lat === null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              ohne Position
            </span>
          )}
        </p>
        {visited && restaurant.visitedOn && (
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <CalendarDays className="size-3 shrink-0" aria-label="Zuletzt besucht" />
            {formatDate(restaurant.visitedOn)}
          </p>
        )}
      </div>

      {/* Alles zur Bewertung gebündelt rechts: Gesamtnote, darunter die Noten von euch beiden */}
      {visited ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
              title="Gesamtnote"
              className={`min-w-11 rounded-full px-2.5 py-1 text-center font-display text-lg leading-none font-semibold tabular-nums ${
                average !== null ? "text-white" : "border border-line text-muted"
              }`}
              style={average !== null ? { background: scoreColor(average) } : undefined}
            >
              {average !== null ? formatScore(average) : "–"}
            </span>
          <ScorePills scores={restaurant.scores} />
        </div>
      ) : (
        restaurant.mapsUrl && (
          <a
            href={restaurant.mapsUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${restaurant.name} in Google Maps öffnen`}
            className="press relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
          >
            {/* Roter Pin wie in Google Maps (kein Logo) */}
            <MapPin className="size-5 fill-pop text-surface" strokeWidth={1.75} />
          </a>
        )
      )}
    </div>
  );
}
