import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foodie",
    short_name: "Foodie",
    description: "Die Restaurants von Benny und Lisa.",
    // Home-Bildschirm-App startet immer bei "Wer bist du?"
    start_url: "/login",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#fbf7f0",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
