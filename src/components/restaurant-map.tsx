"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export type MapPoint = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: "wunsch" | "besucht";
  /** Durchschnitt, schon formatiert ("8,5") */
  score: string | null;
  subtitle: string | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Pin: besucht = gefüllt mit Bewertung, Wunschliste = Ring mit Stern. */
function pinHtml(point: MapPoint) {
  const visited = point.status === "besucht";
  const label = visited ? (point.score ?? "–") : "★";
  return `<div class="foodie-pin ${visited ? "is-visited" : "is-wish"}"><span>${escapeHtml(label)}</span></div>`;
}

const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function RestaurantMap({
  points,
  className,
  interactive = true,
  zoom = 15,
}: {
  points: MapPoint[];
  className?: string;
  /** false = kleine Vorschau auf der Detailseite */
  interactive?: boolean;
  zoom?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const router = useRouter();
  // Punkte als Schlüssel, damit die Karte nur bei echten Änderungen neu gebaut wird
  const key = JSON.stringify(points);

  useEffect(() => {
    let cancelled = false;
    const list = JSON.parse(key) as MapPoint[];

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !container.current) return;

      map.current?.remove();
      const instance = L.map(container.current, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        keyboard: interactive,
        attributionControl: true,
      });
      map.current = instance;

      // Dunkelmodus: Kacheln per CSS-Filter abdunkeln (siehe globals.css)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(instance);

      const markers = list.map((point) => {
        const marker = L.marker([point.lat, point.lng], {
          icon: L.divIcon({ html: pinHtml(point), className: "", iconSize: [34, 34], iconAnchor: [17, 17] }),
          title: point.name,
          keyboard: interactive,
        }).addTo(instance);

        if (interactive) {
          const popup = document.createElement("div");
          popup.className = "foodie-popup";
          popup.innerHTML = `<strong>${escapeHtml(point.name)}</strong>${
            point.subtitle ? `<span>${escapeHtml(point.subtitle)}</span>` : ""
          }<button type="button">Ansehen →</button>`;
          popup.querySelector("button")!.addEventListener("click", () => router.push(`/restaurants/${point.id}`));
          marker.bindPopup(popup, { closeButton: false, offset: [0, -12] });
        }
        return marker;
      });

      if (list.length === 0) {
        // Ohne Einträge: Deutschland
        instance.setView([51.1, 10.4], 5);
      } else if (list.length === 1) {
        instance.setView([list[0].lat, list[0].lng], zoom);
      } else {
        instance.fitBounds(L.featureGroup(markers).getBounds(), { padding: [40, 40], maxZoom: 15 });
      }
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [key, interactive, zoom, router]);

  return <div ref={container} className={`isolate z-0 overflow-hidden bg-line ${className ?? ""}`} />;
}
