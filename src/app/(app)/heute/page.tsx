import { TodayPicker } from "@/components/today-picker";
import { listRestaurants } from "@/lib/restaurants";

export const metadata = { title: "Wohin heute? · Foodie" };

export default async function TodayPage() {
  const { restaurants } = await listRestaurants();
  return <TodayPicker restaurants={restaurants} />;
}
