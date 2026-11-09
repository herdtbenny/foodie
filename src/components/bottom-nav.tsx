"use client";

import { Bookmark, Map, Plus, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const itemClass =
  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors";

export function BottomNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const tone = (href: string) => (active(href) ? "text-accent" : "text-muted");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4">
      <div className="mx-auto flex max-w-[calc(48rem-2rem)] items-center gap-1 rounded-full border border-line bg-surface/95 p-1.5 shadow-lg shadow-black/5">
        <Link href="/" className={`${itemClass} ${tone("/")}`}>
          <Star className="size-5" />
          Besucht
        </Link>
        <Link href="/wunschliste" className={`${itemClass} ${tone("/wunschliste")}`}>
          <Bookmark className="size-5" />
          Wunschliste
        </Link>
        <Link href="/neu" aria-label="Neues Restaurant" className={`${itemClass} bg-accent text-accent-ink shadow-md`}>
          <Plus className="size-5" strokeWidth={2.5} />
          Neu
        </Link>
        <Link href="/karte" className={`${itemClass} ${tone("/karte")}`}>
          <Map className="size-5" />
          Karte
        </Link>
      </div>
    </nav>
  );
}
