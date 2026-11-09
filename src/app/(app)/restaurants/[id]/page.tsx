import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { DeleteButton } from "@/components/delete-button";
import { NotesForm } from "@/components/notes-form";
import { OrderedSwitch } from "@/components/ordered-switch";
import { EditableTitle, MapsLinkRow, MetaChips, PriceChip } from "@/components/restaurant-info";
import { PersonReview } from "@/components/person-review";
import { VisitedDate } from "@/components/visited-date";
import { CategoryRating } from "@/components/category-rating";
import { RestaurantMap } from "@/components/restaurant-map";
import { formatScore } from "@/components/score";
import { StatusToggle } from "@/components/status-toggle";
import { requirePerson } from "@/lib/auth";
import { scoreColor } from "@/lib/score-color";
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
    <article className="space-y-4">
      {/* Zurück als Icon links neben dem Namen */}
      <header className="flex items-start gap-1.5 pr-2">
        <Link
          href={visited ? "/" : "/wunschliste"}
          aria-label={visited ? "Zurück zu Bisherige" : "Zurück zur Wunschliste"}
          className="press glass mt-1 flex size-10 shrink-0 items-center justify-center rounded-full text-ink"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="sr-only">{restaurant.name}</h1>
        <div className="min-w-0 flex-1">
          <EditableTitle id={restaurant.id} name={restaurant.name} />
        </div>
      </header>

      {/* Karte, darunter schmale Zeile mit dem Google-Maps-Link */}
      <div className="card divide-y divide-line overflow-hidden rounded-3xl">
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
        <MapsLinkRow id={restaurant.id} mapsUrl={restaurant.mapsUrl} />
      </div>

      {/* Chips unter der Karte: Küche, Preis, bei Bisherigen auch Datum und Vor Ort/Bestellt */}
      <MetaChips id={restaurant.id} cuisine={restaurant.cuisine} cuisines={cuisinesOf(all)}>
        <PriceChip id={restaurant.id} priceLevel={restaurant.priceLevel} />
        {visited && <VisitedDate restaurantId={restaurant.id} date={restaurant.visitedOn} />}
        {visited && <OrderedSwitch restaurantId={restaurant.id} ordered={restaurant.ordered} />}
      </MetaChips>

      {!visited && <StatusToggle restaurantId={restaurant.id} status={restaurant.status} />}

      {visited && (
        <section className="space-y-3">
          <h2 className="px-2 font-display text-2xl font-semibold">Bewertung</h2>
          {/* Alles zur Bewertung in einer Karte: oben Gesamtnote, darunter die Kategorien */}
          <div className="card divide-y divide-line rounded-3xl">
            {/* Kopf: Gesamtnote + eure beiden Noten in einer Zeile */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-sm font-medium text-muted">Gesamt</span>
              <div
                className={`-ml-1 flex size-12 shrink-0 items-center justify-center rounded-full font-display text-xl leading-none font-semibold tabular-nums ${
                  average !== null
                    ? "text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]"
                    : "border border-line text-muted"
                }`}
                style={average !== null ? { background: scoreColor(average) } : undefined}
              >
                {average !== null ? formatScore(average) : "–"}
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
                {PERSON_IDS.map((p) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <Avatar person={p} url={avatars[p]} className="size-6 text-[10px]" />
                    <span className="text-sm text-muted">{PEOPLE[p].name}</span>
                    <span className={`font-display text-lg leading-none font-semibold tabular-nums ${PEOPLE[p].text}`}>
                      {restaurant.scores[p] != null ? formatScore(restaurant.scores[p]!) : "–"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 px-3 py-3">
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

      <section className="space-y-3">
        <h2 className="px-2 font-display text-2xl font-semibold">Notizen</h2>
        <NotesForm restaurantId={restaurant.id} notes={restaurant.notes} />
      </section>

      <DeleteButton id={restaurant.id} title={restaurant.name} />
    </article>
  );
}
