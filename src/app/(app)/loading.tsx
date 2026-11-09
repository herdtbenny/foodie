/** Sofortiges Feedback beim Seitenwechsel, während der Server die Seite lädt. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Lädt …">
      <div className="h-11 rounded-full bg-line/70" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-2.5">
          <div className="size-16 shrink-0 rounded-2xl bg-line/70" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 rounded-full bg-line/70" />
            <div className="h-5 w-3/4 rounded-full bg-line/70" />
            <div className="h-4 w-24 rounded-full bg-line/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
