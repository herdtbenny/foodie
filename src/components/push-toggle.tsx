"use client";

import { BellOff, BellRing, LoaderCircle, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/lib/actions";
import { toast } from "@/lib/toast";

type State = "loading" | "install" | "unsupported" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

/** Push-Benachrichtigungen für dieses Gerät an- und abschalten. */
export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        // iPhone: Push gibt es nur in der installierten Homescreen-App
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        setState(ios && !standalone ? "install" : "unsupported");
        return;
      }
      const reg = await registration();
      const subscription = await reg.pushManager.getSubscription();
      if (Notification.permission === "denied") setState("denied");
      else setState(subscription ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await savePushSubscription(subscription.toJSON());
      setState("on");
      toast("Push-Benachrichtigungen aktiviert");
    } catch {
      toast("Aktivieren hat nicht geklappt. Bitte nochmal versuchen.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await registration();
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
      toast("Push-Benachrichtigungen ausgeschaltet");
    } catch {
      toast("Ausschalten hat nicht geklappt.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      await sendTestPush();
      toast("Test gesendet – gleich sollte eine Nachricht kommen");
    } catch {
      toast("Test hat nicht geklappt.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;

  return (
    <div className="card space-y-3 rounded-3xl p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pop/12 text-pop">
          {state === "on" ? <BellRing className="size-5" /> : <BellOff className="size-5" />}
        </span>
        <div className="space-y-1">
          <p className="font-medium">Push-Benachrichtigungen</p>
          <p className="text-sm text-muted">
            {state === "on" && "Aktiv auf diesem Gerät. Du bekommst eine Nachricht, wenn die andere Person etwas einträgt."}
            {state === "off" && "Bekomm eine Nachricht aufs Handy, wenn die andere Person etwas einträgt – auch wenn die App zu ist."}
            {state === "denied" &&
              "Benachrichtigungen sind blockiert. Erlaube sie in den Einstellungen deines Geräts für diese App."}
            {state === "unsupported" && "Dieser Browser unterstützt leider keine Push-Benachrichtigungen."}
            {state === "install" && "Auf dem iPhone gehen Push-Nachrichten nur, wenn die App auf dem Home-Bildschirm ist:"}
          </p>
        </div>
      </div>

      {state === "install" && (
        <ol className="space-y-2 pl-1 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-4 font-semibold text-pop">1</span>
            In Safari unten auf <Share className="inline size-4" /> <strong>Teilen</strong> tippen
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 font-semibold text-pop">2</span>
            <SquarePlus className="inline size-4" /> <strong>Zum Home-Bildschirm</strong> wählen
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 font-semibold text-pop">3</span>
            App vom Home-Bildschirm öffnen und hier aktivieren
          </li>
        </ol>
      )}

      {state === "off" && (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="press flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-accent-ink disabled:opacity-70"
        >
          {busy && <LoaderCircle className="size-5 animate-spin" />}
          Aktivieren
        </button>
      )}

      {state === "on" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={test}
            disabled={busy}
            className="press rounded-full border border-line px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            Test senden
          </button>
          <button
            type="button"
            onClick={disable}
            disabled={busy}
            className="press rounded-full border border-line px-4 py-2.5 text-sm font-medium text-muted disabled:opacity-60"
          >
            Ausschalten
          </button>
        </div>
      )}
    </div>
  );
}
