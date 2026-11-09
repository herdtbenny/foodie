import { ArrowLeft, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { DeleteButton } from "@/components/delete-button";
import { NotesForm } from "@/components/notes-form";
import { OrderedSwitch } from "@/components/ordered-switch";
import { EditableTitle, MetaChips, RestaurantInfo } from "@/components/restaurant-info";
import { PersonReview } from "@/components/person-review";
import { VisitedDate } from "@/components/visited-date";
import { CategoryRating } from "@/components/category-rating";
import { RestaurantMap } from "@/components/restaurant-map";
import { formatScore } from "@/components/score";
import { StatusToggle } from "@/components/status-toggle";
import { requirePerson } from "@/lib/auth";
import { avatarUrls } from "@/lib/avatars";
import { PEOPLE, PERSON_IDS } from "@/lib/people";
import { activeCategories, cuisinesOf, getRestaurant, listRestaurants, weightPercent } from "@/lib/restaurants";

export async function generateMetadata({ params }: PageProps<"/restaurants/[id]">) {
  const { id } = await params;
  const restaurant = await getRestaurant(Number(id));
  return { title: restaurant ? `${restaurant.name} · Foodie` : "Foodie" };
}

export default async function RestaurantPage({ params }: PageProps<"/restaurants/[id]">) {
  const [{ id }, person] = await Promise.all([params, requirePerson()]);
  const [restaurant, { restaurants: all }] = await Promise.all([getRestaurant(Number(id)), listRestaurants()]);
  if (!restaurant) notFound();

  const visited = restaurant.status === "besucht";
  const average = restaurant.overall;
  const avatars = avatarUrls();
  const hasCoords = restaurant.lat != null && restaurant.lng != null;

  return (
    <article className="space-y-5">
      <Link href={visited ? "/" : "/wunschliste"} className="inline-flex items-center gap-1.5 px-2 text-sm text-muted">
        <ArrowLeft className="size-4" />
        {visited ? "Bisherige" : "Wunschliste"}
      </Link>

      <header className="-mt-1 space-y-2 px-2">
        {/* Kompakt: Titel, darunter Art · Küche und Adresse – keine leeren Zeilen */}
        <h1 className="sr-only">{restaurant.name}</h1>
        <EditableTitle id={restaurant.id} name={restaurant.name} />
        <MetaChips id={restaurant.id} cuisine={restaurant.cuisine} cuisines={cuisinesOf(all)} />
        {restaurant.address && (
          <p className="flex items-start gap-1.5 text-sm text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            {restaurant.address}
          </p>
        )}
      </header>

      {/* Karte + Google Maps */}
      {(hasCoords || restaurant.mapsUrl) && (
        <div className="overflow-hidden card rounded-3xl">
          {hasCoords && (
            <RestaurantMap
              interactive={false}
              zoom={14}
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
          {/* Datum und Vor Ort/Bestellt als kleine Chips nebeneinander */}
          <div className="flex flex-wrap items-center gap-1.5">
            <VisitedDate restaurantId={restaurant.id} date={restaurant.visitedOn} />
            <OrderedSwitch restaurantId={restaurant.id} ordered={restaurant.ordered} />
          </div>

        </section>
      ) : (
        <StatusToggle restaurantId={restaurant.id} status={restaurant.status} />
      )}

      {visited && (
        <section className="space-y-3">
          <h2 className="px-2 font-display text-2xl font-semibold">Bewertung</h2>
          {/* Alles zur Bewertung in einer Karte: oben Gesamtnote, darunter die Kategorien */}
          <div className="card divide-y divide-line rounded-3xl">
            <div className="flex items-center gap-4 p-4">
              <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-full bg-pop text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]">
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
                    <span className={`font-display text-xl font-semibold tabular-nums ${PEOPLE[p].text}`}>
                      {restaurant.scores[p] != null ? formatScore(restaurant.scores[p]!) : "–"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 p-4">
              {restaurant.categories.length === 0 && (
                <p className="text-sm text-muted">Noch keine Kategorien angelegt.</p>
              )}
              {restaurant.categories.map((cat) => (
                <CategoryRating
                  key={`${cat.id}-${restaurant.ratings[cat.id]?.[person] ?? ""}`}
                  restaurantId={restaurant.id}
                  categoryId={cat.id}
                  name={cat.name}
                  percent={weightPercent(activeCategories(restaurant.categories, restaurant.ordered), cat)}
                  disabled={restaurant.ordered && cat.onSiteOnly}
                  person={person}
                  own={restaurant.ratings[cat.id]?.[person]}
                  others={PERSON_IDS.filter((p) => p !== person).map((p) => ({
                    person: p,
                    score: restaurant.ratings[cat.id]?.[p],
                  }))}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {visited && (
        <section className="space-y-3">
          <h2 className="px-2 font-display text-2xl font-semibold">Was wir gegessen haben</h2>
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

      <RestaurantInfo id={restaurant.id} address={restaurant.address} mapsUrl={restaurant.mapsUrl} />

      <section className="space-y-3">
        <h2 className="px-2 font-display text-2xl font-semibold">Notizen</h2>
        <NotesForm restaurantId={restaurant.id} notes={restaurant.notes} />
      </section>

      <DeleteButton id={restaurant.id} title={restaurant.name} />
    </article>
  );
}
