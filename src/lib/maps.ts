// Liest Name, Adresse und Koordinaten aus Google-Maps-Links.
// Nur auf dem Server benutzen (folgt Weiterleitungen von Kurzlinks).

export type MapsInfo = {
  mapsUrl: string;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

const USER_AGENT = "Mozilla/5.0 (compatible; foodie-app)";

/** Nur Google-Adressen öffnen – sonst könnte man den Server beliebige Seiten abrufen lassen. */
function isGoogleHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "goo.gl" ||
    host.endsWith(".goo.gl") ||
    /(^|\.)google\.[a-z.]{2,6}$/.test(host)
  );
}

/** Teilen-Text vom iPhone enthält oft Name + Link – den Link herausholen. */
export function extractUrl(input: string) {
  const match = input.match(/https?:\/\/[^\s<>"]+/);
  return match ? match[0] : null;
}

function decode(part: string) {
  try {
    return decodeURIComponent(part.replace(/\+/g, " ")).trim();
  } catch {
    return part.replace(/\+/g, " ").trim();
  }
}

function validCoords(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat || lng);
}

const COORDS = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

/** Aus einem (langen) Google-Maps-Link lesen, was drinsteht. */
export function parseMapsUrl(raw: string): Omit<MapsInfo, "mapsUrl"> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { name: null, address: null, lat: null, lng: null };
  }
  let lat: number | null = null;
  let lng: number | null = null;

  // Genaueste Angabe: Position des Ortes selbst (!3d…!4d…)
  const place = raw.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  // Sonst: Kartenmitte (@lat,lng,17z)
  const center = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const found = place ?? center;
  if (found) {
    lat = Number(found[1]);
    lng = Number(found[2]);
  }

  // q=, query=, ll=, destination= können Koordinaten oder Text sein
  let text: string | null = null;
  for (const key of ["q", "query", "destination", "daddr", "ll"]) {
    const value = url.searchParams.get(key);
    if (!value) continue;
    const coords = value.match(COORDS);
    if (coords) {
      if (lat === null) {
        lat = Number(coords[1]);
        lng = Number(coords[2]);
      }
    } else if (!text && key !== "ll") {
      text = value.trim();
    }
  }

  // /maps/place/<Name>/… oder /maps/search/<Name>/…
  const segment = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/);
  if (segment && !text) {
    const value = decode(segment[1]);
    if (!COORDS.test(value)) text = value;
  }

  let name: string | null = null;
  let address: string | null = null;
  if (text) {
    // "Trattoria Da Mario, Hauptstraße 1, 80331 München"
    const [first, ...rest] = text.split(",").map((part) => part.trim());
    name = first || null;
    address = rest.join(", ") || null;
  }

  if (lat === null || lng === null || !validCoords(lat, lng)) {
    lat = null;
    lng = null;
  }
  return { name, address, lat, lng };
}

/** Kurzlinks (maps.app.goo.gl, goo.gl/maps) bis zum eigentlichen Ziel verfolgen. */
async function resolveUrl(start: string) {
  let current = start;
  for (let i = 0; i < 6; i++) {
    const url = new URL(current);
    if (!isGoogleHost(url.hostname)) break;

    // Cookie-Hinweis von Google: das Ziel steht in ?continue=
    if (url.hostname.startsWith("consent.")) {
      const next = url.searchParams.get("continue");
      if (next) current = next;
      break;
    }

    const isShort = url.hostname.endsWith("goo.gl") || url.pathname.startsWith("/url");
    if (!isShort && (current.includes("@") || current.includes("!3d") || url.searchParams.has("q"))) break;

    const response = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "de-DE,de;q=0.9" },
      signal: AbortSignal.timeout(5000),
    });
    const location = response.headers.get("location");
    if (!location) break;
    current = new URL(location, current).toString();
  }
  return current;
}

/** Adresse oder Name über OpenStreetMap suchen, wenn der Link keine Koordinaten hat. */
export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", query);
    const response = await fetch(url, {
      headers: { "User-Agent": "foodie-app (private restaurant list)", "Accept-Language": "de" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const [hit] = (await response.json()) as { lat: string; lon: string }[];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    return validCoords(lat, lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

/** Mehrere Suchanfragen nacheinander probieren, z. B. "Name, Adresse", dann nur "Adresse". */
export async function geocodeFirst(candidates: (string | null | undefined)[][]) {
  const tried = new Set<string>();
  for (const parts of candidates) {
    const query = parts.filter(Boolean).join(", ");
    if (!query || tried.has(query)) continue;
    tried.add(query);
    const hit = await geocode(query);
    if (hit) return hit;
  }
  return null;
}

/** Link (oder geteilter Text) → Infos. Wirft nie, gibt im schlimmsten Fall nur den Link zurück. */
export async function lookupMaps(input: string): Promise<MapsInfo | null> {
  const link = extractUrl(input);
  if (!link) return null;
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (!isGoogleHost(url.hostname)) return null;

  let resolved = link;
  try {
    resolved = await resolveUrl(link);
  } catch {
    // Kurzlink nicht erreichbar – dann eben nur der Link
  }

  const info = parseMapsUrl(resolved);
  if (info.lat === null) {
    const hit = await geocodeFirst([[info.name, info.address], [info.address], [info.name]]);
    if (hit) Object.assign(info, hit);
  }
  return { mapsUrl: link, ...info };
}
