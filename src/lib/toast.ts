// Kleine Rückmeldungen ("Gespeichert", Fehler) – angezeigt vom <Toaster /> im App-Layout.

export type ToastKind = "success" | "error";
export type ToastDetail = { message: string; kind: ToastKind };

export const TOAST_EVENT = "app-toast";

export function toast(message: string, kind: ToastKind = "success") {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, kind } }));
}

export const SAVE_FAILED = "Speichern hat nicht geklappt. Bitte nochmal versuchen.";
