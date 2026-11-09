export const PEOPLE = {
  german: { name: "German", initial: "G", text: "text-german", bg: "bg-german", soft: "bg-german/12", ring: "ring-german" },
  evelyne: { name: "Evelyne", initial: "E", text: "text-evelyne", bg: "bg-evelyne", soft: "bg-evelyne/12", ring: "ring-evelyne" },
} as const;

export type Person = keyof typeof PEOPLE;

export const PERSON_IDS = Object.keys(PEOPLE) as Person[];

export function isPerson(value: unknown): value is Person {
  return typeof value === "string" && value in PEOPLE;
}
