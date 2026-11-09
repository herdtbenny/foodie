"use client";

import { Heart, ClipboardPaste, LoaderCircle, MapPin, MapPinOff, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { lookupMapsLink, saveRestaurant } from "@/lib/actions";
import { todayBerlin } from "@/lib/format-date";
import type { Status } from "@/lib/restaurants";
import { SAVE_FAILED, toast } from "@/lib/toast";
import { RestaurantMap } from "./restaurant-map";
import { Segmented } from "./segmented";

type ExistingRestaurant = {
  id: number;
  name: string;
  cuisine: string | null;
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
      <span className="mb-1.5 flex items-baseline justify-between gap-2 px-2 text-sm font-medium">
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
  defaultStatus = "wunsch",
}: {
  restaurant?: ExistingRestaurant;
  cuisines: string[];
  defaultStatus?: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [mapsUrl, setMapsUrl] = useState(restaurant?.mapsUrl ?? "");
  const [name, setName] = useState(restaurant?.name ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [ordered, setOrderedState] = useState(false);
  const [status, setStatus] = useState<Status>(restaurant?.status ?? defaultStatus);
  const [coords, setCoords] = useState<Coords>(
    restaurant?.lat != null && restaurant.lng != null ? { lat: restaurant.lat, lng: restaurant.lng } : null,
  );
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
      setAddress(info.address ?? "");
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
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="ordered" value={ordered ? "1" : ""} />

      {/* Google-Maps-Link zuerst – füllt den Rest aus */}
      <div className="space-y-2 card rounded-3xl p-4">
        <Field label="Google-Maps-Link" hint="Teilen → Link kopieren">
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
              className="press flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-paper"
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
              <MapPinOff className="size-3.5" /> Keine Position im Link – wird beim Speichern gesucht
            </>
          )}
          {linkState === "invalid" && <>Das sieht nicht nach einem Google-Maps-Link aus.</>}
          {linkState === "idle" &&
            (coords ? (
              <>
                <MapPin className="size-3.5 text-german" /> Position gespeichert
              </>
            ) : (
              <>In Google Maps: Teilen → Link kopieren, hier einfügen.</>
            ))}
        </p>
        {coords && (
          <RestaurantMap
            interactive={false}
            zoom={16}
            className="h-32 rounded-2xl"
            points={[{ id: 0, name: name || "Hier", ...coords, status, overall: null, cuisine: null, subtitle: null }]}
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
      </div>

      <fieldset>
        <legend className="mb-1.5 px-2 text-sm font-medium">Status</legend>
        <Segmented
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "wunsch", label: "Wunschliste", icon: Heart },
            { value: "besucht", label: "Waren wir schon", icon: History },
          ]}
        />
      </fieldset>

      {status === "besucht" && (
        <Segmented
          label="Vor Ort oder bestellt"
          value={ordered}
          onChange={setOrderedState}
          options={[
            { value: false, label: "Vor Ort" },
            { value: true, label: "Bestellt" },
          ]}
        />
      )}

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
        className="press flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending && <LoaderCircle className="size-5 animate-spin" />}
        {pending ? "Speichern …" : restaurant ? "Speichern" : status === "besucht" ? "Eintragen & bewerten" : "Auf die Wunschliste"}
      </button>
    </form>
  );
}
