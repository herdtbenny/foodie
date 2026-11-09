import { PEOPLE, PERSON_IDS } from "@/lib/people";
import type { Scores } from "@/lib/restaurants";

export function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1).replace(".", ",");
}

/** Kleine Pillen "B 8 · L 9" */
export function ScorePills({ scores }: { scores: Scores }) {
  return (
    <div className="flex gap-1.5">
      {PERSON_IDS.map((person) => {
        const score = scores[person];
        return (
          <span
            key={person}
            title={`${PEOPLE[person].name}: ${score ?? "noch nicht bewertet"}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${PEOPLE[person].soft} ${PEOPLE[person].text}`}
          >
            {PEOPLE[person].initial}
            <span className={score ? "" : "opacity-50"}>{score ? `${score}/10` : "–"}</span>
          </span>
        );
      })}
    </div>
  );
}
