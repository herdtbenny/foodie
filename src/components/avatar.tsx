/* eslint-disable @next/next/no-img-element -- kleine Profilbilder aus Vercel Blob */
import { PEOPLE, type Person } from "@/lib/people";

/** Profilbild, oder der farbige Anfangsbuchstabe, wenn keins hinterlegt ist. */
export function Avatar({
  person,
  url,
  className,
}: {
  person: Person;
  url?: string;
  className: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`shrink-0 rounded-full object-cover ${PEOPLE[person].avatarPosition} ${className}`}
      />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${PEOPLE[person].bg} ${className}`}
    >
      {PEOPLE[person].initial}
    </span>
  );
}
