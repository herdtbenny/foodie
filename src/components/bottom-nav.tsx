"use client";

import { Dices, Heart, History, Map, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/karte", label: "Karte", icon: Map },
  { href: "/", label: "Bisherige", icon: History },
  { href: "/neu", label: "Neu", icon: Plus },
  { href: "/wunschliste", label: "Wunschliste", icon: Heart },
  { href: "/heute", label: "Wohin?", icon: Dices },
];
const NEW_INDEX = 2;

/** Karte · Bisherige · Neu · Wunschliste · Wohin? – Glasleiste mit gleitender Markierung */
export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const activeIndex = ITEMS.findIndex((item, i) => i !== NEW_INDEX && isActive(item.href));
  const width = 100 / ITEMS.length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4">
      <div className="glass relative mx-auto flex max-w-[calc(48rem-2rem)] items-center rounded-full p-1.5">
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="liquid-indicator absolute inset-y-1.5 rounded-full bg-white/80 shadow-[inset_0_1px_0_white,0_4px_12px_-4px_rgb(29_27_24/0.25)]"
            style={{ left: `calc(${activeIndex * width}% + 2px)`, width: `calc(${width}% - 4px)` }}
          />
        )}
        {ITEMS.map(({ href, label, icon: Icon }, i) =>
          i === NEW_INDEX ? (
            <Link
              key={href}
              href={href}
              aria-label="Neues Restaurant"
              className="press glass-ink relative z-10 mx-0.5 flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-semibold"
            >
              <Icon className="size-5" strokeWidth={2.5} />
              {label}
            </Link>
          ) : (
            <Link
              key={href}
              href={href}
              className={`press relative z-10 flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-medium whitespace-nowrap ${
                i === activeIndex ? "text-pop" : "text-muted"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
