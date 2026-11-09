"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { fetchNewActivity, markActivitySeen } from "@/lib/actions";
import {
  describeActivity,
  timeAgo,
  type ActivityItem,
  type UnreadActivity,
} from "@/lib/activity-format";
import type { Person } from "@/lib/people";
import { Avatar as PersonAvatar } from "./avatar";

const POLL_MS = 20_000;

const noopSubscribe = () => () => {};

/** Wird ausgelöst, wenn die Aktivitätsseite alles als gelesen markiert. */
export const ACTIVITY_SEEN_EVENT = "activity-seen";

/**
 * Glocke mit Zähler, Rückblick-Popup beim Öffnen ("Seit du weg warst")
 * und Live-Hinweis, wenn die andere Person etwas macht, während die App offen ist.
 */
export function Notifications({
  initial,
  avatars,
}: {
  initial: UnreadActivity;
  avatars: Partial<Record<Person, string>>;
}) {
  const router = useRouter();
  const [unread, setUnread] = useState(initial.unread);
  const [recap, setRecap] = useState<{
    title: string;
    items: ActivityItem[];
  } | null>(
    initial.items.length
      ? { title: "Seit du weg warst", items: initial.items }
      : null,
  );
  const [toast, setToast] = useState<ActivityItem[] | null>(null);
  const lastId = useRef(initial.items[0]?.id ?? 0);
  // Popups per Portal an <body>, sonst sperrt sie der Blur-Effekt der Glas-Buttons ein
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // Regelmäßig nach Neuem schauen – und sofort, wenn die App wieder in den Vordergrund kommt
  useEffect(() => {
    let active = true;

    async function check() {
      if (document.visibilityState !== "visible") return;
      const result = await fetchNewActivity(lastId.current);
      if (!active) return;
      setUnread(result.unread);
      if (result.items.length) {
        lastId.current = result.items[0].id;
        setToast(result.items);
        router.refresh();
      }
    }

    const timer = setInterval(check, POLL_MS);
    const onSeen = () => setUnread(0);
    document.addEventListener("visibilitychange", check);
    window.addEventListener(ACTIVITY_SEEN_EVENT, onSeen);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener(ACTIVITY_SEEN_EVENT, onSeen);
    };
  }, [router]);

  // Live-Hinweis blendet sich nach ein paar Sekunden aus
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  function closeRecap() {
    const newest = recap?.items[0]?.id;
    setRecap(null);
    if (newest) {
      setUnread(0);
      void markActivitySeen(Math.max(newest, lastId.current));
    }
  }

  return (
    <>
      <Link
        href="/aktivitaet"
        aria-label={unread ? `Aktivität, ${unread} neu` : "Aktivität"}
        className="press glass relative flex size-10 items-center justify-center rounded-full text-ink"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pop px-1 text-[10px] font-bold text-white tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>

      {mounted &&
        createPortal(
          <>
            {/* Live-Hinweis oben */}
            {toast && !recap && (
              <div className="fixed inset-x-0 top-0 z-40 px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
                <div
                  role="status"
                  className="glass mx-auto flex max-w-sm items-center gap-3 rounded-3xl p-3"
                >
                  <Avatar item={toast[0]} avatars={avatars} />
                  <button
                    type="button"
                    onClick={() => {
                      setRecap({ title: "Neu", items: toast });
                      setToast(null);
                    }}
                    className="min-w-0 flex-1 text-left text-sm"
                  >
                    <span className="line-clamp-2">
                      {describeActivity(toast[0])}
                    </span>
                    {toast.length > 1 && (
                      <span className="text-muted">
                        und {toast.length - 1} weitere
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    aria-label="Hinweis schließen"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Rückblick */}
            {recap && (
              <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
                onClick={(e) => e.target === e.currentTarget && closeRecap()}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="recap-title"
                  className="card w-full max-w-sm rounded-3xl p-4 shadow-2xl"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2
                      id="recap-title"
                      className="font-display text-xl font-semibold"
                    >
                      {recap.title}
                    </h2>
                    <button
                      type="button"
                      onClick={closeRecap}
                      aria-label="Schließen"
                      className="flex size-8 items-center justify-center rounded-full bg-paper text-muted"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <ul className="-mx-1 max-h-[55dvh] space-y-1 overflow-y-auto">
                    {recap.items.map((item) => {
                      const content = (
                        <>
                          <Avatar item={item} avatars={avatars} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm">
                              {describeActivity(item)}
                            </span>
                            <span
                              className="text-xs text-muted"
                              suppressHydrationWarning
                            >
                              {timeAgo(item.createdAt)}
                            </span>
                          </span>
                        </>
                      );
                      return (
                        <li key={item.id}>
                          {item.restaurantId ? (
                            <Link
                              href={`/restaurants/${item.restaurantId}`}
                              onClick={closeRecap}
                              className="flex items-start gap-3 rounded-2xl p-2 hover:bg-paper"
                            >
                              {content}
                            </Link>
                          ) : (
                            <div className="flex items-start gap-3 p-2">
                              {content}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    type="button"
                    onClick={closeRecap}
                    className="press mt-4 w-full rounded-full bg-accent px-5 py-3 font-semibold text-accent-ink"
                  >
                    Alles klar
                  </button>
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </>
  );
}

function Avatar({ item, avatars }: { item: ActivityItem; avatars: Partial<Record<Person, string>> }) {
  return <PersonAvatar person={item.actor} url={avatars[item.actor]} className="size-8 text-xs" />;
}
