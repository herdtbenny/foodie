import { ArrowLeft, MapPin, Navigation, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { NotesForm } from "@/components/notes-form";
import { PersonReview } from "@/components/person-review";
import { VisitedDate } from "@/components/visited-date";
import { CategoryRating } from "@/components/category-rating";
import { RestaurantMap } from "@/components/restaurant-map";
import { formatScore } from "@/components/score";
import { StatusToggle } from "@/components/status-toggle";
import { requirePerson } from "@/lib/auth";
import { avatarUrls } from "@/lib/avatars";
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
    <article className="space-y-5">
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

      <header className="-mt-1 space-y-1">
        {/* Kompakt: Titel, darunter Art · Küche und Adresse – keine leeren Zeilen */}
        <h1 className="font-display text-4xl leading-tight font-semibold text-balance">{restaurant.name}</h1>
        {(restaurant.kind || restaurant.cuisine || !visited) && (
          <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
            {[!visited && "Wunschliste", restaurant.kind, restaurant.cuisine].filter(Boolean).join(" · ")}
          </p>
        )}
        {restaurant.address && (
          <p className="flex items-start gap-1.5 text-sm text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
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
                  overall: average,
                  cuisine: restaurant.cuisine,
                  kind: restaurant.kind,
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
        <section className="space-y-3">
          <VisitedDate restaurantId={restaurant.id} date={restaurant.visitedOn}>
            <StatusToggle restaurantId={restaurant.id} status={restaurant.status} />
          </VisitedDate>

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
        </section>
      ) : (
        <StatusToggle restaurantId={restaurant.id} status={restaurant.status} />
      )}

      {visited && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Was wir gegessen haben</h2>
          {[person, ...PERSON_IDS.filter((p) => p !== person)].map((p) => (
            <PersonReview
              key={p}
              restaurantId={restaurant.id}
              person={p}
              review={restaurant.reviews[p]}
              editable={p === person}
              avatar={<Avatar person={p} url={avatars[p]} className="size-8 text-xs" />}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Notizen</h2>
        <NotesForm restaurantId={restaurant.id} notes={restaurant.notes} />
      </section>
    </article>
  );
}
