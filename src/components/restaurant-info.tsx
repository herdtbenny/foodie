"use client";

import { ExternalLink, LoaderCircle } from "lucide-react";
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

const fieldClass =
  "min-w-0 flex-1 bg-transparent py-3 text-right outline-none placeholder:text-muted/60 focus:text-left";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 px-4">
      <span className="w-20 shrink-0 text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

/** Art, Küche, Adresse, Google-Maps-Link – speichern beim Verlassen des Feldes */
export function RestaurantInfo({
  id,
  kind,
  cuisine,
  address,
  mapsUrl,
  kinds,
  cuisines,
}: {
  id: number;
  kind: string | null;
  cuisine: string | null;
  address: string | null;
  mapsUrl: string | null;
  kinds: string[];
  cuisines: string[];
}) {
  const { pending, save } = useSave(id);
  const [values, setValues] = useState({ cuisine: cuisine ?? "", address: address ?? "", mapsUrl: mapsUrl ?? "" });
  const [currentKind, setCurrentKind] = useState(kind ?? "");
  const saved = { cuisine: cuisine ?? "", address: address ?? "", mapsUrl: mapsUrl ?? "" };

  function commit(key: "cuisine" | "address" | "mapsUrl", raw?: string) {
    const next = (raw ?? values[key]).trim();
    if (next === saved[key]) return;
    const labels = { cuisine: "Küche", address: "Adresse", mapsUrl: "Google-Maps-Link" };
    save({ [key]: next || null }, `${labels[key]} gespeichert`, () => setValues((v) => ({ ...v, [key]: saved[key] })));
  }

  function chooseKind(next: string) {
    const value = currentKind === next ? "" : next;
    setCurrentKind(value);
    save({ kind: value || null }, value ? `Art: ${value}` : "Art entfernt", () => setCurrentKind(kind ?? ""));
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <h2 className="font-display text-2xl font-semibold">Infos</h2>
        {pending && <LoaderCircle className="size-4 animate-spin text-muted" />}
      </div>

      <div className="no-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 sm:-mx-4 sm:px-4">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={currentKind === k}
            onClick={() => chooseKind(k)}
            className={`press shrink-0 rounded-full border px-3.5 py-2 text-sm transition-colors ${
              currentKind === k ? "border-ink bg-ink text-paper" : "border-line bg-surface text-muted"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="divide-y divide-line card rounded-3xl">
        <Row label="Küche">
          <input
            list="info-cuisines"
            value={values.cuisine}
            onChange={(e) => setValues((v) => ({ ...v, cuisine: e.target.value }))}
            onBlur={() => commit("cuisine")}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="z. B. Italienisch"
            className={fieldClass}
          />
          <datalist id="info-cuisines">
            {cuisines.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Row>
        <Row label="Adresse">
          <input
            value={values.address}
            onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
            onBlur={() => commit("address")}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="Straße, Ort"
            className={fieldClass}
          />
        </Row>
        <div className="flex items-center gap-3 px-4">
          <label className="flex min-w-0 flex-1 items-center gap-3">
            <span className="w-20 shrink-0 text-sm text-muted">Maps-Link</span>
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
              placeholder="Link einfügen"
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
