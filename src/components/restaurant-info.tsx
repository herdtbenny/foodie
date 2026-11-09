"use client";

import { ChevronDown, ExternalLink, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
function SelectChip({
  label,
  value,
  options,
  onChange,
  allowNew,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  allowNew?: boolean;
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
        placeholder={`Neue ${label}`}
        aria-label={`Neue ${label}`}
        className="glass w-40 rounded-full px-3.5 py-1.5 text-sm outline-none"
      />
    );
  }

  return (
    <span
      className={`press glass relative inline-flex items-center gap-1 rounded-full py-1.5 pr-2.5 pl-3.5 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
        value ? "text-ink" : "text-muted"
      }`}
    >
      {value || label}
      <ChevronDown className="size-3.5 opacity-60" />
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === NEW) setAdding(true);
          else onChange(e.target.value);
        }}
        aria-label={label}
        className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0"
      >
        <option value="">Keine {label}</option>
        {list.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {allowNew && <option value={NEW}>Neue {label} …</option>}
      </select>
    </span>
  );
}

/** Direkt unter dem Namen: Chip für die Küche */
export function MetaChips({ id, cuisine, cuisines }: { id: number; cuisine: string | null; cuisines: string[] }) {
  const { pending, save } = useSave(id);
  const [current, setCurrent] = useState(cuisine ?? "");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SelectChip
        label="Küche"
        value={current}
        options={cuisines}
        allowNew
        onChange={(v) => {
          setCurrent(v);
          save({ cuisine: v || null }, v ? `Küche: ${v}` : "Küche entfernt", () => setCurrent(cuisine ?? ""));
        }}
      />
      {pending && <LoaderCircle className="size-4 animate-spin text-muted" />}
    </div>
  );
}

const fieldClass =
  "min-w-0 flex-1 bg-transparent py-3 text-right outline-none placeholder:text-muted/60 focus:text-left";

/** Google-Maps-Link – Position und Adresse kommen daraus */
export function RestaurantInfo({ id, mapsUrl }: { id: number; mapsUrl: string | null }) {
  const { pending, save } = useSave(id);
  const [values, setValues] = useState({ mapsUrl: mapsUrl ?? "" });
  const saved = { mapsUrl: mapsUrl ?? "" };

  function commit(key: "mapsUrl", raw?: string) {
    const next = (raw ?? values[key]).trim();
    if (next === saved[key]) return;
    const labels = { mapsUrl: "Google-Maps-Link" };
    save({ [key]: next || null }, `${labels[key]} gespeichert`, () => setValues((v) => ({ ...v, [key]: saved[key] })));
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <h2 className="font-display text-2xl font-semibold">Google Maps</h2>
        {pending && <LoaderCircle className="size-4 animate-spin text-muted" />}
      </div>


      <div className="divide-y divide-line card rounded-3xl">
        <div className="flex items-center gap-3 px-4">
          <label className="flex min-w-0 flex-1 items-center gap-3">
            <span className="w-12 shrink-0 text-sm text-muted">Link</span>
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              value={values.mapsUrl}
              onChange={(e) => setValues((v) => ({ ...v, mapsUrl: e.target.value }))}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                e.preventDefault();
                setValues((v) => ({ ...v, mapsUrl: pasted }));
                commit("mapsUrl", pasted);
              }}
              onBlur={() => commit("mapsUrl")}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="Google-Maps-Link einfügen"
              className={`${fieldClass} truncate`}
            />
          </label>
          {saved.mapsUrl && (
            <a
              href={saved.mapsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="In Google Maps öffnen"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:text-ink"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
