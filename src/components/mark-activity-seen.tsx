"use client";

import { useEffect } from "react";
import { markActivitySeen } from "@/lib/actions";
import { ACTIVITY_SEEN_EVENT } from "./notifications";

/** Markiert beim Öffnen der Aktivitätsseite alles als gelesen. */
export function MarkActivitySeen({ uptoId }: { uptoId: number }) {
  useEffect(() => {
    if (!uptoId) return;
    void markActivitySeen(uptoId).then(() => window.dispatchEvent(new Event(ACTIVITY_SEEN_EVENT)));
  }, [uptoId]);
  return null;
}
