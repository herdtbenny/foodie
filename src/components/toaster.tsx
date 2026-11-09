"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { TOAST_EVENT, type ToastDetail } from "@/lib/toast";

let nextId = 0;

/** Zeigt Speicher-Rückmeldungen über der unteren Navigation. Bleibt beim Seitenwechsel bestehen. */
export function Toaster() {
  const [toasts, setToasts] = useState<(ToastDetail & { id: number })[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const { detail } = event as CustomEvent<ToastDetail>;
      const id = nextId++;
      setToasts((current) => [...current.slice(-2), { ...detail, id }]);
      setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), detail.kind === "error" ? 5000 : 2500);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+5rem)] z-40 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`flex max-w-sm animate-[toast-in_200ms_ease-out] items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/15 ${
            t.kind === "error" ? "bg-red-600 text-white" : "bg-ink text-paper"
          }`}
        >
          {t.kind === "error" ? (
            <CircleAlert className="size-4 shrink-0" />
          ) : (
            <CircleCheck className="size-4 shrink-0 text-benny" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
