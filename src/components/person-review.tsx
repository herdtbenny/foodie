"use client";

/* eslint-disable @next/next/no-img-element -- Fotos aus Vercel Blob */

import { Camera, LoaderCircle, ThumbsUp, Trash } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { removePhoto, saveDish, setRecommend, uploadPhoto } from "@/lib/actions";
import { PEOPLE, type Person } from "@/lib/people";
import type { Review } from "@/lib/restaurants";
import { resizeImage } from "@/lib/resize-image";
import { SAVE_FAILED, toast } from "@/lib/toast";

/**
 * Eintrag einer Person: Foto, was sie gegessen hat, Weiterempfehlung.
 * Die eigene Karte ist bearbeitbar, die der anderen Person nur zum Anschauen.
 */
export function PersonReview({
  restaurantId,
  person,
  review,
  editable,
  avatar,
}: {
  restaurantId: number;
  person: Person;
  review?: Review;
  editable: boolean;
  avatar: React.ReactNode;
}) {
  const p = PEOPLE[person];
  const [recommend, setRecommendState] = useState(review?.recommend ?? false);
  const [dish, setDish] = useState(review?.dish ?? "");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"photo" | "dish" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const shownRecommend = editable ? recommend : !!review?.recommend;
  const dishChanged = dish.trim() !== (review?.dish ?? "").trim();

  function run(kind: "photo" | "dish" | null, action: () => Promise<void>, message: string, undo?: () => void) {
    setBusy(kind);
    startTransition(async () => {
      try {
        await action();
        toast(message);
      } catch {
        undo?.();
        toast(SAVE_FAILED, "error");
      } finally {
        setBusy(null);
      }
    });
  }

  function toggleRecommend() {
    const next = !recommend;
    setRecommendState(next);
    run(null, () => setRecommend(restaurantId, next), next ? "Weiterempfohlen 👍" : "Empfehlung entfernt", () =>
      setRecommendState(!next),
    );
  }

  async function pickPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy("photo");
    try {
      const small = await resizeImage(file);
      const data = new FormData();
      data.set("photo", small);
      run("photo", () => uploadPhoto(restaurantId, data), "Foto gespeichert");
    } catch {
      setBusy(null);
      toast("Das Foto konnte nicht verarbeitet werden.", "error");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2.5">
        {avatar}
        <span className="flex-1 font-medium">{editable ? "Du" : p.name}</span>
        {editable ? (
          <button
            type="button"
            onClick={toggleRecommend}
            aria-pressed={recommend}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              recommend ? "bg-pop text-white" : "border border-line text-muted hover:border-ink hover:text-ink"
            }`}
          >
            <ThumbsUp className="size-4" />
            {recommend ? "Empfehle ich" : "Weiterempfehlen?"}
          </button>
        ) : (
          shownRecommend && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pop px-3 py-1.5 text-sm font-medium text-white">
              <ThumbsUp className="size-4" />
              Empfiehlt es
            </span>
          )
        )}
      </div>

      {/* Foto */}
      {review?.photoUrl ? (
        <div className="relative overflow-hidden rounded-2xl bg-line">
          <img src={review.photoUrl} alt={`Foto von ${p.name}`} className="aspect-[4/3] w-full object-cover" />
          {editable && (
            <div className="absolute right-2 bottom-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy === "photo"}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-sm text-paper backdrop-blur"
              >
                {busy === "photo" ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
                Ersetzen
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Foto entfernen?")) run("photo", () => removePhoto(restaurantId), "Foto entfernt");
                }}
                aria-label="Foto entfernen"
                className="flex size-8 items-center justify-center rounded-full bg-ink/80 text-paper backdrop-blur"
              >
                <Trash className="size-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        editable && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy === "photo"}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-line py-3 text-sm text-muted"
          >
            {busy === "photo" ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {busy === "photo" ? "Wird hochgeladen …" : "Foto hinzufügen"}
          </button>
        )
      )}
      {editable && (
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickPhoto(e.target.files)}
        />
      )}

      {/* Was gegessen */}
      {editable ? (
        <div className="space-y-2">
          <textarea
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            rows={2}
            placeholder="Was hast du gegessen? z. B. „Tonkotsu Ramen, Gyoza“"
            aria-label="Was hast du gegessen?"
            className="min-h-[3.5rem] w-full resize-none rounded-2xl border border-line bg-paper px-4 py-3 outline-none [field-sizing:content] placeholder:text-muted/70 focus:border-ink"
          />
          {(dishChanged || busy === "dish") && (
            <button
              type="button"
              onClick={() => run("dish", () => saveDish(restaurantId, dish), "Gespeichert")}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-70"
            >
              {busy === "dish" && <LoaderCircle className="size-4 animate-spin" />}
              Speichern
            </button>
          )}
        </div>
      ) : review?.dish ? (
        <p className="whitespace-pre-line">
          <span className="text-sm text-muted">Gegessen: </span>
          {review.dish}
        </p>
      ) : (
        !review?.photoUrl && <p className="text-sm text-muted">Noch nichts eingetragen.</p>
      )}
    </div>
  );
}
