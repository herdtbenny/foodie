# Foodie

Restaurant-Liste für German & Evelyne: Wunschliste, Bewertungen (1–10, jeder für sich) und eine Karte mit allen Einträgen. Schwester-App vom Kochbuch, mit eigener Datenbank.

## Funktionen

- **Wunschliste**: Restaurants, in die ihr mal wollt
- **Besucht**: jeder bewertet jede Kategorie (Ambiente, Preis-Leistung, Geschmack, eigene) von 1–10
- **Gesamtnote**: gewichteter Schnitt der Kategorien je Person, Gewichtung auf der Seite „Kategorien“
- **Art** (Frühstück, Café, Abendessen, Bar, Bestellung …) und Küche als Filter
- **Google-Maps-Link** einfügen (auch Kurzlinks `maps.app.goo.gl` und geteilter Text vom iPhone) → Name, Adresse und Position werden übernommen; ohne Koordinaten wird die Adresse über OpenStreetMap gesucht
- **Karte** (Leaflet + OpenStreetMap) mit allen Einträgen, Filter Besucht/Wunschliste
- Gemeinsames Passwort (merkt sich jedes Gerät), bei jedem Öffnen wählt man „German“ oder „Evelyne“

## Tech-Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · Drizzle ORM · Neon Postgres · Leaflet · Vercel

## Lokal starten

```bash
npm install
vercel env pull .env.local
npm run db:push
npm run dev
```
