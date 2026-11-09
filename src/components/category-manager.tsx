"use client";

import { LoaderCircle, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addCategory, deleteCategory, renameCategory, setCategoryWeight } from "@/lib/actions";
import { weightPercent, type Category } from "@/lib/restaurants";
import { SAVE_FAILED, toast } from "@/lib/toast";

const WEIGHTS = [0, 1, 2, 3, 4, 5];

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

  function weigh(cat: Category, weight: number) {
    setList((current) => current.map((c) => (c.id === cat.id ? { ...c, weight } : c)));
    run(() => setCategoryWeight(cat.id, weight), `${cat.name}: Gewicht ${weight}`);
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
              <span className="font-display text-2xl font-semibold text-pop tabular-nums">
                {weightPercent(list, cat)} %
              </span>
              <button
                type="button"
                onClick={() => remove(cat)}
                aria-label={`${cat.name} löschen`}
                className="flex size-9 items-center justify-center rounded-full text-muted hover:text-red-600"
              >
                <Trash className="size-4" />
              </button>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-muted">Gewicht</p>
              <div role="radiogroup" aria-label={`Gewicht ${cat.name}`} className="flex gap-1.5">
                {WEIGHTS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    role="radio"
                    aria-checked={cat.weight === w}
                    onClick={() => weigh(cat, w)}
                    className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors ${
                      cat.weight === w ? "bg-ink text-paper" : "border border-line text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
              {cat.weight === 0 && <p className="mt-1.5 text-xs text-muted">Zählt nicht zur Gesamtnote.</p>}
            </div>
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
