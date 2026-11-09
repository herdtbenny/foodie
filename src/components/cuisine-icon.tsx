import { createElement } from "react";
import {
  Beer,
  Bike,
  CookingPot,
  Coffee,
  Croissant,
  Drumstick,
  Fish,
  Hamburger,
  IceCreamCone,
  Leaf,
  Martini,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";

/** Stichwort (klein geschrieben) → Icon. Erste Übereinstimmung gewinnt. */
const RULES: [string[], LucideIcon][] = [
  [["sushi", "fisch", "japan"], Fish],
  [["ramen", "thai", "asiat", "vietnam", "chines", "korea", "pho", "nudel"], Soup],
  [["pizza", "italien", "pasta"], Pizza],
  [["döner", "doener", "kebab", "imbiss"], Sandwich],
  [["burger", "amerika", "diner"], Hamburger],
  [["indisch", "curry", "kurdisch", "arabisch", "orient"], CookingPot],
  [["türkisch", "grill", "steak"], Drumstick],
  [["griechisch", "salat", "bowl", "acai"], Salad],
  [["vegan", "vegetar"], Leaf],
  [["französisch", "wein"], Wine],
  [["deutsch", "bayer", "bräu", "brau", "wirtshaus"], Beer],
  [["cocktail", "bar", "drinks"], Martini],
  [["eis", "gelato"], IceCreamCone],
  [["frühstück", "brunch"], Croissant],
  [["kaffee", "coffee", "café", "cafe", "rösterei"], Coffee],
  [["bestellung", "liefer"], Bike],
];

export function cuisineIcon(...texts: (string | null | undefined)[]): LucideIcon {
  // Küche zuerst, dann Art, dann Name – so gewinnt "Sushi" vor "Abendessen"
  for (const text of texts) {
    const value = text?.toLowerCase();
    if (!value) continue;
    for (const [words, icon] of RULES) if (words.some((w) => value.includes(w))) return icon;
  }
  return UtensilsCrossed;
}

/** Passendes Icon zur Küche, Art oder zum Namen */
export function CuisineIcon({
  cuisine,
  kind,
  name,
  className,
}: {
  cuisine?: string | null;
  kind?: string | null;
  name?: string | null;
  className?: string;
}) {
  return createElement(cuisineIcon(cuisine, kind, name), { className, strokeWidth: 1.6, "aria-hidden": true });
}
