"use client";

import { ClipboardPaste, Heart, History, LoaderCircle, MapPin, MapPinOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { lookupMapsLink, saveRestaurant } from "@/lib/actions";
import { todayBerlin } from "@/lib/format-date";
import type { Status } from "@/lib/restaurants";
import { SAVE_FAILED, toast } from "@/lib/toast";
import { PriceSelect, SelectChip } from "./restaurant-info";
import { RestaurantMap } from "./restaurant-map";
import { Segmented } from "./segmented";

type Coords = { lat: number; lng: number } | null;
type LinkState = "idle" | "loading" | "found" | "nocoords" | "invalid";

/**
 * Neues Restaurant – bewusst knapp: Link einfügen, Name prüfen, fertig.
 * Bewertung, Datum, Fotos usw. kommen danach direkt auf der Restaurant-Seite.
 */
export function RestaurantForm({ cuisines, defaultStatus = "wunsch" }: { cuisines: string[]; defaultStatus?: Status }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [mapsUrl, setMapsUrl] = useState("");
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [priceLevel, setPriceLevel] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [coords, setCoords] = useState<Coords>(null);
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const lastLookup = useRef("");

  async function lookup(value: string) {
    const input = value.trim();
    if (!input || input === lastLookup.current) return;
    lastLookup.current = input;
    setLinkState("loading");
    try {
      const info = await lookupMapsLink(input);
      if (lastLookup.current !== input) return;
      if (!info) {
        setLinkState("invalid");
        return;
      }
      setMapsUrl(info.mapsUrl);
      lastLookup.current = info.mapsUrl;
      if (info.name) setName((current) => current || info.name!);
      if (info.lat != null && info.lng != null) {
        setCoords({ lat: info.lat, lng: info.lng });
        setLinkState("found");
      } else {
        setCoords(null);
        setLinkState("nocoords");
      }
    } catch {
      setLinkState("idle");
    }
  }

  async function pasteFromClipboard() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value) return;
      setMapsUrl(value);
      lookup(value);
    } catch {
      toast("Einfügen ging nicht – lang ins Feld tippen und „Einsetzen“ wählen.", "error");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await saveRestaurant(formData);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        toast(`„${name}“ eingetragen`);
        router.push(`/restaurants/${result.id}`);
      } catch {
        setError(SAVE_FAILED);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="cuisine" value={cuisine} />
      <input type="hidden" name="priceLevel" value={priceLevel ?? ""} />
      {status === "besucht" && <input type="hidden" name="visitedOn" value={todayBerlin()} />}

      {/* Google-Maps-Link mit Vorschau */}
      <div className="card divide-y divide-line overflow-hidden rounded-3xl">
        {coords && (
          <RestaurantMap
            interactive={false}
            zoom={14}
            className="h-40"
            points={[
              { id: 0, name: name || "Hier", ...coords, status, overall: null, cuisine: cuisine || null, subtitle: null },
            ]}
          />
        )}
        <div className="flex items-center gap-2 py-1 pr-1 pl-4">
          {linkState === "loading" ? (
            <LoaderCircle className="size-4 shrink-0 animate-spin text-muted" />
          ) : linkState === "nocoords" || linkState === "invalid" ? (
            <MapPinOff className="size-4 shrink-0 text-muted" />
          ) : (
            <MapPin className={`size-4 shrink-0 ${linkState === "found" ? "text-pop" : "text-muted"}`} />
          )}
          <input
            name="mapsUrl"
            type="text"
            inputMode="url"
            autoComplete="off"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            onPaste={(e) => lookup(e.clipboardData.getData("text"))}
            onBlur={(e) => lookup(e.target.value)}
            placeholder="Google-Maps-Link"
            aria-label="Google-Maps-Link"
            className="min-w-0 flex-1 truncate bg-transparent py-2.5 outline-none placeholder:text-muted/70"
          />
          <button
            type="button"
            onClick={pasteFromClipboard}
            className="press inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-paper"
          >
            <ClipboardPaste className="size-4" />
            Einfügen
          </button>
        </div>
      </div>
      {linkState === "invalid" && (
        <p className="px-2 text-sm text-pop">Das sieht nicht nach einem Google-Maps-Link aus.</p>
      )}

      <input
        name="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        aria-label="Name"
        className="glass w-full rounded-full px-5 py-3 font-display text-lg font-semibold outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted/70"
      />

      <div className="grid grid-cols-[2fr_1fr] gap-1.5">
        <SelectChip label="Küche" value={cuisine} options={cuisines} allowNew onChange={setCuisine} />
        <PriceSelect value={priceLevel} onChange={setPriceLevel} />
      </div>

      <Segmented
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          { value: "wunsch", label: "Wunschliste", icon: Heart },
          { value: "besucht", label: "Wir waren da", icon: History },
        ]}
      />

      {error && (
        <p role="alert" className="px-2 text-sm text-pop">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || linkState === "loading"}
        className="press flex w-full items-center justify-center gap-2 rounded-full bg-pop px-5 py-3.5 font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_24px_-10px_rgb(215_57_43/0.7)] disabled:opacity-60"
      >
        {pending && <LoaderCircle className="size-5 animate-spin" />}
        {pending ? "Speichern …" : "Eintragen"}
      </button>
    </form>
  );
}
