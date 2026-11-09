"use client";

import { LoaderCircle, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteRestaurant } from "@/lib/actions";
import { toast } from "@/lib/toast";

export function DeleteButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`„${title}“ wirklich löschen? Die Bewertungen gehen verloren.`)) return;
        startTransition(async () => {
          try {
            await deleteRestaurant(id);
            toast(`„${title}“ gelöscht`);
            router.push("/");
          } catch {
            toast("Löschen hat nicht geklappt. Bitte nochmal versuchen.", "error");
          }
        });
      }}
      className="mx-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-red-600 disabled:opacity-60"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash className="size-4" />}
      {pending ? "Wird gelöscht …" : "Restaurant löschen"}
    </button>
  );
}
