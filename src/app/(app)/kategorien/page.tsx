import { CategoryManager } from "@/components/category-manager";
import { listCategories } from "@/lib/restaurants";

export const metadata = { title: "Kategorien · Foodie" };

export default async function CategoriesPage() {
  const categories = await listCategories();
  return (
    <div className="space-y-6">
      <div className="space-y-2 px-2">
        <h1 className="font-display text-4xl font-semibold">Kategorien</h1>
        <p className="text-muted">
          Jeder bewertet jede Kategorie von 1 bis 10. Verteilt 100 % darauf, wie stark jede Kategorie in die
          Gesamtnote eingeht. Gilt für euch beide.
        </p>
      </div>
      <CategoryManager key={categories.map((c) => c.id).join("-")} categories={categories} />
    </div>
  );
}
