"use client";

import { Heart, Dices, Map, Plus, History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const itemClass =
  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors";

const LEFT = [
  { href: "/karte", label: "Karte", icon: Map },
  { href: "/", label: "Bisherige", icon: History },
];
const RIGHT = [
  { href: "/wunschliste", label: "Wunschliste", icon: Heart },
  { href: "/heute", label: "Wohin?", icon: Dices },
];

/** Karte · Bisherige · Neu · Wunschliste · Wohin heute? */
export function BottomNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const item = ({ href, label, icon: Icon }: (typeof LEFT)[number]) => (
    <Link key={href} href={href} className={`${itemClass} ${active(href) ? "text-pop" : "text-muted"}`}>
      <Icon className="size-5" />
      {label}
    </Link>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4">
      <div className="mx-auto flex max-w-[calc(48rem-2rem)] items-center gap-0.5 rounded-full border border-line bg-surface/95 p-1.5 shadow-lg shadow-black/5">
        {LEFT.map(item)}
        <Link href="/neu" aria-label="Neues Restaurant" className={`${itemClass} bg-accent text-accent-ink`}>
          <Plus className="size-5" strokeWidth={2.5} />
          Neu
        </Link>
        {RIGHT.map(item)}
      </div>
    </nav>
  );
}
