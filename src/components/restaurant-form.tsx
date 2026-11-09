"use client";

import { Bookmark, ClipboardPaste, LoaderCircle, MapPin, MapPinOff, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { lookupMapsLink, saveRestaurant } from "@/lib/actions";
import { todayBerlin } from "@/lib/format-date";
import type { Status } from "@/lib/restaurants";
import { SAVE_FAILED, toast } from "@/lib/toast";
import { RestaurantMap } from "./restaurant-map";

type ExistingRestaurant = {
  id: number;
  name: string;
  cuisine: string | null;
  kind: string | null;
  address: string | null;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: Status;
  visitedOn: string | null;
  notes: string | null;
};

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none placeholder:text-muted/70 focus:border-ink";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

type Coords = { lat: number; lng: number } | null;
type LinkState = "idle" | "loading" | "found" | "nocoords" | "invalid";

export function RestaurantForm({
  restaurant,
  cuisines,
  kinds,
  defaultStatus = "wunsch",
}: {
  restaurant?: ExistingRestaurant;
  cuisines: string[];
  kinds: string[];
  defaultStatus?: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [mapsUrl, setMapsUrl] = useState(restaurant?.mapsUrl ?? "");
  const [name, setName] = useState(restaurant?.name ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [kind, setKind] = useState(restaurant?.kind ?? "");
  const [status, setStatus] = useState<Status>(restaurant?.status ?? defaultStatus);
  const [coords, setCoords] = useState<Coords>(
    restaurant?.lat != null && restaurant.lng != null ? { lat: restaurant.lat, lng: restaurant.lng } : null,
  );
  // Position kam aus dem Link? Dann ändert eine andere Adresse nichts daran.
  const [coordsFromLink, setCoordsFromLink] = useState(!!restaurant?.mapsUrl);
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const lastLookup = useRef(restaurant?.mapsUrl ?? "");

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
      if (info.address) setAddress((current) => current || info.address!);
      if (info.lat != null && info.lng != null) {
        setCoords({ lat: info.lat, lng: info.lng });
        setCoordsFromLink(true);
        setLinkState("found");
      } else {
        setCoords(null);
        setCoordsFromLink(false);
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
        toast(restaurant ? "Gespeichert" : `„${name}“ eingetragen`);
        router.push(`/restaurants/${result.id}`);
      } catch {
        setError(SAVE_FAILED);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {restaurant && <input type="hidden" name="id" value={restaurant.id} />}
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="kind" value={kind} />

      {/* Google-Maps-Link zuerst – füllt den Rest aus */}
      <div className="space-y-2 rounded-3xl border border-line bg-surface p-4">
        <Field label="Google-Maps-Link" hint="In Maps: Teilen → Link kopieren">
          <div className="flex gap-2">
            <input
              name="mapsUrl"
              type="text"
              inputMode="url"
              autoComplete="off"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              onPaste={(e) => lookup(e.clipboardData.getData("text"))}
              onBlur={(e) => lookup(e.target.value)}
              placeholder="https://maps.app.goo.gl/…"
              className={`${inputClass} min-w-0 flex-1 bg-paper`}
            />
            <button
              type="button"
              onClick={pasteFromClipboard}
              aria-label="Link aus der Zwischenablage einfügen"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-paper"
            >
              <ClipboardPaste className="size-4" />
              <span className="hidden sm:inline">Einfügen</span>
            </button>
          </div>
        </Field>
        <p className="flex min-h-5 items-center gap-1.5 text-xs text-muted" aria-live="polite">
          {linkState === "loading" && (
            <>
              <LoaderCircle className="size-3.5 animate-spin" /> Link wird gelesen …
            </>
          )}
          {linkState === "found" && (
            <>
              <MapPin className="size-3.5 text-german" /> Position gefunden
            </>
          )}
          {linkState === "nocoords" && (
            <>
              <MapPinOff className="size-3.5" /> Keine Position im Link – wird beim Speichern über die Adresse gesucht
            </>
          )}
          {linkState === "invalid" && <>Das sieht nicht nach einem Google-Maps-Link aus.</>}
          {linkState === "idle" &&
            (coords ? (
              <>
                <MapPin className="size-3.5 text-german" /> Position gespeichert
              </>
            ) : (
              <>Optional – ohne Link wird die Adresse gesucht.</>
            ))}
        </p>
        {coords && (
          <RestaurantMap
            interactive={false}
            zoom={16}
            className="h-32 rounded-2xl"
            points={[{ id: 0, name: name || "Hier", ...coords, status, overall: null, cuisine: null, kind, subtitle: null }]}
          />
        )}
      </div>

      <Field label="Name">
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Trattoria Da Mario"
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 flex w-full items-baseline justify-between text-sm font-medium">
          Art <span className="text-xs font-normal text-muted">optional</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(kind === k ? "" : k)}
              className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                kind === k ? "border-ink bg-ink text-paper" : "border-line bg-surface text-muted"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Küche" hint="optional">
          <input
            name="cuisine"
            list="cuisines"
            defaultValue={restaurant?.cuisine ?? ""}
            placeholder="z. B. Italienisch"
            className={inputClass}
          />
          <datalist id="cuisines">
            {cuisines.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Adresse" hint="optional">
          <input
            name="address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              // Selbst getippte Adresse: Position beim Speichern neu suchen
              if (!coordsFromLink) setCoords(null);
            }}
            placeholder="Straße, Ort"
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Status</legend>
        <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1">
          {(
            [
              ["wunsch", "Wunschliste", Bookmark],
              ["besucht", "Waren wir schon", Star],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              aria-pressed={status === value}
              className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${
                status === value ? "bg-accent text-accent-ink" : "text-muted"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {status === "besucht" && (
        <Field label="Zuletzt besucht" hint="optional">
          <input
            name="visitedOn"
            type="date"
            max={todayBerlin()}
            defaultValue={restaurant?.visitedOn ?? todayBerlin()}
            className={`${inputClass} appearance-none`}
          />
        </Field>
      )}

      <Field label="Notizen" hint="optional">
        <textarea
          name="notes"
          rows={3}
          defaultValue={restaurant?.notes ?? ""}
          placeholder="z. B. „Von Anna empfohlen“ oder „Unbedingt reservieren“"
          className={`${inputClass} min-h-[5rem] resize-none [field-sizing:content]`}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || linkState === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending && <LoaderCircle className="size-5 animate-spin" />}
        {pending ? "Speichern …" : restaurant ? "Speichern" : status === "besucht" ? "Eintragen & bewerten" : "Auf die Wunschliste"}
      </button>
    </form>
  );
}
