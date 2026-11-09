/** Logo: "foodie." in der schmalen Schrift, der Punkt in Rot */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display leading-none font-bold tracking-tight lowercase ${className}`}>
      foodie<span className="text-pop">.</span>
    </span>
  );
}
