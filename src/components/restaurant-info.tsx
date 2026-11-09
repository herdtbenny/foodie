"use client";

import { ChevronDown, ExternalLink, LoaderCircle, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Children, useState, useTransition } from "react";
import { updateRestaurant, type RestaurantPatch } from "@/lib/actions";
import { SAVE_FAILED, toast } from "@/lib/toast";

function useSave(id: number) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function save(patch: RestaurantPatch, message: string, onError?: () => void) {
    startTransition(async () => {
      try {
        await updateRestaurant(id, patch);
        toast(message);
        router.refresh();
      } catch {
        onError?.();
        toast(SAVE_FAILED, "error");
      }
    });
  }
  return { pending, save };
}

/** Name als Überschrift – antippen und direkt ändern */
export function EditableTitle({ id, name }: { id: number; name: string }) {
  const [value, setValue] = useState(name);
  const { pending, save } = useSave(id);

  function commit() {
    const next = value.trim();
    if (!next) return setValue(name);
    if (next !== name) save({ name: next }, "Name gespeichert", () => setValue(name));
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        rows={1}
        onChange={(e) => setValue(e.target.value.replace(/\n/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        aria-label="Name"
        data-large
        className="-mx-2 block w-[calc(100%+1rem)] resize-none rounded-2xl bg-transparent px-2 font-display text-4xl leading-tight font-semibold outline-none [field-sizing:content] focus:bg-surface"
      />
      {pending && <LoaderCircle className="absolute top-3 right-0 size-4 animate-spin text-muted" />}
    </div>
  );
}

const NEW = "__neu";

/** Ein Chip mit unsichtbarem nativem <select> darüber – öffnet auf dem iPhone das System-Menü */
export function SelectChip({
  label,
  value,
  options,
  onChange,
  allowNew,
  pending,
  emptyLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  allowNew?: boolean;
  pending?: boolean;
  /** Text für "nichts gewählt" im Menü, z. B. "Alle Küchen" */
  emptyLabel?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const list = value && !options.includes(value) ? [value, ...options] : options;

  if (adding) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setAdding(false);
          if (draft.trim()) onChange(draft.trim());
          setDraft("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft("");
            setAdding(false);
          }
        }}
        placeholder={`Neue ${label}, z. B. Vietnamesisch`}
        aria-label={`Neue ${label}`}
        className="glass w-full min-w-0 rounded-full px-3.5 py-3.5 text-sm outline-none"
      />
    );
  }

  return (
    <span
      className={`press glass relative flex w-full min-w-0 items-center justify-center gap-1 rounded-full py-3.5 pr-2.5 pl-3 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
        value ? "text-ink" : "text-muted"
      }`}
    >
      <span className="min-w-0 truncate">{value || emptyLabel || label}</span>
      {pending ? (
        <LoaderCircle className="size-3.5 shrink-0 animate-spin opacity-60" />
      ) : (
        <ChevronDown className="size-3.5 shrink-0 opacity-60" />
      )}
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === NEW) setAdding(true);
          else onChange(e.target.value);
        }}
        aria-label={label}
        className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0"
      >
        {/* "Neu" ganz oben, damit man es nicht übersieht */}
        {allowNew && <option value={NEW}>＋ Neue {label} hinzufügen …</option>}
        <option value="">{emptyLabel ?? `Keine ${label}`}</option>
        {list.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Chip-Zeile unter der Karte: Küche, dahinter weitere Chips (Datum, Vor Ort/Bestellt) */
export function MetaChips({
  id,
  cuisine,
  cuisines,
  children,
}: {
  id: number;
  cuisine: string | null;
  cuisines: string[];
  children?: React.ReactNode;
}) {
  const { pending, save } = useSave(id);
  const [current, setCurrent] = useState(cuisine ?? "");
  // Gleich breite Spalten über die ganze Zeile
  const columns = 1 + Children.toArray(children).length;

  return (
    <div className="grid items-center gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      <SelectChip
        label="Küche"
        value={current}
        options={cuisines}
        allowNew
        pending={pending}
        onChange={(v) => {
          setCurrent(v);
          save({ cuisine: v || null }, v ? `Küche: ${v}` : "Küche entfernt", () => setCurrent(cuisine ?? ""));
        }}
      />
      {children}
    </div>
  );
}


/** Google-Maps-Link – Position und Adresse kommen daraus */
/**
 * Schmale Zeile unter der Karte: Google-Maps-Link direkt bearbeiten, daneben Öffnen.
 * Neuer Link → Position wird daraus gelesen.
 */
export function MapsLinkRow({ id, mapsUrl }: { id: number; mapsUrl: string | null }) {
  const { pending, save } = useSave(id);
  const [value, setValue] = useState(mapsUrl ?? "");
  const saved = mapsUrl ?? "";

  function commit(raw?: string) {
    const next = (raw ?? value).trim();
    if (next === saved) return;
    save({ mapsUrl: next || null }, next ? "Google-Maps-Link gespeichert" : "Link entfernt", () => setValue(saved));
  }

  return (
    <div className="flex items-center gap-2 py-1 pr-1 pl-4">
      {pending ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-muted" />
      ) : (
        <MapPin className="size-4 shrink-0 text-muted" />
      )}
      <input
        type="text"
        inputMode="url"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          e.preventDefault();
          setValue(pasted);
          commit(pasted);
        }}
        onBlur={() => commit()}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        placeholder="Google-Maps-Link einfügen"
        aria-label="Google-Maps-Link"
        className="min-w-0 flex-1 truncate bg-transparent py-2 text-sm text-muted outline-none placeholder:text-muted/60 focus:text-ink"
      />
      {saved && (
        <a
          href={saved}
          target="_blank"
          rel="noreferrer"
          aria-label="In Google Maps öffnen"
          className="press inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper"
        >
          Öffnen
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}
