# Foodie

Restaurant-Liste für German & Evelyne: Wunschliste, Bewertungen (1–10, jeder für sich) und eine Karte mit allen Einträgen. Schwester-App vom Kochbuch, mit eigener Datenbank.

## Funktionen

- **Wunschliste**: Restaurants, in die ihr mal wollt
- **Besucht**: jeder bewertet von 1–10, Durchschnitt, Sortierung nach Note, Datum, Name
- **Google-Maps-Link** einfügen (auch Kurzlinks `maps.app.goo.gl` und geteilter Text vom iPhone) → Name, Adresse und Position werden übernommen; ohne Koordinaten wird die Adresse über OpenStreetMap gesucht
- **Karte** (Leaflet + OpenStreetMap) mit allen Einträgen, Filter Besucht/Wunschliste
- Kein Passwort: beim Öffnen wählt man „German“ oder „Evelyne“ (Sitzungs-Cookie)

## Tech-Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · Drizzle ORM · Neon Postgres · Leaflet · Vercel

## Lokal starten

```bash
npm install
vercel env pull .env.local
npm run db:push
npm run dev
```
