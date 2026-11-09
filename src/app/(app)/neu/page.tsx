import { RestaurantForm } from "@/components/restaurant-form";
import { cuisinesOf, listRestaurants, toStatus } from "@/lib/restaurants";

export const metadata = { title: "Neues Restaurant · Foodie" };

export default async function NewPage({ searchParams }: PageProps<"/neu">) {
  const { status } = await searchParams;
  const cuisines = cuisinesOf(await listRestaurants());
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Neues Restaurant</h1>
      <RestaurantForm cuisines={cuisines} defaultStatus={toStatus(status)} />
    </div>
  );
}
