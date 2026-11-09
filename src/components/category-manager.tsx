"use client";

import { Check, LoaderCircle, Minus, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addCategory, deleteCategory, renameCategory, setCategoryOnSiteOnly, setCategoryWeight } from "@/lib/actions";
import type { Category } from "@/lib/restaurants";
import { SAVE_FAILED, toast } from "@/lib/toast";

const STEP = 5;

/** Kategorien anlegen, umbenennen, löschen und gewichten. Gilt für euch beide. */
export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [list, setList] = useState(categories);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>, message: string) {
    startTransition(async () => {
      try {
        await action();
        toast(message);
      } catch {
        toast(SAVE_FAILED, "error");
      }
    });
  }

  const used = list.reduce((sum, c) => sum + c.weight, 0);
  const left = 100 - used;

  function weigh(cat: Category, weight: number) {
    if (weight < 0 || weight - cat.weight > left) return;
    setList((current) => current.map((c) => (c.id === cat.id ? { ...c, weight } : c)));
    run(() => setCategoryWeight(cat.id, weight), `${cat.name}: ${weight} %`);
  }

  function toggleOnSite(cat: Category) {
    const next = !cat.onSiteOnly;
    setList((current) => current.map((c) => (c.id === cat.id ? { ...c, onSiteOnly: next } : c)));
    run(
      () => setCategoryOnSiteOnly(cat.id, next),
      next ? `${cat.name}: nur vor Ort` : `${cat.name}: zählt auch bei Bestellung`,
    );
  }

  function rename(cat: Category, name: string) {
    const value = name.trim();
    if (!value || value === cat.name) return;
    setList((current) => current.map((c) => (c.id === cat.id ? { ...c, name: value } : c)));
    run(() => renameCategory(cat.id, value), `Umbenannt in „${value}“`);
  }

  function remove(cat: Category) {
    if (!confirm(`„${cat.name}“ löschen? Alle Noten in dieser Kategorie gehen verloren.`)) return;
    setList((current) => current.filter((c) => c.id !== cat.id));
    run(() => deleteCategory(cat.id), `„${cat.name}“ gelöscht`);
  }

  function add() {
    const value = newName.trim();
    if (!value) return;
    setNewName("");
    startTransition(async () => {
      try {
        await addCategory(value);
        toast(`„${value}“ hinzugefügt`);
        // Die Seite gibt der Liste einen neuen key, dadurch erscheint die neue Kategorie
        router.refresh();
      } catch {
        toast(SAVE_FAILED, "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center justify-between rounded-full px-5 py-3 text-sm font-medium ${
          left === 0 ? "bg-ink text-paper" : "bg-pop text-white"
        }`}
        aria-live="polite"
      >
        {left === 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4" /> 100 % verteilt
          </span>
        ) : (
          <span>Noch {left} % zu verteilen</span>
        )}
        <span className="tabular-nums opacity-80">{used} / 100 %</span>
      </div>
      <ul className="space-y-2">
        {list.map((cat) => (
          <li key={cat.id} className="space-y-3 rounded-3xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <input
                defaultValue={cat.name}
                onBlur={(e) => rename(cat, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                aria-label="Name der Kategorie"
                className="min-w-0 flex-1 rounded-full bg-transparent px-1 font-display text-xl font-semibold outline-none focus:bg-paper focus:px-3"
              />
              <button
                type="button"
                onClick={() => remove(cat)}
                aria-label={`${cat.name} löschen`}
                className="flex size-9 items-center justify-center rounded-full text-muted hover:text-red-600"
              >
                <Trash className="size-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => weigh(cat, cat.weight - STEP)}
                disabled={cat.weight === 0}
                aria-label={`${cat.name} weniger`}
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink disabled:opacity-30"
              >
                <Minus className="size-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-center font-display text-3xl leading-none font-semibold tabular-nums">
                  {cat.weight} %
                </p>
                {/* Anteil als Balken – einfarbig, kein Verlauf */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-pop transition-[width]" style={{ width: `${cat.weight}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => weigh(cat, cat.weight + STEP)}
                disabled={left < STEP}
                aria-label={`${cat.name} mehr`}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-30"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {cat.weight === 0 && <p className="text-center text-xs text-muted">Zählt nicht zur Gesamtnote.</p>}
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
              <span className="text-muted">Nur vor Ort (bei Bestellung ausgegraut)</span>
              <input
                type="checkbox"
                checked={cat.onSiteOnly}
                onChange={() => toggleOnSite(cat)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink ${
                  cat.onSiteOnly ? "bg-ink" : "bg-line"
                }`}
              >
                <span
                  className={`absolute top-1 size-5 rounded-full bg-paper shadow transition-[left] ${
                    cat.onSiteOnly ? "left-6" : "left-1"
                  }`}
                />
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Neue Kategorie, z. B. Service"
          aria-label="Neue Kategorie"
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-5 py-3 outline-none placeholder:text-muted/70 focus:border-ink"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !newName.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 font-semibold text-paper disabled:opacity-50"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Hinzufügen
        </button>
      </div>
    </div>
  );
}
