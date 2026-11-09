import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { RestaurantForm } from "@/components/restaurant-form";
import { cuisinesOf, getRestaurant, listRestaurants } from "@/lib/restaurants";

export const metadata = { title: "Bearbeiten · Foodie" };

export default async function EditPage({ params }: PageProps<"/restaurants/[id]/bearbeiten">) {
  const { id } = await params;
  const [restaurant, all] = await Promise.all([getRestaurant(Number(id)), listRestaurants()]);
  if (!restaurant) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/restaurants/${restaurant.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted">
        <ArrowLeft className="size-4" />
        Zurück
      </Link>
      <h1 className="font-display text-3xl font-semibold">Bearbeiten</h1>
      <RestaurantForm restaurant={restaurant} cuisines={cuisinesOf(all)} />
      <DeleteButton id={restaurant.id} title={restaurant.name} />
    </div>
  );
}
