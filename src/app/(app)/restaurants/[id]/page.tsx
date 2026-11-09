import { ArrowLeft, Calendar, MapPin, Navigation, Pencil, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { NotesForm } from "@/components/notes-form";
import { CategoryRating } from "@/components/category-rating";
import { RestaurantMap } from "@/components/restaurant-map";
import { formatScore } from "@/components/score";
import { StatusToggle } from "@/components/status-toggle";
import { requirePerson } from "@/lib/auth";
import { avatarUrls } from "@/lib/avatars";
import { formatDate } from "@/lib/format-date";
import { PEOPLE, PERSON_IDS } from "@/lib/people";
import { getRestaurant, weightPercent } from "@/lib/restaurants";

export async function generateMetadata({ params }: PageProps<"/restaurants/[id]">) {
  const { id } = await params;
  const restaurant = await getRestaurant(Number(id));
  return { title: restaurant ? `${restaurant.name} · Foodie` : "Foodie" };
}

export default async function RestaurantPage({ params }: PageProps<"/restaurants/[id]">) {
  const [{ id }, person] = await Promise.all([params, requirePerson()]);
  const restaurant = await getRestaurant(Number(id));
  if (!restaurant) notFound();

  const visited = restaurant.status === "besucht";
  const average = restaurant.overall;
  const avatars = avatarUrls();
  const hasCoords = restaurant.lat != null && restaurant.lng != null;

  return (
    <article className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href={visited ? "/" : "/wunschliste"} className="inline-flex items-center gap-1.5 text-sm text-muted">
          <ArrowLeft className="size-4" />
          {visited ? "Besucht" : "Wunschliste"}
        </Link>
        <Link
          href={`/restaurants/${restaurant.id}/bearbeiten`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm"
        >
          <Pencil className="size-3.5" />
          Bearbeiten
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {[restaurant.kind, restaurant.cuisine].filter(Boolean).length > 0 && (
            <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
              {[restaurant.kind, restaurant.cuisine].filter(Boolean).join(" · ")}
            </p>
          )}
          {visited && restaurant.visitedOn && (
            <p className="inline-flex items-center gap-1 text-muted">
              <Calendar className="size-3.5" />
              Besucht am {formatDate(restaurant.visitedOn)}
            </p>
          )}
          {!visited && <p className="text-muted">Auf der Wunschliste</p>}
        </div>
        <h1 className="font-display text-4xl leading-tight font-semibold text-balance">{restaurant.name}</h1>
        {restaurant.address && (
          <p className="flex items-start gap-1.5 text-muted">
            <MapPin className="mt-1 size-4 shrink-0" />
            {restaurant.address}
          </p>
        )}
      </header>

      {/* Karte + Google Maps */}
      {(hasCoords || restaurant.mapsUrl) && (
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          {hasCoords && (
            <RestaurantMap
              interactive={false}
              zoom={16}
              className="h-44"
              points={[
                {
                  id: restaurant.id,
                  name: restaurant.name,
                  lat: restaurant.lat!,
                  lng: restaurant.lng!,
                  status: restaurant.status,
                  score: average !== null ? formatScore(average) : null,
                  subtitle: null,
                },
              ]}
            />
          )}
          {restaurant.mapsUrl && (
            <a
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
            >
              <Navigation className="size-4" />
              In Google Maps öffnen
            </a>
          )}
        </div>
      )}

      {visited ? (
        <section className="space-y-4">
          {/* Gesamtnote */}
          <div className="flex items-center gap-4 rounded-3xl bg-ink p-4 text-paper">
            <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-full bg-pop text-white">
              <span className="font-display text-3xl leading-none font-semibold tabular-nums">
                {average !== null ? formatScore(average) : "–"}
              </span>
              <span className="text-[10px] opacity-80">gesamt</span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              {PERSON_IDS.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <Avatar person={p} url={avatars[p]} className="size-6 text-[10px]" />
                  <span className="flex-1 text-sm">{PEOPLE[p].name}</span>
                  <span className="font-semibold tabular-nums">
                    {restaurant.scores[p] != null ? formatScore(restaurant.scores[p]!) : "–"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kategorien */}
          <div className="space-y-6 rounded-3xl border border-line bg-surface p-4">
            {restaurant.categories.length === 0 && (
              <p className="text-sm text-muted">Noch keine Kategorien angelegt.</p>
            )}
            {restaurant.categories.map((cat) => (
              <CategoryRating
                key={`${cat.id}-${restaurant.ratings[cat.id]?.[person] ?? ""}`}
                restaurantId={restaurant.id}
                categoryId={cat.id}
                name={cat.name}
                percent={weightPercent(restaurant.categories, cat)}
                person={person}
                own={restaurant.ratings[cat.id]?.[person]}
                others={PERSON_IDS.filter((p) => p !== person).map((p) => ({
                  person: p,
                  score: restaurant.ratings[cat.id]?.[p],
                }))}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusToggle restaurantId={restaurant.id} status={restaurant.status} />
            <Link
              href="/kategorien"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted"
            >
              <SlidersHorizontal className="size-3.5" />
              Kategorien & Gewichtung
            </Link>
          </div>
        </section>
      ) : (
        <StatusToggle restaurantId={restaurant.id} status={restaurant.status} />
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Notizen</h2>
        <NotesForm restaurantId={restaurant.id} notes={restaurant.notes} />
      </section>
    </article>
  );
}
