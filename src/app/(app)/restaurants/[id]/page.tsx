import { ArrowLeft, Calendar, MapPin, Navigation, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { NotesForm } from "@/components/notes-form";
import { RatingSlider } from "@/components/rating-slider";
import { RestaurantMap } from "@/components/restaurant-map";
import { formatScore } from "@/components/score";
import { StatusToggle } from "@/components/status-toggle";
import { requirePerson } from "@/lib/auth";
import { avatarUrls } from "@/lib/avatars";
import { formatDate } from "@/lib/format-date";
import { PEOPLE, PERSON_IDS } from "@/lib/people";
import { averageScore, getRestaurant } from "@/lib/restaurants";

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
  const average = averageScore(restaurant.scores);
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
          {restaurant.cuisine && <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">{restaurant.cuisine}</p>}
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
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">Bewertung</h2>
            {average !== null && (
              <p className="text-sm text-muted">
                Zusammen <span className="font-semibold text-ink tabular-nums">{formatScore(average)}/10</span>
              </p>
            )}
          </div>
          <div className="space-y-5 rounded-3xl border border-line bg-surface p-4">
            {PERSON_IDS.map((p) => (
              <RatingSlider
                key={p}
                restaurantId={restaurant.id}
                score={restaurant.scores[p]}
                label={p === person ? "Du" : PEOPLE[p].name}
                editable={p === person}
                colorClass={PEOPLE[p].text}
                bgClass={PEOPLE[p].bg}
                softClass={PEOPLE[p].soft}
                avatar={<Avatar person={p} url={avatars[p]} className="size-8 text-xs" />}
              />
            ))}
          </div>
          <StatusToggle restaurantId={restaurant.id} status={restaurant.status} />
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
