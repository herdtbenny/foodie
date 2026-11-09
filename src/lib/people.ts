export const PEOPLE = {
  benny: { name: "Benny", initial: "B", text: "text-benny", bg: "bg-benny", soft: "bg-benny/15", avatarPosition: "object-[center_32%]" },
  lisa: { name: "Lisa", initial: "L", text: "text-lisa", bg: "bg-lisa", soft: "bg-lisa/15", avatarPosition: "object-[center_22%]" },
} as const;

export type Person = keyof typeof PEOPLE;

export const PERSON_IDS = Object.keys(PEOPLE) as Person[];

export function isPerson(value: unknown): value is Person {
  return typeof value === "string" && value in PEOPLE;
}
