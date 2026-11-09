import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foodie",
    short_name: "Foodie",
    description: "Die Restaurants von German und Evelyne.",
    // Home-Bildschirm-App startet immer bei "Wer bist du?"
    start_url: "/login",
    display: "standalone",
    background_color: "#f4f4f2",
    theme_color: "#f4f4f2",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
