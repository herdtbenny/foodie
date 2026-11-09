import { PEOPLE, PERSON_IDS } from "@/lib/people";
import type { Scores } from "@/lib/restaurants";

/** 7.666 → "7,7", 8 → "8" */
export function formatScore(score: number) {
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

/** Kleine Pillen "G 8 · E 9" */
export function ScorePills({ scores }: { scores: Scores }) {
  return (
    <div className="flex gap-1.5">
      {PERSON_IDS.map((person) => {
        const score = scores[person];
        return (
          <span
            key={person}
            title={`${PEOPLE[person].name}: ${score != null ? formatScore(score) : "noch nicht bewertet"}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${PEOPLE[person].soft} ${PEOPLE[person].text}`}
          >
            {PEOPLE[person].initial}
            <span className={score != null ? "" : "opacity-50"}>{score != null ? formatScore(score) : "–"}</span>
          </span>
        );
      })}
    </div>
  );
}
