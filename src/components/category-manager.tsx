"use client";

import { Check, LoaderCircle, Minus, Plus, Store, Trash } from "lucide-react";
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
        className={`press flex items-center justify-between rounded-full px-5 py-3 text-sm font-medium ${
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
          <li key={cat.id} className="space-y-3 card rounded-3xl p-4">
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
                className="press flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink disabled:opacity-30"
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
                className="press flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-30"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {cat.weight === 0 && <p className="text-center text-xs text-muted">Zählt nicht zur Gesamtnote.</p>}
            {/* Chip: zählt diese Kategorie nur, wenn man vor Ort war? */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => toggleOnSite(cat)}
                aria-pressed={cat.onSiteOnly}
                title="Bei Bestellungen wird diese Kategorie ausgegraut"
                className={`press inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  cat.onSiteOnly ? "glass-ink" : "glass text-muted"
                }`}
              >
                <Store className="size-4" />
                {cat.onSiteOnly ? "Nur vor Ort" : "Auch bei Bestellung"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
      <div className="glass flex items-center gap-1 rounded-full p-1 pl-5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Neue Kategorie"
          aria-label="Neue Kategorie"
          className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-muted/70"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !newName.trim()}
          className="press flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Hinzufügen
        </button>
      </div>
      </div>
    </div>
  );
}
