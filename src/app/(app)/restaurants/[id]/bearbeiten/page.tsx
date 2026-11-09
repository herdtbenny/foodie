import { redirect } from "next/navigation";

/** Bearbeiten passiert direkt auf der Detailseite – alte Links leiten dorthin um. */
export default async function EditRedirect({ params }: PageProps<"/restaurants/[id]/bearbeiten">) {
  const { id } = await params;
  redirect(`/restaurants/${id}`);
}
