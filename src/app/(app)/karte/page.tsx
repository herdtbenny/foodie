import { MapExplorer } from "@/components/map-explorer";
import { formatScore } from "@/components/score";
import { listRestaurants } from "@/lib/restaurants";

export const metadata = { title: "Karte · Foodie" };

export default async function MapPage() {
  const { restaurants: all } = await listRestaurants();
  const points = all.flatMap((r) => {
    if (r.lat == null || r.lng == null) return [];
    const average = r.overall;
    return [
      {
        id: r.id,
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        status: r.status,
        overall: average,
        cuisine: r.cuisine,
        subtitle: [r.cuisine, r.status === "wunsch" ? "Wunschliste" : average !== null ? `${formatScore(average)}/10` : null]
          .filter(Boolean)
          .join(" · ") || null,
      },
    ];
  });
  const missing = all.filter((r) => r.lat == null || r.lng == null).map((r) => ({ id: r.id, name: r.name }));

  return <MapExplorer points={points} missing={missing} />;
}
