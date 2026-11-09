import { RestaurantForm } from "@/components/restaurant-form";
import { listRestaurants, toStatus, valuesOf } from "@/lib/restaurants";

export const metadata = { title: "Neues Restaurant · Foodie" };

export default async function NewPage({ searchParams }: PageProps<"/neu">) {
  const { status } = await searchParams;
  const { restaurants } = await listRestaurants();
  return (
    <div className="space-y-6">
      <h1 className="px-2 font-display text-3xl font-semibold">Neues Restaurant</h1>
      <RestaurantForm
        cuisines={valuesOf(restaurants, "cuisine")}
        kinds={valuesOf(restaurants, "kind")}
        defaultStatus={toStatus(status)}
      />
    </div>
  );
}
