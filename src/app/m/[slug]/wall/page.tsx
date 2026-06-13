import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { signPhotos } from "@/lib/photos";
import type { Photo } from "@/lib/types";
import { Wall } from "./wall";

export default async function WallPage(props: PageProps<"/m/[slug]/wall">) {
  const { slug } = await props.params;

  const admin = createAdminClient();
  const { data: mural } = await admin
    .from("murals")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!mural) notFound();

  const { data: photos } = await admin
    .from("photos")
    .select("*")
    .eq("mural_id", mural.id)
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(60)
    .returns<Photo[]>();

  const initial = await signPhotos(photos ?? []);

  return (
    <Wall muralId={mural.id} muralName={mural.name} initialPhotos={initial} />
  );
}
