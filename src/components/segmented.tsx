"use client";

import type { LucideIcon } from "lucide-react";

/**
 * Umschalter mit gleitender Glas-Pille (Liquid).
 * Alle Optionen gleich breit, die Markierung gleitet zur gewählten.
 */
export function Segmented<T extends string | boolean>({
  options,
  value,
  onChange,
  label,
  size = "md",
  disabled,
}: {
  options: { value: T; label: string; icon?: LucideIcon; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const width = 100 / options.length;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`glass relative grid rounded-full p-1 ${disabled ? "opacity-70" : ""}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="liquid-indicator glass-ink absolute inset-y-1 rounded-full"
        style={{ left: `calc(${index * width}% + 4px)`, width: `calc(${width}% - 8px)` }}
      />
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`press relative z-10 flex items-center justify-center gap-1.5 rounded-full px-2 font-medium whitespace-nowrap ${
              size === "sm" ? "py-1.5 text-sm" : "py-2.5 text-sm"
            } ${active ? "text-paper" : "text-muted hover:text-ink"}`}
          >
            {Icon && <Icon className="size-4" />}
            {o.label}
            {o.count !== undefined && <span className="tabular-nums opacity-60">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
